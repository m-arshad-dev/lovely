const { withTransaction } = require('../../config/transaction');
const repo = require('./beneficiaryRequests.repository');

const VALID_STATUSES = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

async function createBeneficiaryRequest(payload, user) {
  return withTransaction(async (client) => {
    const created = await repo.createRequest(client, {
      userId: user.id,
      requestType: payload.request_type,
      description: payload.description,
      urgencyLevel: payload.urgency_level,
      latitude: payload.latitude,
      longitude: payload.longitude,
      campaignId: payload.campaign_id
    });

    await repo.addStatusLog(client, {
      requestId: created.id,
      newStatus: created.status,
      changedByUserId: user.id,
      notes: 'Initial request submitted'
    });

    return created;
  });
}

async function listMyRequests(user) {
  return withTransaction(async (client) => repo.listByUser(client, user.id));
}

async function updateRequestStatus(requestId, status, user, notes) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }

  return withTransaction(async (client) => {
    const request = await repo.getById(client, requestId);
    if (!request) throw new Error('Beneficiary request not found');

    const updated = await repo.updateStatus(client, requestId, status);
    await repo.addStatusLog(client, {
      requestId,
      previousStatus: request.status,
      newStatus: status,
      changedByUserId: user.id,
      notes
    });

    return updated;
  });
}

module.exports = { createBeneficiaryRequest, listMyRequests, updateRequestStatus };
