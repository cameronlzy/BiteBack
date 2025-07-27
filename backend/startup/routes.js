import express from 'express';
import cookieParser from 'cookie-parser';
import error from '../middleware/error.js';
import auth from '../routes/auth.route.js';
import reservations from '../routes/reservation.route.js';
import restaurants from '../routes/restaurant.route.js';
import reviews from '../routes/review.route.js';
import customers from '../routes/customer.route.js';
import owners from '../routes/owner.route.js';
import queue from '../routes/queue.route.js';
import promotions from '../routes/promotion.route.js';
import analytics from '../routes/analytics.route.js';
import rewardItem from '../routes/rewardItem.route.js';
import rewardPoint from '../routes/rewardPoint.route.js';
import rewardRedemption from '../routes/rewardRedemption.route.js';
import events from '../routes/event.route.js';
import menus from '../routes/menu.route.js';
import orders from '../routes/order.route.js';
import unsubscribe from '../routes/unsubscribe.route.js';

export default function(app) {
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', auth);
  app.use('/api/reservations', reservations);
  app.use('/api/restaurants', restaurants);
  app.use('/api/reviews', reviews);
  app.use('/api/owners', owners);
  app.use('/api/customers', customers);
  app.use('/api/queue', queue);
  app.use('/api/promotions', promotions);
  app.use('/api/analytics', analytics);
  app.use('/api/rewards', rewardItem);
  app.use('/api/rewards', rewardPoint);
  app.use('/api/rewards', rewardRedemption);
  app.use('/api/events', events)
  app.use('/api/menu', menus);
  app.use('/api/orders', orders);
  app.use('/api/unsubscribe', unsubscribe);

  // to log error
  app.use(error);
}