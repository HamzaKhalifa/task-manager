const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        default: 0,
        validate(value) {
           if (value < 0) {
               throw new Error('Age must be a positive number');
           } 
        }
    },
    email: {
        type: String, 
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain the word "password"');
            }
        },
        trim: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', 
    foreignField: 'owner',
})

// On save hook
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.password && user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8);

    next();
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });

    next();
});

userSchema.statics.findOneByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)  throw new Error('Invalid password');

    return user;
    
}

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.tokens.push({ token });
    await user.save();

    return token;
}

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password; 
    delete userObject.tokens;
    delete userObject.avatar;
    
    return userObject
}


const User = mongoose.model('User', userSchema);

module.exports = User;