const User = require("../models/user.js");
const ErrorResponse = require("../utils/errorResponse.js");
require("../src/database/db.js");
const asyncHandler = require("../middleware/async.js");
const express = require("express");
const { protect } = require("../middleware/auth.js");
const { sendEmail } = require("../utils/sendEmail.js");
const crypto = require("crypto");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    //token creating
    sendTokenResponse(user, 200, res);
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new ErrorResponse(`Please provide an email and password`, 400)
      );
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }

    //Checking password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }

    //token creating
    sendTokenResponse(user, 200, res);
  })
);

router.get("/logout", async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      res.status(200).json({ success: true, user });
    } catch (e) {
      console.log(e.message);
    }
  })
);

router.put(
  "/updatedetails",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const filedsToUpdate = {
        email: req.body.email,
        name: req.body.name,
      };

      const user = await User.findByIdAndUpdate(req.user.id, filedsToUpdate, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({ success: true, data: user });
    } catch (e) {
      console.log(e.message);
    }
  })
);

router.put(
  "/updatepassword",
  protect,
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      //check password match
      if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse(`Password is incorrect`, 401));
      }

      user.password = req.body.newPassword;
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (e) {
      console.log(e.message);
    }
  })
);

router.post(
  "/forgotpassword",
  asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ErrorResponse(`There is no user with this email`, 404));
    }

    const resetToken = await user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has reuested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        To: user.email,
        Subject: "Password reset token",
        TextBody: message,
      });
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (e) {
      console.log(e);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      return next(new ErrorResponse(`Email could not be sent`, 500));
    }
  })
);

//reset password
router.put(
  "/resetpassword/:resettoken",
  asyncHandler(async (req, res, next) => {
    //Hash token
    const resetToken = req.params.resettoken;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid Token`, 400));
    }

    //reseting passsword
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Get token from the user, create cookie and response
    sendTokenResponse(user, 200, res);
  })
);

// Get token from the user, create cookie and response
const sendTokenResponse = async function (user, statusCode, res) {
  //create token
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};

module.exports = router;
