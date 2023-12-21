const User = require("../models/user.js");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("../middleware/async.js");
const express = require("express");
const { protect, authorize } = require("../middleware/auth.js");
const advancedResults = require("../middleware/advancedResults.js");

const router = express.Router();
router.use(protect);
router.use(authorize("admin"));

router.get(
  "/",
  advancedResults(User),
  asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    const user = await User.create(req.body);
    res.status(200).json({ success: true, user });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }
    res.status(200).json({ success: true, user });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new ErrorResponse(`Invalid credentials`, 401));
    }
    res.status(200).json({ success: true, user });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, user: {} });
    } catch (e) {
      console.log(e.message);
    }
  })
);

module.exports = router;
