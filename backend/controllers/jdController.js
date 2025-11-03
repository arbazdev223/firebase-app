const Jd = require('../models/Jd');

// Create a new JD
exports.createJd = async (req, res) => {
  try {
    const { Jdname, content } = req.body;
    if (!Jdname || !content) {
      return res.status(400).json({ message: "Jdname and content are required" });
    }

    const newJd = new Jd({ Jdname, content });
    const savedJd = await newJd.save();
    res.status(201).json(savedJd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all JDs
exports.getAllJds = async (req, res) => {
  try {
    const jds = await Jd.find();
    res.status(200).json(jds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single JD by ID
exports.getJdById = async (req, res) => {
  try {
    const jd = await Jd.findById(req.params.id);
    if (!jd) {
      return res.status(404).json({ message: "JD not found" });
    }
    res.status(200).json(jd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a JD by ID
exports.updateJd = async (req, res) => {
  try {
    const { Jdname, content } = req.body;
    const updatedJd = await Jd.findByIdAndUpdate(
      req.params.id,
      { Jdname, content },
      { new: true, runValidators: true }
    );

    if (!updatedJd) {
      return res.status(404).json({ message: "JD not found" });
    }
    res.status(200).json(updatedJd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a JD by ID
exports.deleteJd = async (req, res) => {
  try {
    const deletedJd = await Jd.findByIdAndDelete(req.params.id);
    if (!deletedJd) {
      return res.status(404).json({ message: "JD not found" });
    }
    res.status(200).json({ message: "JD deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
