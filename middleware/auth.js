const jwt = require("jsonwebtoken");
const errorResponse = require("../utils/errorResponse.js");
const User = require("../models/user.js");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("./async.js");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Getting token fron the bearer
    token = req.headers.authorization.split(" ")[1];
  }
  // Getting token from the cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Confirming token exist
  if (!token) {
    return next(new errorResponse(`Not authorize to access this route`, 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (e) {
    return next(new errorResponse(`Not authorize to access this route`, 401));
  }
});

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// module.exports = authorize();
