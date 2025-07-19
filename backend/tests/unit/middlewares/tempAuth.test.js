import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        verify: jest.fn(),
    },
}));

jest.unstable_mockModule('config', () => ({
    default: {
        get: jest.fn((key) => {
            if (key === 'jwtPrivateKey') return 'mocked_secret';
            return null;
        }),
    },
}));

const { default: jwt } = await import('jsonwebtoken');
const { default: config } = await import('config');
const { default: tempAuth } = await import('../../../middleware/tempAuth.js');

describe('tempAuth middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            cookies: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        config.get.mockReturnValue('fake_jwt_key');
    });

    it('should return 401 if no token is provided', () => {
        tempAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(wrapError('Access denied'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
        req.cookies.token = 'invalid.token';
        jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

        tempAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(wrapError('Invalid token'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if decoded token has username (perm token)', () => {
        req.cookies.token = 'valid.token';
        jwt.verify.mockReturnValue({ username: 'user123' }); // perm JWT has username

        tempAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(wrapError('Invalid temp token'));
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid and has NO username (temp token)', () => {
        const decoded = { _id: 'tempUser123' };
        req.cookies.token = 'valid.token';
        jwt.verify.mockReturnValue(decoded);

        tempAuth(req, res, next);

        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalled();
    });
});
