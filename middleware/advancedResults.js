const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // copy
  let reqQuery = { ...req.query };

  // match
  let matchQuery = ["select", "sort", "page", "limit"];

  // exclude
  matchQuery.forEach((param) => delete reqQuery[param]);
  // stringify
  let queryStr = JSON.stringify(req.query);
  // filtering
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = model.find(JSON.parse(queryStr));

  // select
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // sortBy
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  //pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query.populate(populate);
  }

  const results = await query;

  //pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    sucess: true,
    count: results.length,
    pagination,
    data: results,
  });
};

module.exports = advancedResults;
