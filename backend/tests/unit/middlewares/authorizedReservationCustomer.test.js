import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/reservation.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Reservation } = await import('../../../models/reservation.model.js');
const { default: authorizedReservationCustomer } = await import('../../../middleware/authorizedReservationCustomer.js');

describe('authorizedReservationCustomer middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'resv123' },
      user: { profile: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    Reservation.findById.mockReset();
  });

  it('should return 404 if reservation is not found', async () => {
    Reservation.findById.mockResolvedValue(null);

    await authorizedReservationCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Reservation not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if reservation does not belong to user', async () => {
    Reservation.findById.mockResolvedValue({
      customer: 'otherUser456',
      toString: () => 'otherUser456',
    });

    await authorizedReservationCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Reservation does not belong to customer'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach reservation and call next if user is authorized', async () => {
    const mockReservation = {
      _id: 'resv123',
      customer: { toString: () => 'user123' },
    };

    Reservation.findById.mockResolvedValue(mockReservation);

    await authorizedReservationCustomer(req, res, next);

    expect(req.reservation).toEqual(mockReservation);
    expect(next).toHaveBeenCalled();
  });
});
