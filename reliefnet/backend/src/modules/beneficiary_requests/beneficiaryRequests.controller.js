const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./beneficiaryRequests.service');

const createRequest = asyncHandler(async (req, res) => {
  const created = await service.createBeneficiaryRequest(req.body, req.user);
  res.status(201).json(success('beneficiaryRequestCreated', created));
});

const myRequests = asyncHandler(async (req, res) => {
  const requests = await service.listMyRequests(req.user);
  res.json(success('beneficiaryRequestsFetched', requests));
});

const updateStatus = asyncHandler(async (req, res) => {
  const updated = await service.updateRequestStatus(
    Number(req.params.id),
    req.body.status,
    req.user,
    req.body.notes
  );
  res.json(success('beneficiaryRequestUpdated', updated));
});

module.exports = { createRequest, myRequests, updateStatus };
