// controllers/inventoryController.js
const InventoryPurchaseEntry = require('../models/InventoryPurchaseEntry');
const InventoryUsage = require('../models/InventoryUsage');
const Item = require('../models/Item');

// Create Inventory Purchase Entry
exports.createPurchaseEntry = async (req, res) => {
  try {
    const { item, quantity, unitPrice, receivedBy } = req.body;

    const inventoryItem = await Item.findById(item);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const totalPrice = quantity * unitPrice;

    const purchaseEntry = new InventoryPurchaseEntry({
      item,
      quantity,
      unitPrice,
      totalPrice,
      receivedBy,
      status: 'Received'
    });

    await purchaseEntry.save();

    inventoryItem.currentStock += quantity;
    await inventoryItem.save();

    return res.status(201).json({
      message: 'Purchase Entry created successfully',
      purchaseEntry
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get All Inventory Purchase Entries
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await InventoryPurchaseEntry.find().populate('item receivedBy');
    return res.status(200).json(purchases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Purchase Status
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { purchaseId, status } = req.body;

    const purchaseEntry = await InventoryPurchaseEntry.findById(purchaseId);
    if (!purchaseEntry) {
      return res.status(404).json({ message: 'Purchase Entry not found' });
    }

    purchaseEntry.status = status;
    await purchaseEntry.save();

    return res.status(200).json({
      message: 'Purchase Entry status updated successfully',
      purchaseEntry
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new inventory usage entry
exports.createUsageEntry = async (req, res) => {
  try {
      const usageData = req.body; // Array of usage entries

      // Check if the data array is empty
      if (!Array.isArray(usageData) || usageData.length === 0) {
          return res.status(400).json({ message: 'No usage data provided' });
      }

      const createdEntries = [];

      // Loop through each usage entry
      for (let data of usageData) {
          const { item, quantityUsed, usedBy, lab, branch, purpose } = data;

          // Validate required fields
          if (!item || !quantityUsed || !usedBy || !lab || !branch || !purpose) {
              return res.status(400).json({ message: 'All fields are required' });
          }

          // Check if the item exists
          const inventoryItem = await Item.findById(item);
          if (!inventoryItem) {
              return res.status(404).json({ message: `Item with ID ${item} not found` });
          }

          // Check if there is enough stock available
          if (inventoryItem.currentStock < quantityUsed) {
              return res.status(400).json({ message: `Insufficient stock for item ${item}` });
          }

          // Deduct used quantity from stock
          const remainingStock = inventoryItem.currentStock - quantityUsed;
          inventoryItem.currentStock = remainingStock;
          await inventoryItem.save();

          // Create a new inventory usage entry
          const usageEntry = new InventoryUsage({
              item,
              quantityUsed,
              usedBy,
              lab,
              branch,
              purpose,
              remainingStock
          });
          await usageEntry.save();

          createdEntries.push(usageEntry);
      }

      res.status(201).json({ message: 'Usage entries recorded successfully', createdEntries });
  } catch (error) {
      console.error('Error creating usage entry:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Inventory Usage Entries
exports.getAllUsageEntries = async (req, res) => {
  try {
    const usageEntries = await InventoryUsage.find().populate('item usedBy');
    return res.status(200).json(usageEntries);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Create a new Item
exports.createItem = async (req, res) => {
    try {
      const { name, description, category, unit, price, currentStock, reorderLevel, status } = req.body;
  
      // Create a new item entry
      const newItem = new Item({
        name,
        description,
        category,
        unit,
        price,
        currentStock,
        reorderLevel,
        status
      });
  
      // Save the item to the database
      await newItem.save();
  
      return res.status(201).json({
        message: 'Item created successfully',
        item: newItem
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Get all Items
  exports.getAllItems = async (req, res) => {
    try {
      const items = await Item.find();
      return res.status(200).json(items);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Get a single Item by ID
  exports.getItemById = async (req, res) => {
    try {
      const itemId = req.params.id;
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      return res.status(200).json(item);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Update an existing Item
  exports.updateItem = async (req, res) => {
    try {
      const itemId = req.params.id;
      const { name, description, category, unit, price, currentStock, reorderLevel, status } = req.body;
  
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      // Update the item
      item.name = name || item.name;
      item.description = description || item.description;
      item.category = category || item.category;
      item.unit = unit || item.unit;
      item.price = price || item.price;
      item.currentStock = currentStock || item.currentStock;
      item.reorderLevel = reorderLevel || item.reorderLevel;
      item.status = status || item.status;
  
      await item.save();
  
      return res.status(200).json({
        message: 'Item updated successfully',
        item
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Delete an Item
  exports.deleteItem = async (req, res) => {
    try {
      const itemId = req.params.id;
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      // Delete the item
      await item.remove();
  
      return res.status(200).json({
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };