const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templatecontroller');

router.get('/fetch-templates', TemplateController.fetchAndSaveTemplates);

router.get('/templates', TemplateController.getAllTemplates);
// Route to send WhatsApp messages using a template
router.post('/send-template', TemplateController.sendWhatsAppTemplate);

// Create Group
router.post("/group/create", TemplateController.createGroup);

// Get Paginated Groups
router.get("/group/list", TemplateController.getPaginatedGroups);

// Add Members to Group
router.post("/group/add-members", TemplateController.addMembersToGroup);

router.post("/group/broadcast-message", TemplateController.sendBroadcastTemplateMessage);

module.exports = router;
