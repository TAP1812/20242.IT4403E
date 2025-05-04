const validatePassword = (password) => {
    // Minimum length check
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
};

export const passwordValidationMiddleware = async (req, res, next) => {
    try {
        const { password } = req.body;
        
        // Skip validation if password is not being updated
        if (!password) {
            return next();
        }

        const validationError = validatePassword(password);
        if (validationError) {
            return res.status(400).json({ 
                status: false, 
                message: validationError 
            });
        }

        // Check if password contains username/email
        const { email, name } = req.body;
        const lowerPassword = password.toLowerCase();
        
        if (email && lowerPassword.includes(email.toLowerCase())) {
            return res.status(400).json({
                status: false,
                message: "Password cannot contain your email"
            });
        }

        if (name && lowerPassword.includes(name.toLowerCase())) {
            return res.status(400).json({
                status: false,
                message: "Password cannot contain your name"
            });
        }

        next();
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "Password validation error"
        });
    }
};