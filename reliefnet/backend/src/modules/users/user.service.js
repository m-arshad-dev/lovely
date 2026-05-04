const { withTransaction } = require("../../config/transaction");

const userRepo = require("./user.repository");
const roleRepo = require("../roles/role.repository");
const userRoleRepo = require("../user_roles/userRole.repository");
const rolePermissionRepo = require("../roles/rolePermission.repository");

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

//
// 🟢 CREATE USER (REGISTER FLOW)
//
async function createUser(data) {
  return withTransaction(async (client) => {
    try {
      const hash = await bcrypt.hash(data.password, SALT_ROUNDS);

      const user = await userRepo.createUser(
        client,
        data.name,
        data.email,
        hash
      );

      // no role assignment here (handled later in /assign-role flow)

      return user;
    } catch (err) {
      if (err.code === "23505") {
        throw new Error("User already exists");
      }
      throw err;
    }
  });
}

//
// 🟢 ASSIGN ROLE (CRITICAL FLOW AFTER REGISTRATION)
//
async function assignRoleToUser(userId, roleId) {
  return withTransaction(async (client) => {
    const user = await userRepo.getUserById(client, userId);
    if (!user) throw new Error("User not found");

    const role = await roleRepo.getRoleById(client, roleId);
    if (!role) throw new Error("Role not found");

    // assign role
    await userRoleRepo.assignRole(client, userId, roleId);

    // reload updated roles
    const roles = await userRoleRepo.getUserRoles(client, userId);
    const roleIds = roles.map((r) => r.role_id || r.id);

    // load permissions
    const permissions =
      await rolePermissionRepo.getPermissionsForRoles(client, roleIds);

    const updatedUser = await userRepo.getUserById(client, userId);

    return {
      user: updatedUser,
      roles,
      permissions,
      needsRoleSelection: false,
    };
  });
}

//
// 🟢 GET USER PROFILE
//
async function getUserProfile(userId) {
  return withTransaction(async (client) => {
    const user = await userRepo.getUserById(client, userId);

    if (!user) throw new Error("User not found");

    const roles = await userRoleRepo.getUserRoles(client, userId);

    const roleIds = roles.map((r) => r.role_id || r.id);

    const permissions =
      await rolePermissionRepo.getPermissionsForRoles(client, roleIds);

    return {
      ...user,
      roles,
      permissions,
    };
  });
}

module.exports = {
  getUserProfile,
  createUser,
  assignRoleToUser,
};