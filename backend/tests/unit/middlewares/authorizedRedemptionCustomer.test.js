import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/rewardRedemption.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: RewardRedemption } = await import('../../../models/rewardRedemption.model.js');
const { default: authorizedRedemptionCustomer } = await import('../../../middleware/authorizedRedemptionCustomer.js');

describe('authorizedRedemptionCustomer middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'redemption123' },
            user: { profile: 'customer123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 404 if reward redemption is not found', async () => {
        RewardRedemption.findById.mockResolvedValue(null);

        await authorizedRedemptionCustomer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Reward redemption not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if redemption does not belong to customer', async () => {
        const mockRedemption = {
            customer: {
                toString: () => 'otherCustomer456',
            },
        };

        RewardRedemption.findById.mockResolvedValue(mockRedemption);

        await authorizedRedemptionCustomer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Reward Redemption does not belong to customer'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should attach redemption and call next if authorized', async () => {
        const mockRedemption = {
            _id: 'redemption123',
            customer: {
                toString: () => 'customer123',
            },
        };

        RewardRedemption.findById.mockResolvedValue(mockRedemption);

        await authorizedRedemptionCustomer(req, res, next);

        expect(req.rewardRedemption).toEqual(mockRedemption);
        expect(next).toHaveBeenCalled();
    });
});
