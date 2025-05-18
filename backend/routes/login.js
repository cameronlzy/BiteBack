const bcrypt = require('bcrypt');
const _ = require('lodash');
const Joi = require('joi');
const { User } = require('../models/user');
const express = require('express');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
    // validate request
    const { error } = validate(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    // find user by email or username
    let user;
    if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    } else {
      user = await User.findOne({ username: req.body.username });
    }
    if (!user) return res.status(400).send('Invalid email or password.');

    // check password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    } catch (err) {
        console.error(err);
    }
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string(),
    password: Joi.string().min(5).max(255).required()
  }).xor('email', 'username');
  return schema.validate(req);
}

module.exports = router;