import Notice from "../models/notification.js";
import User from "../models/user.js";
import { createJWT } from "../utils/index.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, isAdmin, role, title } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res
        .status(400)
        .json({ status: false, message: "User already exists" });
    }

    // Tạo password ngẫu nhiên phía server, đảm bảo đủ mạnh theo middleware
    function generateStrongPassword(name, email) {
      const specials = '!@#$%^&*()_+[]{}|;:,.<>?';
      const lowers = 'abcdefghijklmnopqrstuvwxyz';
      const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let password = '';
      // Đảm bảo mỗi loại ký tự đều có ít nhất 1 ký tự
      password += specials[Math.floor(Math.random() * specials.length)];
      password += lowers[Math.floor(Math.random() * lowers.length)];
      password += uppers[Math.floor(Math.random() * uppers.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      // Thêm ngẫu nhiên các ký tự còn lại
      const all = specials + lowers + uppers + numbers;
      while (password.length < 12) {
        password += all[Math.floor(Math.random() * all.length)];
      }
      // Đảm bảo không chứa tên hoặc email
      if (name && password.toLowerCase().includes(name.toLowerCase())) {
        return generateStrongPassword(name, email);
      }
      if (email && password.toLowerCase().includes(email.toLowerCase())) {
        return generateStrongPassword(name, email);
      }
      // Xáo trộn chuỗi
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    const randomPassword = generateStrongPassword(name, email);

    await User.create({
      name,
      email,
      password: randomPassword,
      isAdmin,
      role,
      title,
    });
    // Chỉ trả về thông báo thành công, không trả về user hay password
    return res.status(201).json({
      status: true,
      message: "User created successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("name title role email isActive isAdmin +password");

    const genericErrorMessage = "Invalid credentials. Please try again.";

    if (!user || !user?.isActive) {
      return res.status(401).json({
        status: false,
        message: genericErrorMessage,
      });
    }

    if (user.isLocked()) {
      return res.status(401).json({
        status: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      createJWT(res, user._id, user.isAdmin);
      user.password = undefined;
      return res.status(200).json(user);
    } else {
      await user.incrementLoginAttempts();

      return res.status(401).json({
        status: false,
        message: genericErrorMessage,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: false,
      message: "An error occurred. Please try again.",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    return res.status(200).json({ status: true, message: "Logout successful" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive");
    return res.status(201).json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getNotificationsList = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notice = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    return res.status(201).json(notice);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { _id } = req.body;
    const id =
      isAdmin && userId === _id
        ? userId
        : isAdmin && userId !== _id
        ? _id
        : userId;
    const user = await User.findById(id).select("name email title role");

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.title = req.body.title || user.title;
      user.role = req.body.role || user.role;
      // user.isActive =
      //   req.body.isActive !== undefined ? req.body.isActive : user.isActive;

      const updatedUser = await user.save();
      user.password = undefined;
      return res
        .status(201)
        .json({
          status: true,
          message: "User updated successfully",
          user: updatedUser,
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    } else {
      await Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    return res
      .status(201)
      .json({ status: true, message: "Notification marked as read" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: currentPassword.message });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Current password is incorrect" });
    }

    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        status: false,
        message: "New password must be different from current password",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive;
      await user.save();
      return res
        .status(201)
        .json({
          status: true,
          message: `User account has been ${
            user?.isActive ? "activated" : "disabled"
          } successfully`,
        });
    } else {
      return res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);
    return res
      .status(201)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
