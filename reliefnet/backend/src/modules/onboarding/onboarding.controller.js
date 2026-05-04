const service = require("./onboarding.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/apiResponse");

// CREATE TEMPLATE
const createTemplate = asyncHandler(async (req, res) => {
    const result = await service.createTemplate(req.body);
    res.status(201).json(success("templateCreated", result));
});

// ADD STEP
const addStep = asyncHandler(async (req, res) => {
    const result = await service.addStep(req.body);
    res.status(201).json(success("stepAdded", result));
});

// GET TEMPLATE WITH STEPS
const getTemplate = asyncHandler(async (req, res) => {
    const result = await service.getTemplate(req.params.id);
    res.json(success("templateFetched", result));
});

const getDefaultTemplate = asyncHandler(async (req, res) => {
    const result = await service.getDefaultTemplate(req.params.roleId);
    res.json(success("defaultTemplateFetched", result));
});

module.exports = {
    createTemplate,
    addStep,
    getTemplate,
    getDefaultTemplate
};