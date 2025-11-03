const Faqs = require('../models/Faqs'); // Import the Faqs model
const Category = require('../models/Category');

// Create a new Category
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error });
  }
};

// Get all Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};

// Controller to create a new FAQ
exports.createFaq = async (req, res) => {
  try {
    // Validate data
    // validateData(req.body);

    // Insert into database
    const newFaq = await Faqs.create(req.body);

    res.status(201).json({
      message: 'FAQ created successfully!',
      data: newFaq,
    });
  } catch (err) {
    console.error('Error creating FAQ:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
};

// Controller to get all FAQs
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await Faqs.find()
      .populate('Category') // Populate Category
      .populate({
        path: 'selectedMembers',
        select: 'name department' // Only include name and department from User
      });

    res.status(200).json(faqs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};


// Controller to update an existing FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params; // Get the FAQ ID from the URL parameters
    const { topicName, selectedTeams, selectedMembers, editorContent } = req.body;

    // Find and update the FAQ document
    const updatedFaq = await Faqs.findByIdAndUpdate(
      id,
      {
        topicName,
        selectedTeams,
        selectedMembers,
        editorContent,
      },
      { new: true } // Return the updated document
    );

    if (!updatedFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.status(200).json({
      message: 'FAQ updated successfully!',
      faq: updatedFaq,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Controller to delete an FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params; // Get the FAQ ID from the URL parameters

    // Find and delete the FAQ document
    const deletedFaq = await Faqs.findByIdAndDelete(id);

    if (!deletedFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.status(200).json({
      message: 'FAQ deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};
