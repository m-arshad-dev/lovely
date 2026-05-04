const logger = (req, res, next) => {
  const start = Date.now();

  // Log Incoming Request
  console.log("----- Incoming Request -----");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  console.log("Query:", req.query);
  console.log("Body:", req.body);

  // Capture response body
  const originalSend = res.send;

  let responseBody;

  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // When response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log("----- Outgoing Response -----");
    console.log("Time:", new Date().toISOString());
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.getHeaders());
    console.log("Response Body:", responseBody);
    console.log("Duration:", duration + "ms");
    console.log("--------------------------------\n");
  });

  next();
};

module.exports = logger;