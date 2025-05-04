import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbConnection from "./utils/index.js";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddlewares.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8800;

// Connect to MongoDB
dbConnection();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Error Handling
app.use(routeNotFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
