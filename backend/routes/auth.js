const auth = require('../middleware/auth');
const { User, validateLogin } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const _ = require('lodash');
const { CustomerProfile, validateCustomer } = require('../models/customerProfile');
const { OwnerProfile, validateOwner, validateNewOwner } = require('../models/ownerProfile');
const { createRestaurantArray } = require('../models/restaurant');
const mongoose = require('mongoose');
const wrapRoutes = require('../utils/wrapRoutes');
const router = wrapRoutes(express.Router());

const isProdEnv = process.env.NODE_ENV === 'production';

router.get('/me', auth, async (req, res) => {
  let user;
  if (req.user.role == 'owner') {
  user = await User.findById(req.user._id)
    .populate({
      path: 'profile', 
      populate: {
        path: 'restaurants',
        model: 'Restaurant'
      }
    })
      .select('-password');
  } else if (req.user.role == 'customer') {
    user = await User.findById(req.user._id)
      .populate('profile')
      .select('-password');
  } else {
    return res.status(400).send('Invalid role.');
  }
  return res.send(user);
});

router.put('/me', auth, async (req, res) => {
  if (req.user.role != 'owner' && req.user.role != 'customer') return res.status(400).send('Invalid role.');
  if (isProdEnv) {
    const session = await mongoose.startSession();
	  session.startTransaction();
    try {
      if (req.user.role == 'customer') {
        // validate request
        req.body.role = 'customer';
        const { error } = validateCustomer(req.body);
        if (error) throw { status: 400, message: error.details[0].message };

        // find user
        const user = await User.findById(req.user._id).session(session);
        if (!user) throw { status: 404, message: 'Customer not found.' };

        // check if email or username already taken by someone else
        const existingUser = await User.findOne({
          _id: { $ne: req.user._id },
          $or: [
            { email: req.body.email },
            { username: req.body.username }
          ]
        }).session(session);
        if (existingUser) {
          if (existingUser.email === req.body.email) {
            throw { status: 400, message: 'Email is already taken.' };
          }
          if (existingUser.username === req.body.username) {
            throw { status: 400, message: 'Username is already taken.' };
          }
        }

        // update user
        Object.assign(user, _.pick(req.body, ['email', 'username']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save({ session });

        // find and update profile
        const profile = await CustomerProfile.findByIdAndUpdate(
          user.profile, 
          { 
            name: req.body.name, 
            contactNumber: req.body.contactNumber, 
            favCuisines: req.body.favCuisines
          },
          { new: true, runValidators: true, session }
        );
        if (!profile) throw { status: 404, message: 'Profile not found.' };

        await session.commitTransaction();

        // send back user
        const token = user.generateAuthToken();
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = profile;
        return res.header('x-auth-token', token).send(safeUser);
      } else {
        // validate request
        req.body.role = 'owner';
        const { error } = validateNewOwner(req.body);
        if (error) throw { status: 400, message: error.details[0].message };

        // find user
        const user = await User.findById(req.user._id).session(session);
        if (!user) throw { status: 404, message: 'Owner not found.' };

        // check if email or username already taken by someone else
        const existingUser = await User.findOne({
          _id: { $ne: req.user._id },
          $or: [
            { email: req.body.email },
            { username: req.body.username }
          ]
        }).session(session);
        if (existingUser) {
          if (existingUser.email === req.body.email) {
            throw { status: 400, message: 'Email is already taken.' };
          }
          if (existingUser.username === req.body.username) {
            throw { status: 400, message: 'Username is already taken.' };
          }
        }

        // update user
        Object.assign(user, _.pick(req.body, ['email', 'username']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save({ session });

        // find and update profile
        const profile = await OwnerProfile.findByIdAndUpdate(
          user.profile, 
          { companyName: req.body.companyName },
          { new: true, runValidators: true, session }
        );
        if (!profile) throw { status: 404, message: 'Profile not found.' };

        // send back user
        const token = user.generateAuthToken();
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = profile;
        return res.header('x-auth-token', token).send(safeUser);
      }
    } catch (err) {
      await session.abortTransaction();
      if (res.status) return res.status(err.status).send(err.message);

      throw err;
    } finally {
      session.endSession();
    }
  } else {
    if (req.user.role == 'customer') {
        // validate request
        req.body.role = 'customer';
        const { error } = validateCustomer(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        // find user
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send('Customer not found.');

        // check if email or username already taken by someone else
        const existingUser = await User.findOne({
          _id: { $ne: req.user._id },
          $or: [
            { email: req.body.email },
            { username: req.body.username }
          ]
        });
        if (existingUser) {
          if (existingUser.email === req.body.email) {
            return res.status(400).send('Email is already taken.');
          }
          if (existingUser.username === req.body.username) {
            return res.status(400).send('Username is already taken.');
          }
        }

        // update user
        Object.assign(user, _.pick(req.body, ['email', 'username']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();

        // find and update profile
        const profile = await CustomerProfile.findByIdAndUpdate(
          user.profile, 
          { 
            name: req.body.name, 
            contactNumber: req.body.contactNumber, 
            favCuisines: req.body.favCuisines
          },
          { new: true, runValidators: true }
        );
        if (!profile) return res.status(404).send('Profile not found.');

        // send back user
        const token = user.generateAuthToken();
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = profile;
        return res.header('x-auth-token', token).send(safeUser);
    } else {
      // validate request
      req.body.role = 'owner';
      const { error } = validateNewOwner(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      // find user
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).send('Owner not found.');

      // check if email or username already taken by someone else
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        $or: [
          { email: req.body.email },
          { username: req.body.username }
        ]
      });
      if (existingUser) {
        if (existingUser.email === req.body.email) {
          return res.status(400).send('Email is already taken.');
        }
        if (existingUser.username === req.body.username) {
          return res.status(400).send('Username is already taken.');
        }
      }

      // update user
      Object.assign(user, _.pick(req.body, ['email', 'username']));
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();

      // find and update profile
      const profile = await OwnerProfile.findByIdAndUpdate(
        user.profile, 
        { companyName: req.body.companyName },
        { new: true, runValidators: true }
      );
      if (!profile) return res.status(404).send('Profile not found.');

      // send back user
      const token = user.generateAuthToken();
      const { password, ...safeUser } = user.toObject();
      safeUser.profile = profile;
      return res.header('x-auth-token', token).send(safeUser);
    }
  }
});

router.post('/login', async (req, res) => {
    // validate request
    const { error } = validateLogin(req.body); 
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
    return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
});

router.post('/register', async (req, res) => {
  if (!req.body.role || (req.body.role != 'owner' && req.body.role != 'customer')) return res.status(400).send('Invalid role.');
  if (isProdEnv) {
    // prod
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (req.body.role == "customer") {
        // validate request
        const { error } = validateCustomer(req.body); 
        if (error) throw { status: 400, message: error.details[0].message };

        // if user exists
        let existingUser = await User.findOne({
          $or: [
            { email: req.body.email },
            { username: req.body.username }
          ]
        }).session(session);
        if (existingUser) {
          if (existingUser.email === req.body.email && existingUser.role === 'owner') {
            throw { status: 400, message: 'Email already registered to a restaurant owner.' };
          }
          if (existingUser.email === req.body.email && existingUser.role === 'customer') {
            throw { status: 400, message: 'Email already registered to a customer.' };
          }
          if (existingUser.username === req.body.username) {
            throw { status: 400, message: 'Username already taken.' };
          }
        }

        // create a customer profile
        let customerProfile = new CustomerProfile(_.pick(req.body, ['name', 'contactNumber', 'favCuisines']));

        // create new user
        let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));
        customerProfile.user = user._id;
        await customerProfile.save({ session });

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'CustomerProfile';
        user.profile = customerProfile._id;
        await user.save({ session });

        // commit transaction
        await session.commitTransaction();
        session.endSession();

        const token = user.generateAuthToken();
        return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
      } else {
        // validate request
        const { error } = validateOwner(req.body); 
        if (error) throw { status: 400, message: error.details[0].message };

        // if user exists
        let existingUser = await User.findOne({
          $or: [
            { email: req.body.email },
            { username: req.body.username }
          ]
        }).session(session);
        if (existingUser) {
          if (existingUser.email === req.body.email && existingUser.role === 'owner') {
            throw { status: 400, message: 'Email already registered to a restaurant owner.' };
          }
          if (existingUser.email === req.body.email && existingUser.role === 'customer') {
            throw { status: 400, message: 'Email already registered to a customer.' };
          }
          if (existingUser.username === req.body.username) {
            throw { status: 400, message: 'Username already taken.' };
          }
        }


        // create new user
        let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'OwnerProfile';
        user.profile = new mongoose.Types.ObjectId();

        // create restaurant array
        let restaurants;
        try {
            restaurants = await createRestaurantArray(req.body.restaurants, user._id, session);
        } catch (err) {
            throw { status: 400, message: 'Incorrect restaurant information.' };
        }

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(req.body, ['companyName']));
        ownerProfile.user = user._id;
        ownerProfile.restaurants = restaurants;
        await ownerProfile.save({ session });

        // reupdate user.profile
        user.profile = ownerProfile._id;
        await user.save({ session });

        // commit transaction
        await session.commitTransaction();

        const token = user.generateAuthToken();
        return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
      }
    } catch (err) {
      await session.abortTransaction();
      if (err.status) return res.status(err.status).send(err.message);
      
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // dev or test
    if (req.body.role == "customer") {
      // validate request
      const { error } = validateCustomer(req.body); 
      if (error) return res.status(400).send(error.details[0].message);

      // if user exists
      let existingUser = await User.findOne({
        $or: [
          { email: req.body.email },
          { username: req.body.username }
        ]
      });
      if (existingUser) {
        if (existingUser.email === req.body.email && existingUser.role === 'owner') {
          return res.status(400).send('Email already registered to a restaurant owner.');
        }
        if (existingUser.email === req.body.email && existingUser.role === 'customer') {
          return res.status(400).send('Email already registered to a customer.');
        }
        if (existingUser.username === req.body.username) {
          return res.status(400).send('Username already taken.');
        }
      }

      // create a customer profile
      let customerProfile = new CustomerProfile(_.pick(req.body, 
          ['name', 'contactNumber', 'favCuisines']));

      // create new user
      let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));
      customerProfile.user = user._id;
      await customerProfile.save();

      // hash password and add references
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user.roleProfile = 'CustomerProfile';
      user.profile = customerProfile._id;
      await user.save();

      const token = user.generateAuthToken();
      return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    } else {
      // validate request
      // console.log(req.body);
      const { error } = validateOwner(req.body); 
      if (error) return res.status(400).send(error.details[0].message);

      // if user exists
      let existingUser = await User.findOne({
        $or: [
          { email: req.body.email },
          { username: req.body.username }
        ]
      });
      if (existingUser) {
        if (existingUser.email === req.body.email && existingUser.role === 'owner') {
          return res.status(400).send('Email already registered to a restaurant owner.');
        }
        if (existingUser.email === req.body.email && existingUser.role === 'customer') {
          return res.status(400).send('Email already registered to a customer.');
        }
        if (existingUser.username === req.body.username) {
          return res.status(400).send('Username already taken.');
        }
      }

      // create new user
      let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));

      // hash password and add references
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user.roleProfile = 'OwnerProfile';
      user.profile = new mongoose.Types.ObjectId();

      // create restaurant array
      let restaurants;
      try {
          restaurants = await createRestaurantArray(req.body.restaurants, user._id);
      } catch (err) {
          return res.status(400).send('Incorrect restaurant information.');
      }

      // create a owner profile
      let ownerProfile = new OwnerProfile(_.pick(req.body, ['companyName']));
      ownerProfile.user = user._id;
      ownerProfile.restaurants = restaurants;
      await ownerProfile.save();

      // reupdate user.profile
      user.profile = ownerProfile._id;
      await user.save();

      const token = user.generateAuthToken();
      return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    }
  }
});

module.exports = router; 
