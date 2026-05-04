const roleService = require("./role.service");
const asyncHandler = require('../../utils/asyncHandler')
const { success } = require("../../utils/apiResponse");


const getRoles = asyncHandler(async (req ,res)=>{
    const roles = await roleService.getAllRoles();
    res.json(success("rolesFetched", roles));
})


const getRole = asyncHandler(async  (req, res)=> {
    const role = await roleService.getRoleById(req.params.id);
    res.json(success("roleFetched", role));
});

module.exports = {
  getRoles,
  getRole
};