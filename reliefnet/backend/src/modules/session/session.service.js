const userRepo = require("../users/user.repository");
const userRoleRepo = require("../user_roles/userRole.repository");
const rolePermissionRepo = require("../roles/rolePermission.repository");
const onboardingRepo = require("../onboarding/onboarding.repository");

async function buildSession(client, userId) {

  // 1. Get user
  const user = await userRepo.getUserById(client, userId);
  if (!user) throw new Error("User not found");

  // 2. Get roles
  const roles = await userRoleRepo.getUserRoles(client, userId);

  // 3. Active role
  const activeRole = roles.find(r => r.is_active) || null;

  const roleIds = roles.map(r => r.id);

  // 4. Permissions
  const permissions =
    roleIds.length > 0
      ? await rolePermissionRepo.getPermissionsForRoles(client, roleIds)
      : [];

  // 5. Onboarding state (ONLY if active role exists)
  let onboardingState = null;

  if (activeRole) {
    onboardingState = await onboardingRepo.getUserOnboardingState(
      client,
      activeRole.user_role_id
    );
  }

  const isOnboardingComplete = !!activeRole?.is_active;

  // 6. Access rules (centralized logic)
  const access = {
    canCreateCampaign: isOnboardingComplete,
    canAccessDashboard: isOnboardingComplete
  };

  // 7. Final session object
  return {
    user,
    roles,
    activeRole,
    permissions,

    onboarding: {
      isCompleted: isOnboardingComplete,
      flowId: onboardingState?.flow_id || null,
      currentStep: onboardingState?.current_step || null,
      needsRoleSelection: roles.length === 0
    },

    access
  };
}

module.exports = {
  buildSession
};