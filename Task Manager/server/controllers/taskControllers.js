import express from "express";
import Task from "../models/task.js";
import User from "../models/user.js";
import Notice from "../models/notification.js";
import bucket from "../config/firebase.js";
import { v4 as uuidv4 } from 'uuid';
import { sendUserCreatedMail, sendTaskAssignedMail } from "../utils/mail.js";

const router = express.Router();

export const createTask = async (req, res) => {
  try {
    const { title, team, stage, date, priority } = req.body;

    const uploadedUrls = req.files && req.files.length > 0
      ? await Promise.all(
          req.files.map(file => {
            const fileName = `${uuidv4()}_${file.originalname}`;
            const fileUpload = bucket.file(fileName);
            return new Promise((resolve, reject) => {
              const stream = fileUpload.createWriteStream({
                metadata: { contentType: file.mimetype },
                resumable: false,
              });
              stream.on('error', reject);
              stream.on('finish', async () => {
                await fileUpload.makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                resolve(url);
              });
              stream.end(file.buffer);
            });
          })
        )
      : [];

    const task = await Task.create({
      title,
      team,
      stage: stage.toLowerCase(),
      date,
      priority: priority.toLowerCase(),
      assets: uploadedUrls,
    });

    let text = `New task has been assigned to you.`;
    if (task.team.length > 1) {
      text = text + ` and ${task.team.length - 1} others.`;
    }
    text = text + ` The task priority is set as ${priority} priority, so check and act accordingly. The task date is ${new Date(task.date).toLocaleDateString()}. Thank you!`;

    await Notice.create({
      team,
      text,
      task: task._id,
    });

    // Gửi mail thông báo task cho từng thành viên
    const users = await User.find({ _id: { $in: team } });
    for (const user of users) {
      if (user.email) {
        await sendTaskAssignedMail({
          to: user.email,
          name: user.name,
          title: task.title,
          date: task.date,
          stage: task.stage,
          priority: task.priority,
        });
      }
    }

    return res
      .status(200)
      .json({ status: true, message: "Task created successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to create task" });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    if (task.isTrashed) {
      return res
        .status(404)
        .json({ status: false, message: "Task was deleted" });
    }

    const newTask = await Task.create({
      title: task.title + " - Duplicate",
      team: task.team,
      date: task.date,
      subTasks: task.subTasks,
      assets: task.assets,
      priority: task.priority,
      stage: task.stage,
      activities: task.activities,
      isTrashed: task.isTrashed,
    });

    await newTask.save();

    let text = "New task has been assigned to you";

    if (task?.team?.length > 1) {
      text = text + ` and ${task.team?.length - 1} others.`;
    }

    text =
      text +
      `The task priority is set a ${
        task.priority
      } priority, so check and act accordingly. The task date is ${task.date.toDateString()}. Thank you!`;

    await Notice.create({
      team: newTask.team,
      text,
      task: newTask._id,
    });

    return res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully", newTask });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to duplicate task." });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { type, activity } = req.body;
    const task = await Task.findById(id);
    const data = {
      type,
      activity,
      by: userId,
    };
    task.activities.push(data);
    await task.save();
    return res
      .status(200)
      .json({ status: true, message: "Task activity posted successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to submit task activity" });
  }
};

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name title",
          })
          .sort({ _id: -1 })
      : await Task.find({
          team: { $all: [userId] },
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name title",
          })
          .sort({ _id: -1 });

    const users = await User.find()
      .select("name title createdAt isActive")
      .limit(10)
      .sort({ _id: -1 });

    //group tasks by stage and calculate counts
    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    //group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    //calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTasks,
      graphData: groupData,
    };

    return res.status(200).json({
      status: true,
      message: "Dashboard statistics fetched successfully",
      summary,
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to fetch statistics." });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;

    const { userId, isAdmin } = req.user;

    let query = isAdmin ? { isTrashed: isTrashed ? true : false } : { isTrashed: isTrashed ? true : false, team: { $all: [userId] } };

    if (stage) {
      query.stage = stage;
    }

    let queryResult = isAdmin
      ? Task.find(query)
          .populate({
            path: "team",
            select: "name title email",
          })
          .sort({ _id: -1 })
      : Task.find(query)
          .populate({
            path: "team",
            select: "name title",
          })
          .sort({ _id: -1 });

    const tasks = await queryResult;

    return res.status(200).json({ status: true, tasks });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to get tasks" });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name -_id",
      })
      .sort({ _id: -1 });

    return res.status(200).json({ status: true, task });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to get task details" });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;

    const { id } = req.params;

    const newSubTask = {
      title,
      date,
      tag,
    };
    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

    await task.save();

    return res
      .status(200)
      .json({ status: true, message: "Subtask created successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to add subtask." });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, team, stage, date, priority } = req.body;
    const task = await Task.findById(id);

    const uploadedUrls = req.files && req.files.length > 0
      ? await Promise.all(
          req.files.map(file => {
            const fileName = `${uuidv4()}_${file.originalname}`;
            const fileUpload = bucket.file(fileName);
            return new Promise((resolve, reject) => {
              const stream = fileUpload.createWriteStream({
                metadata: { contentType: file.mimetype },
                resumable: false,
              });
              stream.on('error', reject);
              stream.on('finish', async () => {
                await fileUpload.makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                resolve(url);
              });
              stream.end(file.buffer);
            });
          })
        )
      : [];

    task.title = title;
    task.team = team;
    task.stage = stage.toLowerCase();
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = uploadedUrls;

    await task.save();

    return res
      .status(200)
      .json({ status: true, message: "Task updated successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to update task." });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    task.isTrashed = true;

    await task.save();

    return res
      .status(200)
      .json({ status: true, message: "Task moved to trash successfully" });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to delete task." });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);
      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    return res.status(200).json({
      status: true,
      message:
        actionType === "restore" || actionType === "restoreAll"
          ? "Task restored successfully"
          : "Task deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to clean trash" });
  }
};

export default router;
