import Notice from "../models/notification.js";
import User from "../models/user.js";
import { createJWT } from "../utils/index.js";

export const registerUser = async (req, res) => {
    try {
        const {name, email, password, isAdmin, role, title} = req.body;

        const userExist = await User.findOne({email});

        if (userExist) {
            return res.status(400).json({status: false, message: "User already exists"});
        }

        const user = await User.create({name, email, password, isAdmin, role, title});

        if (user) {
            isAdmin ? createJWT(res, user._id) : null;
            user.password = undefined;
            res.status(201).json(user);
        } else {
            return res.status(400).json({status: false, message: "User not found"});
        }

    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        // Tìm user và bao gồm cả trường password
        const user = await User.findOne({email}).select('+password');

        // Thông báo lỗi chung cho cả trường hợp sai email hoặc password
        const genericErrorMessage = "Invalid credentials. Please try again.";

        // Nếu không tìm thấy user hoặc user không active
        if (!user || !user?.isActive) {
            return res.status(401).json({
                status: false, 
                message: genericErrorMessage
            });
        }

        // Kiểm tra tài khoản có đang bị khóa
        if (user.isLocked()) {
            // Không tiết lộ thời gian chờ cụ thể
            return res.status(401).json({
                status: false,
                message: "Account is temporarily locked. Please try again later."
            });
        }

        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            // Reset số lần đăng nhập thất bại
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();

            createJWT(res, user._id);
            user.password = undefined;
            res.status(200).json(user);
        } else {
            // Tăng số lần đăng nhập thất bại
            await user.incrementLoginAttempts();
            
            // Không tiết lộ số lần thử còn lại
            return res.status(401).json({
                status: false, 
                message: genericErrorMessage
            });
        }
    } catch (error) {
        console.log(error);
        // Không trả về error.message để tránh lộ thông tin
        return res.status(400).json({
            status: false, 
            message: "An error occurred. Please try again."
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
        });
        return res.status(200).json({status: true, message: "Logout successful"});
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const getTeamList = async (req, res) => {
    try {
        const users = await User.find().select("name title role email isActive");
        return res.status(201).json(users);
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const getNotificationsList = async (req, res) => {
    try {
        const {userId} = req.user;
        const notice = await Notice.findOne({
            team: userId, 
            isRead: {$nin: [userId]},
        }).populate("task", "title");

        return res.status(201).json(notice);
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const {userId, isAdmin} = req.user;
        const {_id} = req.body;
        const id = isAdmin && userId === _id ? userId : isAdmin && userId !== _id ? _id : userId;
        const user = await User.findById(id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.title = req.body.title || user.title;
            user.role = req.body.role || user.role;
            user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

            const updatedUser = await user.save();
            user.password = undefined;
            return res.status(201).json({status: true, message: "User updated successfully", user: updatedUser});
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
}; 

export const markNotificationRead = async (req, res) => {
    try {
        const {userId} = req.user;
        const {isReadType, id} = req.query;

        if (isReadType === "all") {
            await Notice.updateMany(
                {team: userId, isRead: {$nin: [userId]}},
                {$push: {isRead: userId}},
                {new: true}
            );
        } else {
            await Notice.findOneAndUpdate(
                {_id: id, isRead: {$nin: [userId]}},
                {$push: {isRead: userId}},
                {new: true}
            );
        }

        return res.status(201).json({status: true, message: "Notification marked as read"});
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const changeUserPassword = async (req, res) => {
    try {
        const {userId} = req.user;
        const {currentPassword, newPassword} = req.body;
        
        const user = await User.findById(userId).select('+password');

        if (!user) {
            return res.status(404).json({status: false, message: currentPassword.message });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({status: false, message: "Current password is incorrect"});
        }

        // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        const isSamePassword = await user.matchPassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                status: false, 
                message: "New password must be different from current password"
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            status: true, 
            message: "Password changed successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const activateUserProfile = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);

        if (user) {
            user.isActive = req.body.isActive;
            await user.save();
            return res.status(201).json({status: true, message: `User account has been ${user?.isActive ? "activated" : "disabled"} successfully`});
          } else {
            return res.status(404).json({ status: false, message: "User not found" });
          }
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};

export const deleteUserProfile = async (req, res) => {
    try {
        const {id} = req.params;

        await User.findByIdAndDelete(id);
        return res.status(201).json({status: true, message: "User deleted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(400).json({status: false, message: error.message});
    }
};