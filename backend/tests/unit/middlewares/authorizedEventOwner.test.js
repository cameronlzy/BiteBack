import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/event.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: Event } = await import('../../../models/event.model.js');
const { default: authorizedEventOwner } = await import(
    '../../../middleware/authorizedEventOwner.js'
);

describe('authorizedEventOwner middleware', () => {
    let req, res, next;

    const stubPopulate = (resolvedValue) => {
        Event.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(resolvedValue),
        });
    };

    beforeEach(() => {
        req = {
            params: { id: 'event123' },
            user: { profile: 'owner123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('returns 404 if event is not found', async () => {
        stubPopulate(null);

        await authorizedEventOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Promotion not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 if restaurant is not found', async () => {
        const mockEventNoRestaurant = { _id: 'event123', restaurant: null };
        stubPopulate(mockEventNoRestaurant);

        await authorizedEventOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if user is not the owner', async () => {
        const mockRestaurant = { _id: 'resto123', owner: 'otherOwner456' };
        const mockEvent = { _id: 'event123', restaurant: mockRestaurant };

        stubPopulate(mockEvent);

        await authorizedEventOwner(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Event not owned by owner'));
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches event & restaurant and calls next if authorized', async () => {
        const mockRestaurant = { _id: 'resto123', owner: 'owner123' };
        const mockEvent = { _id: 'event123', restaurant: mockRestaurant };

        stubPopulate(mockEvent);

        await authorizedEventOwner(req, res, next);

        expect(req.event).toEqual(mockEvent);
        expect(req.restaurant).toEqual(mockRestaurant);
        expect(next).toHaveBeenCalled();
    });
});
