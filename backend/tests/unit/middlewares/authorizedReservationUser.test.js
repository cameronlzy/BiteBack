import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.unstable_mockModule('../../../models/reservation.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Reservation } = await import('../../../models/reservation.model.js');
const { default: authorizedReservationUser } = await import('../../../middleware/authorizedReservationUser.js');

describe('authorizedReservationUser middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'resv123' },
      user: { _id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    Reservation.findById.mockReset();
  });

  it('should return 404 if reservation is not found', async () => {
    Reservation.findById.mockResolvedValue(null);

    await authorizedReservationUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Reservation not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if reservation does not belong to user', async () => {
    Reservation.findById.mockResolvedValue({
      user: 'otherUser456',
      toString: () => 'otherUser456',
    });

    await authorizedReservationUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Reservation does not belong to user');
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach reservation and call next if user is authorized', async () => {
    const mockReservation = {
      _id: 'resv123',
      user: { toString: () => 'user123' },
    };

    Reservation.findById.mockResolvedValue(mockReservation);

    await authorizedReservationUser(req, res, next);

    expect(req.reservation).toEqual(mockReservation);
    expect(next).toHaveBeenCalled();
  });
});
