const service = require("./user.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/apiResponse");

// Create user (optional, usually not primary if using auth/register)
const createUser = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json(success("userCreated", user));
});

// 🔥 Assign Role (CRITICAL FLOW)
const assignRole = asyncHandler(async (req, res) => {
  // ✅ Get userId from authenticated request (set by auth middleware)
  const userId = req.user?.id;

  // ❗ Only roleId comes from client
  const roleId = Number(req.body.roleId);

  if (!userId) {
    throw new Error("Unauthorized: user not found in token");
  }

  if (isNaN(roleId)) {
    throw new Error("Invalid roleId");
  }

  const result = await service.assignRoleToUser(userId, roleId);

  // ✅ Return FULL SESSION DATA
  res.status(200).json(success("roleAssigned", result));
});

// Get user profile
const getUser = asyncHandler(async (req, res) => {
  const result = await service.getUserProfile(req.params.id);
  res.json(success("userFetched", result));
});

module.exports = {
  createUser,
  assignRole,
  getUser,
};