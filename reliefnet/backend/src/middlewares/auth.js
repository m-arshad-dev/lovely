// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) throw new Error("No token provided");

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = { id: decoded.sub };

  next();
};