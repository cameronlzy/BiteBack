import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/menuItem.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: MenuItem } = await import('../../../models/menuItem.model.js');
const { default: authorizedMenuItemOwner } = await import('../../../middleware/authorizedMenuItemOwner.js');

describe('authorizedMenuItemOwner middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'menuItem123' },
            user: { profile: 'owner123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    const mockPopulate = (resolvedValue) => {
            MenuItem.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(resolvedValue),
        });
    };

    it('returns 404 if menu item is not found', async () => {
        mockPopulate(null);

        await authorizedMenuItemOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Menu item not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 if restaurant is not found', async () => {
        mockPopulate({ _id: 'menuItem123', restaurant: null });

        await authorizedMenuItemOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if user is not the owner', async () => {
        const mockRestaurant = { _id: 'resto123', owner: 'anotherOwner456' };
        mockPopulate({ _id: 'menuItem123', restaurant: mockRestaurant });

        await authorizedMenuItemOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Item does not belong to this restaurant'));
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches menuItem and restaurant to req and calls next if authorized', async () => {
        const mockRestaurant = { _id: 'resto123', owner: 'owner123' };
        const mockItem = { _id: 'menuItem123', restaurant: mockRestaurant };

        mockPopulate(mockItem);

        await authorizedMenuItemOwner(req, res, next);

        expect(req.restaurant).toEqual(mockRestaurant);
        expect(req.menuItem).toEqual({ ...mockItem, restaurant: 'resto123' });
        expect(next).toHaveBeenCalled();
    });
});
