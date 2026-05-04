const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/apiResponse");
const service = require("./session.service");
const { withTransaction } = require("../../config/transaction");

// GET /session
const getSession = asyncHandler(async (req, res) => {

  const userId = req.user.id;

  const session = await withTransaction(async (client) => {
    return await service.buildSession(client, userId);
  });

  res.json(success("sessionFetched", session));
});

module.exports = {
  getSession
};