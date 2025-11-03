const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const checklistController = require('../controllers/checklistController'); 
const authController = require('../controllers/authController');

router.post('/login', authController.login); 
router.post('/register', authController.register); 
router.get('/getuser', authController.getusers); 
router.get('/getuserbyfilters', authController.getusersbyfilters); 
router.get('/users/:id', authController.getUserById); // Add GET endpoint for individual user
router.put('/users/:id', upload.single('ProfileImage'), authController.updateUser); // Changed from 'thumb' to 'ProfileImage' to match frontend
router.delete('/users/:id', authController.deleteUser);
router.get('/checklists', checklistController.getAllChecklists);
router.get('/server-check', checklistController.getServerCheck);
router.post('/submit-checklist', checklistController.submitChecklist);

module.exports = router;
