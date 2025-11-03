

const express = require('express');
const upload = require('../utils/loadManager');
const enqureController = require('../controllers/enqureController');
const router = express.Router();
router.get('/registrationsdata', enqureController.getAllRegistrations);

router.post("/assign/unresponse/data", enqureController.assignUnresponse);

router.get('/get-duplicate-mobile-report', enqureController.getDuplicateMobileReport);

router.get('/', enqureController.getAllEnquiries);

// Route to create a new enquiry
router.post('/', enqureController.createEnquiry);
router.get('/report/daily-enquiry', enqureController.getDailyEnquiryReport);
router.get('/report/all-visited', enqureController.getAllVisitedEnquiries);
router.get('/report/all-web-enquiries', enqureController.getAllWebEnquiries);
router.get('/report/all-doubletick-enquiries', enqureController.getAllDoubleTickEnquiries);

router.get('/report/all-followups', enqureController.getAllFollowupsReport);
router.get('/report/admission-incentive', enqureController.getAdmissionIncentiveReport);
// Route to get all enquiries

router.post('/reassign', enqureController.reassign);
router.post('/insert', enqureController.insertdata);

router.get('/get-record', enqureController.getRecord);

router.get('/enquiry/remarks/', enqureController.getRemarks);

router.post('/remarks/:remarkId/reply', enqureController.addReplyToRemark);

// Route to get a specific enquiry by ID
router.get('/:id', enqureController.getEnquiryById);

router.put('/refech/:id', enqureController.refech);

// Route to update an enquiry by ID
router.put('/:id', enqureController.updateEnquiry);

router.post('/assign/data', enqureController.dataUpdate);


router.post('/delete', enqureController.DeleteData);

// Route to import file a new enquiry
router.post('/import-file', upload.single('file'), enqureController.importFile);

router.post('/bulk', enqureController.createMultipleEnquiries);

router.post('/targets', enqureController.createTarget);
router.get('/targets/:id', enqureController.getUserTargets);
router.get('/callercount/:id', enqureController.callercount);

// Route to create a new registration
router.post('/registrations', enqureController.createRegistration);

// Route to get all registrations

// Route to get a registration by ID
router.get('/registrations/:id', enqureController.getRegistrationById);

// Route to update a registration
router.put('/registrations/:id', enqureController.updateRegistration);

// Route to delete a registration
router.delete('/registrations/:id', enqureController.deleteRegistration);

// Route to get registrations by counsellor ID
router.get('/registrations/counsellor/:counsellorId', enqureController.getRegistrationsByCounsellorId);


module.exports = router;