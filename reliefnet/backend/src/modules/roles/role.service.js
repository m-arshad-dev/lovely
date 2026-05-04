const { withTransaction } = require('../../config/transaction');
const roleRepo = require('./role.repository');

async function getAllRoles() {
return withTransaction(async (client) =>{
            const roles = await roleRepo.getAllRoles(client);

        if (roles.length === 0) {
            throw new Error("No roles exist in the system");
        }
        return roles;
})

}

async function getRoleById(id) {
return withTransaction(async (client) => {
            const role = await roleRepo.getRoleById(client ,id);

        if (!role) {
            throw new Error("Role not found");
        }

        return role;
})
}

module.exports = {
    getAllRoles,
    getRoleById
};