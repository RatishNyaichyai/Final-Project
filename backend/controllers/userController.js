const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErr = require('../middleware/catchAssyncError');
const User = require('../models/userModel');
const sendToken = require('../utils/jswtToken');
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

// Register a user
exports.registerUser = catchAsyncErr(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({
        name, email, password,
        avatar: {
            public_id: 'This is a sample id',
            url: "profilePicUrl",
        },
    });

    sendToken(user, 201, res);

});


//Login user
exports.loginUser = catchAsyncErr(async (req, res, next) => {

    const { email, password } = req.body;

    //checking if user has given password and email both
    if (!email || !password) {
        return next(new ErrorHandler('Please enter Email & Password', 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    const isPasswordMatched = user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Incalid email or password', 401))
    }
    sendToken(user, 200, res);

})

//Logout User
exports.logout = catchAsyncErr(async (req, res, next) => {

    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    res.status(200).json({
        success: true,
        message: "Logged Out",
    })
})

// Forgot Password
exports.forgotPassword = catchAsyncErr(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    //Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is:- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it`;

    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,

        });

        res.status(200).json({
            success: true,
            message: `Email send to ${user.email} successfully`,
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});

// Reset Password
exports.restPassword = catchAsyncErr(async (req, res, next) => {

    //Creating token hash
    constresetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler('Reset Password Token is invalid orhas been expired', 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res)

});

//Get User Detail
exports.getUserDetails = catchAsyncErr(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,

    })
})

//Update User Password
exports.updatePassword = catchAsyncErr(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('+password');

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect ", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesn't match"), 400)
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res)
})

//Update User Profile
exports.updateProfile = catchAsyncErr(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    //We will add cloudinary later

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        userFindandModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

//Get all users(admin)
exports.getAllUser = catchAsyncErr(async (req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        success: true,
        users,
    })
})

//Get single user(admin)
exports.getSingleUser = catchAsyncErr(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not exit with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user,
    })
})

//Update User Role -- Admin
exports.updateUserRole = catchAsyncErr(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        userFindandModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

//Delete User --Admin
exports.deleteUser = catchAsyncErr(async (req, res, next) => {

    const user = await User.findById(req.params.id);
    // We will remove cloudinary later..

    if (!user) {
        return next(new ErrorHandler(`User doesnot exits with Id: ${req.params.id} `), 400)
    }

    await user.remove()

    res.status(200).json({
        success: true,
        message: "User Delete successfully"
    })

});