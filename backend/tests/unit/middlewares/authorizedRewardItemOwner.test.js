import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/rewardItem.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: RewardItem } = await import('../../../models/rewardItem.model.js');
const { default: authorizedRewardItemOwner } = await import('../../../middleware/authorizedRewardItemOwner.js');

describe('authorizedRewardItemOwner middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
        params: { itemId: 'item123', id: 'resto123' },
        };
        res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 404 if reward item is not found', async () => {
        RewardItem.findById.mockResolvedValue(null);

        await authorizedRewardItemOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Reward item not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if reward item does not belong to the restaurant', async () => {
        RewardItem.findById.mockResolvedValue({ restaurant: 'wrongResto' });

        await authorizedRewardItemOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Item does not belong to this restaurant'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should attach rewardItem and call next if valid and authorized', async () => {
        const mockItem = { _id: 'item123', restaurant: 'resto123' };

        RewardItem.findById.mockResolvedValue(mockItem);

        await authorizedRewardItemOwner(req, res, next);

        expect(req.rewardItem).toEqual(mockItem);
        expect(next).toHaveBeenCalled();
    });

    it('should skip restaurant check if req.params.id is not provided', async () => {
        const mockItem = { _id: 'item123', restaurant: 'someResto' };
        req.params = { itemId: 'item123' }; // no restaurant id

        RewardItem.findById.mockResolvedValue(mockItem);

        await authorizedRewardItemOwner(req, res, next);

        expect(req.rewardItem).toEqual(mockItem);
        expect(next).toHaveBeenCalled();
    });
});
