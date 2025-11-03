// controllers/incentiveController.js
const Incentive = require('../models/Incentive');

exports.create = async (req, res) => {
  try {
    const { UserId, Amount, payableDate } = req.body;
    const incentive = new Incentive({ UserId, Amount, payableDate });
    await incentive.save();
    res.status(201).json({ message: 'Incentive created successfully', incentive });
  } catch (error) {
    res.status(500).json({ message: 'Error creating incentive', error });
  }
};

exports.getAll = async (req, res) => {
  try {
    const incentives = await Incentive.find().populate('UserId', 'name email');
    res.status(200).json(incentives);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incentives', error });
  }
};

exports.getById = async (req, res) => {
  try {
    const incentive = await Incentive.findById(req.params.id).populate('UserId', 'name email');
    if (!incentive) return res.status(404).json({ message: 'Incentive not found' });
    res.status(200).json(incentive);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incentive', error });
  }
};

exports.update = async (req, res) => {
  try {
    const { Amount, payableDate } = req.body;
    const incentive = await Incentive.findByIdAndUpdate(req.params.id, { Amount, payableDate }, { new: true });
    if (!incentive) return res.status(404).json({ message: 'Incentive not found' });
    res.status(200).json({ message: 'Incentive updated successfully', incentive });
  } catch (error) {
    res.status(500).json({ message: 'Error updating incentive', error });
  }
};

exports.delete = async (req, res) => {
  try {
    const incentive = await Incentive.findByIdAndDelete(req.params.id);
    if (!incentive) return res.status(404).json({ message: 'Incentive not found' });
    res.status(200).json({ message: 'Incentive deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting incentive', error });
  }
};
