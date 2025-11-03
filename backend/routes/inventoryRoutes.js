// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Routes for Inventory Purchase Entry
router.post('/purchase', inventoryController.createPurchaseEntry);
router.get('/purchases', inventoryController.getAllPurchases);
router.put('/purchase-status', inventoryController.updatePurchaseStatus);

// Routes for Inventory Usage
router.post('/usage', inventoryController.createUsageEntry);
router.get('/usage', inventoryController.getAllUsageEntries);

// Routes for Item
router.post('/item', inventoryController.createItem); // Create a new item
router.get('/items', inventoryController.getAllItems); // Get all items
router.get('/item/:id', inventoryController.getItemById); // Get item by ID
router.put('/item/:id', inventoryController.updateItem); // Update item by ID
router.delete('/item/:id', inventoryController.deleteItem); // Delete item by ID

module.exports = router;
