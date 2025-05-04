import bcrypt from 'bcryptjs';
import mongoose, {Schema} from 'mongoose';

const userSchema = new Schema({
    name: {type: String, required: true},
    title: {type: String, required: true},
    role: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {
        type: String, 
        required: true,
        select: false // Không trả về password trong queries
    },
    isAdmin: {type: Boolean, required: true, default: false},
    tasks: [{type: Schema.Types.ObjectId, ref: "Task"}],
    isActive: {type: Boolean, required: true, default: true},
    loginAttempts: {type: Number, default: 0}, // Đếm số lần đăng nhập thất bại
    lockUntil: {type: Date}, // Thời gian khóa tài khoản
    lastPasswordChange: {type: Date, default: Date.now}, // Thời gian đổi password gần nhất
    },
    {timestamps: true}
);

userSchema.pre("save", async function (next){
    if (!this.isModified("password")) {
        next();
    }

    // Tăng số vòng salt lên 12 để tăng độ phức tạp
    const salt = await bcrypt.genSalt(12);
    
    // Thêm pepper (secret key) vào password trước khi hash
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper-key';
    const pepperedPassword = this.password + pepper;
    
    this.password = await bcrypt.hash(pepperedPassword, salt);
    this.lastPasswordChange = Date.now();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper-key';
    const pepperedPassword = enteredPassword + pepper;
    return await bcrypt.compare(pepperedPassword, this.password);
};

// Phương thức kiểm tra và cập nhật số lần đăng nhập thất bại
userSchema.methods.incrementLoginAttempts = async function() {
    // Reset login attempts nếu tài khoản đã được mở khóa
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = null;
    } else {
        // Tăng số lần thất bại
        this.loginAttempts += 1;
        
        // Khóa tài khoản nếu đăng nhập thất bại 5 lần
        if (this.loginAttempts >= 5) {
            // Khóa trong 30 phút
            this.lockUntil = Date.now() + (30 * 60 * 1000);
        }
    }
    return this.save();
};

// Kiểm tra xem tài khoản có bị khóa không
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

const User = mongoose.model("User", userSchema);

export default User;