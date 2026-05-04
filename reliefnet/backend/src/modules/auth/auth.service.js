const { withTransaction } = require('../../config/transaction');
const userRepo = require('../users/user.repository');
const userRoleRepo = require('../user_roles/userRole.repository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rolePermissionRepo = require('../roles/rolePermission.repository');
const {sanitizeUser} = require('../../utils/sanitizeUser')


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const SALT_ROUNDS = 10;

async function register(data) {

  data.email = data.email.toLowerCase().trim();
  
  if (!data.email || !data.password || !data.name) throw new Error('Missing fields');

  return withTransaction(async (client) => {
    const existing = await userRepo.getUserByEmail(client, data.email);
    if (existing){ 
      const err = new Error('User already exists');
      err.statusCode = 409;
      throw err;
    }

    const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await userRepo.createUser(client, data.name, data.email, hash);

    const roles = [];
    const permissions = [];
    const needsRoleSelection = true;

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return {
  user: sanitizeUser(user),
  roles,
  permissions,
  token,
  needsRoleSelection
};
    
  });
}

async function login(data) {

  data.email = data.email.toLowerCase().trim();


  if (!data.email || !data.password) {
    const err = new Error('Missing fields');
err.statusCode = 400;
throw err;
  }

  return withTransaction(async (client) => {
    const user = await userRepo.getUserByEmail(client, data.email);
    if (!user){
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const match = await bcrypt.compare(data.password, user.password_hash || user.passwordHash || '');
    if (!match) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const roles = await userRoleRepo.getUserRoles(client, user.id);
    const roleIds = roles.map(r => r.id);
    const permissions = await rolePermissionRepo.getPermissionsForRoles(client, roleIds);
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

const needsRoleSelection = roles.length === 0;

return {
  user: sanitizeUser(user),
  roles,
  permissions,
  token,
  needsRoleSelection
};
  });
}

module.exports = { register, login };
