const mongoose = require("mongoose");
const color = require("colors");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please enter the course title"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  weeks: {
    type: Number,
    required: [true, "Please add number of weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

courseSchema.statics.getAverageCost = async function (bootcampId) {
  let obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  if (obj.length === 0) {
    obj = [{ _id: bootcampId, averageCost: 0 }];
  }

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (e) {
    console.log(e);
  }
};

//call averagecost after save
courseSchema.post("save", async function () {
  this.constructor.getAverageCost(this.bootcamp);
});

//call averagecost before remove
courseSchema.post("remove", async function () {
  this.constructor.getAverageCost(this.bootcamp);
});

const course = mongoose.model("Course", courseSchema);

module.exports = course;
