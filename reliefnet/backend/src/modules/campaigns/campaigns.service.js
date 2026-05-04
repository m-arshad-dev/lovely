const { withTransaction } = require('../../config/transaction');
const repo = require('./campaigns.repository');

async function createCampaign(data, user) {

  return withTransaction(async (client) => {

    const activeRole = user.roles?.find(r => r.is_active);

    if (!activeRole) {
      throw new Error('Complete onboarding first');
    }

    return await repo.createCampaign(client, {
      ...data,
      created_by: user.id,
      user_role_id: activeRole.user_role_id
    });
  });
}

async function activateCampaign(id) {
  return withTransaction(async (client) => {

    const campaign = await repo.getCampaignById(client, id);

    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'DRAFT') {
      throw new Error('Only DRAFT campaigns can be activated');
    }

    return repo.updateStatus(client, id, 'ACTIVE');
  });
}

module.exports = {
  createCampaign,
  activateCampaign
};

