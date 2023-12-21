const path = require("path");
const express = require("express");
const Bootcamp = require("../models/bootcamp.js");
const ErrorResponse = require("../utils/errorResponse.js");
require("../src/database/db.js");
const asyncHandler = require("../middleware/async.js");
const geocoder = require("../utils/geocoder.js");
const advancedResults = require("../middleware/advancedResults.js");
const { protect, authorize } = require("../middleware/auth.js");

const courseRouter = require("./course.js");
const reviewRouter = require("./review.js");
const { Error } = require("mongoose");

const router = express.Router();
//reroute in other routers
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

router.post(
  "/",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    if (publishedBootcamp && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `The user with id ${req.user.id} has already created bootcamp.`
        )
      );
    }

    const bootcamp = new Bootcamp(req.body);

    try {
      await bootcamp.save();
      res.status(201).send({ sucess: true, data: { bootcamp } });
    } catch (e) {
      next(e);
    }
  })
);

router.get(
  "/",
  asyncHandler(advancedResults(Bootcamp, "courses"), async (req, res, next) => {
    res.json(res.advancedResults());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    try {
      const id = req.params.id;
      const bootcamps = await Bootcamp.findById({ _id: id });
      res.json({ success: true, data: bootcamps });
    } catch (e) {
      next(e);
    }
  })
);

router.get("/radius/:zipcode/:distance", async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;
    const loc = await geocoder(zipcode);

    long = loc.location.x;
    lat = loc.location.y;

    const radius = distance / 3963.2;

    const bootcamps = await Bootcamp.find({
      location: {
        $geoWithin: { $centerSphere: [[long, lat], radius] },
      },
    });

    res
      .status(200)
      .json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (e) {
    next(e.message);
  }
});

// router.put("/:id", async (req, res) => {
//   const { id } = req.params;
//   const allowedUpdate = [
//     "name",
//     "description",
//     "website",
//     "phone",
//     "email",
//     "address",
//     "photo",
//     "housing",
//     "jobAssistance",
//     "jobGuarantee",
//     "acceptGi",
//   ];
//   const updates = Object.keys(req.body);

//   const isValidOperation = updates.every((update) =>
//     allowedUpdate.includes(update)
//   );

//   if (!isValidOperation) {
//     return res.status(400).send({ error: "Invalid Updates!" });
//   }

//   try {
//     const bootcamp = await Bootcamp.findById({ _id: id });
//     updates.forEach((update) => (bootcamp[update] = req.body[update]));
//     res.status(200).send({ success: true, data: bootcamps });
//   } catch (e) {
//     console.log(e.message);
//   }
// });

router.put(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    try {
      let bootcamp = await Bootcamp.findById(req.params.id);

      if (!bootcamp) {
        return next(
          new ErrorResponse(
            `Bootcamp not found with id of ${req.params.id}`,
            404
          )
        );
      }

      // Make Sure the bootcamp is of the login user
      if (
        bootcamp.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return next(
          new ErrorResponse(
            `The user ${req.user.id} is not authorized to update this bootcamp`,
            401
          )
        );
      }

      bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({ success: true, data: bootcamp });
    } catch (e) {
      next(e);
    }
  })
);

router.delete(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    try {
      const bootcamp = await Bootcamp.findById(req.params.id);
      if (!bootcamp) {
        return next(
          new ErrorResponse(
            `No bootcamp found with id of ${req.params.id}`,
            404
          )
        );
      }
      // Make Sure the bootcamp is of the login user
      if (
        bootcamp.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return next(
          new ErrorResponse(
            `The user ${req.user.id} is not authorized to delete this bootcamp`,
            401
          )
        );
      }
      bootcamp.remove();
      res
        .status(200)
        .send({ Sucess: true, text: "Bootcamp deleted Successfully!" });
    } catch (e) {
      next(e);
    }
  })
);

router.put(
  "/:id/photos",
  protect,
  authorize("publisher", "admin"),
  asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp found with id of ${req.params.id}`, 404)
      );
    }

    // Make Sure the bootcamp is of the login user
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `The user ${req.user.id} is not authorized to update this bootcamp`
        )
      );
    }

    try {
      const file = req.files.files;
      if (!file.mimetype.startsWith("image")) {
        return next(new ErrorResponse(`Please Upload an image`, 400));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please Upload a size of image below ${
              process.env.MAX_FILE_UPLOAD / 1000000
            } MB`,
            400
          )
        );
      }

      file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

      file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
        if (err) {
          console.error(err);
          return next(new ErrorResponse(`Failed to Upload Photo`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
        res.status(200).send({ Sucess: true, photo: file.name });
      });
    } catch (e) {
      next(e);
    }
  })
);

module.exports = router;
