import jwt from "jsonwebtoken";
import User from "../models/user.js";

const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = await User.findById(decoded.userId).select("-password");
        req.user = { userId: decoded.userId, isAdmin: decoded.isAdmin };
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed");
    }
};

const isAdminRoute = async (req, res, next) => {
    try {
        const user = req.user;
        if (user && user.isAdmin) {
            next();
        } else {
            res.status(403);
            throw new Error("Not authorized as admin");
        }
    } catch (error) {
        res.status(403);
        throw new Error("Not authorized as admin");
    }
};

export { protectRoute, isAdminRoute };