import axios from 'axios';

export const verifyCaptcha = async (req, res, next) => {
    try {
        const { captchaToken } = req.body;
        
        // Bỏ qua xác thực CAPTCHA nếu chưa đến ngưỡng cần thiết
        if (!req.session?.loginAttempts || req.session.loginAttempts < 3) {
            return next();
        }

        // Yêu cầu CAPTCHA sau 3 lần thất bại
        if (!captchaToken) {
            return res.status(400).json({
                status: false,
                message: "CAPTCHA verification required"
            });
        }

        // Xác thực token với Google reCAPTCHA
        const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
        const response = await axios.post(verificationURL, null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaToken
            }
        });

        if (!response.data.success) {
            return res.status(400).json({
                status: false,
                message: "CAPTCHA verification failed"
            });
        }

        next();
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        return res.status(500).json({
            status: false,
            message: "Error verifying CAPTCHA"
        });
    }
};