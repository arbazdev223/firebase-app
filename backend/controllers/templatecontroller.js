const Template = require('../models/template');
const doubletick = require('../.api/apis/doubletick'); // Adjust path if necessary

doubletick.auth('key_2NeZsJAkhj'); // Authenticate API

exports.fetchAndSaveTemplates = async (req, res) => {
  try {
    console.log("Fetching templates from Doubletick...");

    const response = await doubletick.getTemplates({ status: 'ALL' });
    console.log("API Response:", response);

    const { data } = response;

    if (!Array.isArray(data)) {
      console.error("Invalid response format:", data);
      return res.status(500).json({ message: "Invalid response from API", error: data });
    }

    for (const template of data) {
      const existingTemplate = await Template.findOne({ id: template.id });

      if (!existingTemplate) {
        await Template.create(template);
        console.log(`Inserted template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }

    res.status(200).json({ message: 'Templates inserted successfully' });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find(); // Fetch all templates
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

exports.sendWhatsAppTemplate = async (req, res) => {
  try {
    const { templateName, to, language = "en" } = req.body; // Get data from request

    if (!templateName || !to) {
      return res.status(400).json({ message: "Template name and recipient number are required" });
    }

    const response = await doubletick.outgoingMessagesWhatsappTemplate({
      messages: [{ content: { language, templateName }, to }]
    });

    console.log("Message Sent Response:", response.data);
    res.json({ message: "WhatsApp message sent successfully", data: response.data });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    // Validate that both name and members exist
    if (!name ) {
      return res.status(400).json({ message: "Group name and members are required" });
    }

    const response = await doubletick.createGroup({
      name,
      members
    });

    console.log("Group Created Response:", response.data);
    res.status(201).json({ message: "Group created successfully", data: response.data });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Error creating group", error: error.message });
  }
};


// Get paginated groups
exports.getPaginatedGroups = async (req, res) => {
  const { searchQuery, orderBy, format, afterGroupId, afterGroupName, afterDateCreated } = req.query;

  try {
    const response = await doubletick.getPaginatedGroupsV2({
      searchQuery,
      orderBy,
      format,
      afterGroupId,
      afterGroupName,
      afterDateCreated
    });

    console.log("Paginated Groups Response:", response.data);
    res.json({ message: "Groups fetched successfully", data: response.data });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Error fetching groups", error: error.message });
  }
};

// Add members to an existing group
exports.addMembersToGroup = async (req, res) => {
  const { groupId, members } = req.body;

  if (!groupId || !members || members.length === 0) {
    return res.status(400).json({ message: "Group ID and members are required" });
  }

  try {
    const response = await doubletick.addMembersToGroup({
      groupId,
      members
    });

    console.log("Members Added Response:", response.data);
    res.json({ message: "Members added successfully", data: response.data });
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ message: "Error adding members", error: error.message });
  }
};

// Send Template WhatsApp Message to Broadcast Group
exports.sendBroadcastTemplateMessage = async (req, res) => {
  const { groupName, templateName, language = 'en', templateData = {} } = req.body;

  if (!groupName || !templateName ) {
    return res.status(400).json({
      message: "groupName, from, templateName, and language are required"
    });
  }

  try {
    const response = await doubletick.sendBroadcastMessage({
      groupName,
      content: {
        templateName,
        language,
        templateData
      }
    });

    res.status(200).json({ message: "Broadcast message sent successfully", data: response.data });
  } catch (error) {
    console.error("Broadcast message error:", error);
    res.status(500).json({ message: "Failed to send broadcast message", error: error.message });
  }
};
