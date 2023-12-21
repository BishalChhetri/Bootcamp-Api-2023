const path = require("path");
const express = require("express");
const request = require("request");
const fileUpload = require("express-fileupload");
const errorHandler = require("./middleware/error.js");
const cookieParser = require("cookie-parser");

const bootcampRouter = require("./controller/bootcamp.js");
const courseRouter = require("./controller/course.js");
const authentication = require("./controller/auth.js");
const usersRoute = require("./controller/users.js");
const reviewRouter = require("./controller/review.js");

//security
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

const port = process.env.PORT;

const app = express();

//Body Parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());

//use file upload
app.use(fileUpload());

// Sanitize data
app.use(mongoSanitize());

// Set security header
app.use(helmet());

//Prevent Xss attacks
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

//Prevent http param pollution
app.use(hpp());

//Enable Cors
app.use(cors());

// static folder
app.use(express.static(path.join(__dirname, "public")));

//mount routers
app.use("/api/v1/bootcamps", bootcampRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/auth", authentication);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/reviews", reviewRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
