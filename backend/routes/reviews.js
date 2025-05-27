const express = require('express');
const _ = require('lodash');
const { Review, validateReview } = require('../models/review');
const { DateTime } = require('luxon');
const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/auth');
const isCustomer = require('../middleware/isCustomer');

const wrapRoutes = require('../utils/wrapRoutes');
const { User } = require('../models/user');
const router = wrapRoutes(express.Router());

router.get('/:id', validateObjectId, async (req, res) => {
    // get review
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send('Review not found.');

    const { customer, restaurant, ...output } = review.toObject();
    return res.send(output);
});

router.post('/', [auth, isCustomer], async (req, res) => {
    // validate request
    const { error } = validateReview(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // create review
    const review = new Review(_.pick(req.body, ['restaurant', 'rating', 'reviewText']));
    review.dateVisited = DateTime.fromISO(req.body.dateVisited, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
    review.customer = req.user._id;
    review.username = req.user.username;
    await review.save();

    const { customer, restaurant, ...output } = review.toObject();
    return res.send(output);
});

router.delete('/:id', [auth, isCustomer], async (req, res) => {
    // validate request
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send('Review not found.');

    // get user
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send('Customer not found.');

    // check if the review belongs to the logged-in customer
    if (!review.customer.equals(user.profile)) return res.status(403).send('Access denied. You can only delete your own reviews.');

    // delete the review
    await Review.deleteOne({ _id: req.params.id });

    const { customer, restaurant, ...output } = review.toObject();
    return res.send(output);
});

module.exports = router;