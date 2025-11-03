const BatchTiming = require('../models/BatchTiming');

// Create a new batch timing
exports.createBatchTiming = async (req, res) => {
  try {
    const newBatchTiming = new BatchTiming(req.body);
    const savedBatch = await newBatchTiming.save();
    res.status(201).json(savedBatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all batch timings
exports.getAllBatchTimings = async (req, res) => {
  try {
    const batches = await BatchTiming.find();
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a batch timing by ID
exports.getBatchTimingById = async (req, res) => {
  try {
    const batch = await BatchTiming.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'BatchTiming not found' });
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a batch timing
exports.updateBatchTiming = async (req, res) => {
  try {
    const updatedBatch = await BatchTiming.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBatch) return res.status(404).json({ message: 'BatchTiming not found' });
    res.status(200).json(updatedBatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a batch timing
exports.deleteBatchTiming = async (req, res) => {
  try {
    const deletedBatch = await BatchTiming.findByIdAndDelete(req.params.id);
    if (!deletedBatch) return res.status(404).json({ message: 'BatchTiming not found' });
    res.status(200).json({ message: 'BatchTiming deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a specific slot inside a BatchTiming
exports.updateSlotInBatchTiming = async (req, res) => {
  try {
    const { batchTimingId, slotId } = req.params;
    const updatedSlotData = req.body;

    const batchTiming = await BatchTiming.findOneAndUpdate(
      { _id: batchTimingId, "slots._id": slotId },
      {
        $set: {
          "slots.$.fromTime": updatedSlotData.fromTime,
          "slots.$.toTime": updatedSlotData.toTime,
          "slots.$.slotType": updatedSlotData.slotType,
          "slots.$.moduleName": updatedSlotData.moduleName,
          "slots.$.frequency": updatedSlotData.frequency,
          "slots.$.class_mode": updatedSlotData.class_mode,
          "slots.$.days": updatedSlotData.days
        }
      },
      { new: true }
    );

    if (!batchTiming) {
      return res.status(404).json({ message: "BatchTiming or slot not found" });
    }

    res.status(200).json(batchTiming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
