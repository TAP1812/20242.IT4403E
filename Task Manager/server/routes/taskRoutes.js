import express from 'express';
import { isAdminRoute, protectRoute } from '../middlewares/authMiddlewares.js';
import { createSubTask, createTask, dashboardStatistics, deleteRestoreTask, duplicateTask, getTask, getTasks, postTaskActivity, trashTask, updateTask } from '../controllers/taskControllers.js';
import uploadAssets from '../middlewares/uploadMiddlewares.js';

const router = express.Router();

router.post("/create", protectRoute, isAdminRoute, uploadAssets, createTask);
router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);

router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/:id", protectRoute, getTask);

router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, isAdminRoute, uploadAssets, updateTask);
router.put("/:id", protectRoute, isAdminRoute, trashTask);

router.delete("/delete-restore/:id", protectRoute, isAdminRoute, deleteRestoreTask);
router.delete("/delete-restore", protectRoute, isAdminRoute, deleteRestoreTask)

export default router;
