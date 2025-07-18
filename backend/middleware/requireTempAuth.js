import { wrapError } from '../helpers/response.js';

export default function (req, res, next) {
    const user = req.user;

    if (user.username || user.profile) {
        return res.status(403).json(wrapError('Already completed profile setup'));
    }
    next();
}