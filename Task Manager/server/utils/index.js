import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    } catch (error){
        console.log("Error connecting to MongoDB:", error);
    }
};

export default dbConnection;

export const createJWT = (res, userId, isAdmin) => {
    const token = jwt.sign({userId, isAdmin}, process.env.JWT_SECRET, {expiresIn: "1d"});
    res.cookie("token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV !== "development",
        secure: true,
        sameSite: "Strict", //prevent CSRF 
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
}