import rateLimit from 'express-rate-limit';

// Rate limiter cho toàn bộ API
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 requests từ mỗi IP
    handler: (req, res) => {
        return res.status(429).json({
            status: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter đặc biệt cho login attempts
export const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // Giới hạn 5 requests từ mỗi IP
    handler: (req, res) => {
        return res.status(429).json({
            status: false,
            message: 'Too many login attempts from this IP, please try again after an hour.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Không tính các lần đăng nhập thành công
});