const service = require("./onboarding_flow.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/apiResponse");

const startFlow = asyncHandler(async (req, res) => {
    const { userRoleId, templateId, user_role_id, template_id } = req.body;
    const normalizedUserRoleId = userRoleId || user_role_id;
    const normalizedTemplateId = templateId || template_id;

    const result = await service.startFlow(req.user.id, normalizedUserRoleId, normalizedTemplateId);

    res.status(201).json(success("flowStarted", result));
});

const getFlow = asyncHandler(async (req, res) => {
    const result = await service.getFlow(req.user.id, req.params.id);
    res.json(success("flowFetched", result));

});

module.exports = {
    startFlow,
    getFlow
};