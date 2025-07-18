import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/order.model.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

const { default: Order } = await import('../../../models/order.model.js');
const { default: authorizedOrderStaff } = await import('../../../middleware/authorizedOrderStaff.js');

describe('authorizedOrderStaff middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'order123' },
            user: { restaurant: 'rest123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        Order.findById.mockReset();
    });

    it('should return 404 if order is not found', async () => {
        Order.findById.mockResolvedValue(null);

        await authorizedOrderStaff(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(wrapError('Order not found'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if order is not from the staff\'s restaurant', async () => {
        Order.findById.mockResolvedValue({
            restaurant: 'anotherRest456',
            toString: () => 'anotherRest456',
        });

        await authorizedOrderStaff(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(wrapError('Staff cannot access order'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should attach order and call next if staff is authorized', async () => {
        const mockOrder = {
            _id: 'order123',
            restaurant: { toString: () => 'rest123' },
        };

        Order.findById.mockResolvedValue(mockOrder);

        await authorizedOrderStaff(req, res, next);

        expect(req.order).toEqual(mockOrder);
        expect(next).toHaveBeenCalled();
    });
});
