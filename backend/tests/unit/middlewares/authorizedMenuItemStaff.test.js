import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/menuItem.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: MenuItem } = await import('../../../models/menuItem.model.js');
const { default: authorizedMenuItemStaff } = await import('../../../middleware/authorizedMenuItemStaff.js');

describe('authorizedMenuItemStaff middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'menuItem123' },
            user: { restaurant: 'resto123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('returns 404 if menu item is not found', async () => {
        MenuItem.findById.mockResolvedValue(null);

        await authorizedMenuItemStaff(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Menu item not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if staff does not belong to the restaurant', async () => {
        const item = {
            _id: 'menuItem123',
            restaurant: {
                toString: () => 'otherResto456',
            },
        };
        MenuItem.findById.mockResolvedValue(item);

        await authorizedMenuItemStaff(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Staff cannot access Item'));
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches menuItem to req and calls next if authorized', async () => {
        const item = {
            _id: 'menuItem123',
            restaurant: {
                toString: () => 'resto123',
            },
        };
        MenuItem.findById.mockResolvedValue(item);

        await authorizedMenuItemStaff(req, res, next);

        expect(req.menuItem).toEqual(item);
        expect(next).toHaveBeenCalled();
    });
});
