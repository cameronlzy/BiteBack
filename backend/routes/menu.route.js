import express from 'express';
import * as menuController from '../controllers/menu.controller.js';
import auth from '../middleware/auth.js';
import isOwner from '../middleware/isOwner.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedMenuItemOwner from '../middleware/authorizedMenuItemOwner.js';
import parser from '../middleware/cloudinaryUpload.js';

const router = wrapRoutes(express.Router());

const menuParser = parser('menus');

// [Public] - Get all shop items for restaurant
router.get('/restaurant/:id', [validateObjectId()], menuController.getAllItems);

// [Public] - Get menu item by ID
router.get('/:id', [validateObjectId()], menuController.getItemById);

// [Owner] - Create menu item
router.post('/', [auth, isOwner], menuController.createItem);

// [Owner] - Add image to menuItem
router.post('/:id/image', [validateObjectId(), auth, isOwner, authorizedMenuItemOwner, menuParser.single('image')], menuController.addItemImage);

// [Owner] - Update menuItem image
router.patch('/:id/image', [validateObjectId(), auth, isOwner, authorizedMenuItemOwner, menuParser.single('image')], menuController.updateItemImage);

// [Owner] - Update menu item
router.patch('/:id', [validateObjectId(), auth, isOwner, authorizedMenuItemOwner], menuController.updateItem);

// [Owner] - Delete shop item
router.delete('/:id', [validateObjectId(), auth, isOwner, authorizedMenuItemOwner], menuController.deleteItem);

export default router;