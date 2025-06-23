import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.unstable_mockModule('../../../models/reservation.model.js', () => ({
  default: {
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn(),
  },
}));

const { default: Reservation } = await import('../../../models/reservation.model.js');
const { default: authorizedReservationStaff } = await import('../../../middleware/authorizedReservationStaff.js');

describe('authorizedReservationStaff middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'resv123' },
      user: { _id: 'staff123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();

    Reservation.findById.mockReset();
    Reservation.populate?.mockReset?.();
  });

  it('should return 404 if reservation is not found', async () => {
    Reservation.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null),
    });

    await authorizedReservationStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Reservation not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if staff is not authorized', async () => {
    const mockReservation = {
      restaurant: {
        staff: 'someOtherStaff',
        toString: () => 'someOtherStaff',
      },
    };

    Reservation.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockReservation),
    });

    await authorizedReservationStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Staff cannot manage reservation');
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach reservation and restaurant and call next if staff is authorized', async () => {
    const mockRestaurant = {
      staff: 'staff123',
      toString: () => 'staff123',
    };

    const mockReservation = {
      _id: 'resv123',
      restaurant: mockRestaurant,
    };

    Reservation.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockReservation),
    });

    await authorizedReservationStaff(req, res, next);

    expect(req.reservation).toEqual(mockReservation);
    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});
