const PlacementCall = require('../models/placementCallModel');

// Create
exports.createPlacementCall = async (req, res) => {
  try {
    const placementCall = new PlacementCall(req.body);
    await placementCall.save();
    res.status(201).json({ success: true, data: placementCall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Read All
exports.getAllPlacementCalls = async (req, res) => {
  try {
    const calls = await PlacementCall.find().sort({ datePosted: -1 });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Read by ID
exports.getPlacementCallById = async (req, res) => {
  try {
    const call = await PlacementCall.findById(req.params.id);
    if (!call) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updatePlacementCall = async (req, res) => {
  try {
    const updatedCall = await PlacementCall.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!updatedCall) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: updatedCall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete
exports.deletePlacementCall = async (req, res) => {
  try {
    const deleted = await PlacementCall.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
