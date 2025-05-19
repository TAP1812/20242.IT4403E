import Notice from "../models/notification.js";
import User from "../models/user.js";
import { createJWT } from "../utils/index.js";
import { sendUserCreatedMail, sendResetPasswordMail } from "../utils/mail.js";
import crypto from "crypto";

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

    // Gửi mail thông báo tài khoản cho user
    await sendUserCreatedMail({
      to: email,
      name,
      title,
      role,
      password: randomPassword,
    });

    return res.status(201).json({
      status: true,
      message: "User created successfully"
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to create user" });
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
    return res.status(400).json({ status: false, message: "Failed to logout" });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive");
    return res.status(201).json(users);
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to get users" });
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
    return res.status(400).json({ status: false, message: "Failed to get notifications." });
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
    const user = await User.findById(id).select("name email title role isAdmin isActive");

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
    return res.status(400).json({ status: false, message: "Failed to update user profile" });
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
    return res.status(400).json({ status: false, message: "Failed to mark as read" });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
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
    return res.status(400).json({ status: false, message: "Failed to change password." });
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
    return res.status(400).json({ status: false, message: "Failed to change user status" });
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
    return res.status(400).json({ status: false, message: "Failed to delete user" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    // Tạo token và hạn sử dụng
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 phút
    await user.save();
    // Gửi mail chứa link reset
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await sendResetPasswordMail({
      to: user.email,
      name: user.name,
      resetLink
    });
    return res.status(200).json({ status: true, message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to reset password" });
  }
};

export const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Không tiết lộ email có tồn tại hay không
    if (!user) {
      return res.status(200).json({ status: true, message: "If this email exists, a reset link has been sent." });
    }
    // Tạo token và hạn sử dụng
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 phút
    await user.save();
    // Gửi mail chứa link reset
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await sendResetPasswordMail({
      to: user.email,
      name: user.name,
      resetLink
    });
    return res.status(200).json({ status: true, message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to reset password" });
  }
};

export const confirmResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ status: false, message: "Invalid or expired token." });
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(200).json({ status: true, message: "Password has been reset successfully." });
  } catch (error) {
    return res.status(400).json({ status: false, message: "Failed to reset password" });
  }
};
