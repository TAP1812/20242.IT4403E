import express from 'express';
import { isAdminRoute, protectRoute } from '../middlewares/authMiddlewares.js';
import { passwordValidationMiddleware } from '../middlewares/passwordMiddleware.js';
import { verifyCaptcha } from '../middlewares/captchaMiddleware.js';
import { globalLimiter, loginLimiter } from '../middlewares/rateLimitMiddleware.js';
import { activateUserProfile, changeUserPassword, deleteUserProfile, getNotificationsList, getTeamList, loginUser, logoutUser, markNotificationRead, registerUser, updateUserProfile, resetPassword, requestResetPassword, confirmResetPassword } from '../controllers/userControllers.js';

const router = express.Router();

// Áp dụng global rate limiting cho tất cả routes
router.use(globalLimiter);

// Áp dụng login rate limiting cho route login
router.post("/login", loginLimiter, verifyCaptcha, loginUser);

// Các routes khác
router.post("/register", passwordValidationMiddleware, protectRoute, isAdminRoute, registerUser);
router.post("/logout", logoutUser);
router.post("/reset-password", resetPassword);
router.post("/request-reset-password", globalLimiter, requestResetPassword);
router.post("/confirm-reset-password", passwordValidationMiddleware, confirmResetPassword);

router.get("/get-team", protectRoute, isAdminRoute, getTeamList);
router.get("/notifications", protectRoute, getNotificationsList);

router.put("/profile", protectRoute, updateUserProfile);
router.put("/read-noti", protectRoute, markNotificationRead);
router.put("/change-password", protectRoute, passwordValidationMiddleware, changeUserPassword);

router
  .route("/:id")
  .put(protectRoute, isAdminRoute, activateUserProfile)
  .delete(protectRoute, isAdminRoute, deleteUserProfile);

export default router;
