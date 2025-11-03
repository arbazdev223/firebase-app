const mongoose = require('mongoose');
const csv = require('csvtojson');
const Enqure = require('../models/Enqure');
const RecordBackup = require('../models/RecordBackup');
const User = require('../models/User');
const Demo = require('../models/Demo');  // ✅ Use the correct model
const MonthlyTarget = require('../models/MonthlyTarget');
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
// const Counsellor = require('../models/Counsellor');
const Template = require('../models/template');
const doubletick = require('../.api/apis/doubletick'); // Adjust path if necessary
const AllRemark = require('../models/AllEnqureRemark');
doubletick.auth('key_2NeZsJAkhj'); // Authenticate API


const Registration = require('../models/Registration');

const s3 = new AWS.S3({
  endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com',
  accessKeyId: '477949571b2baa26ff5b94195b93dd76',
  secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8',
  region: 'auto',
});

const BUCKET_NAME = 'lms';

const backupRecord = async (record, enquiryId) => {
  try {
    // Fetch the caller's name using the caller ID
    const caller = record.caller ? await User.findById(record.caller) : null;
    const callerName = caller ? caller.name : 'Unknown';

    // Fetch the counsellor's name using the counsellor ID
    const counsellor = record.counsellor ? await User.findById(record.counsellor) : null;
    const counsellorName = counsellor ? counsellor.name : 'Unknown';

    // Replace caller and counsellor IDs with their names
    record.caller = callerName;
    record.counsellor = counsellorName;

    // Add the enquiry ID as dataId in the backup
    record.dataId = enquiryId;

    // Create the backup record
    const backup = new RecordBackup(record);
    await backup.save();
    console.log('Backup created successfully for record:', enquiryId);
  } catch (err) {
    console.error('Error creating backup:', err.message);
  }
};

exports.getRecord = async (req, res) => {
  try {
    // Fetch all records
    const records = await RecordBackup.find();

    // Check if records exist
    if (!records || records.length === 0) {
      return res.status(404).json({ message: 'No records found' });
    }

    // Send the records as a response
    res.status(200).json(records);

    // Delete the retrieved records from the database
    await RecordBackup.deleteMany({ _id: { $in: records.map(record => record._id) } });
    console.log('Records deleted successfully.');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.insertdata = async (req, res) => {
  try {
    const { name, phone, source_type, source, fatherName, course } = req.body;

    // Define the query to check if the record exists
    const query = { studentName: name, studentMobile: phone };
    if (fatherName) {
      query.fatherName = fatherName;
    }

    // Define update data
    const updateData = {
      source_type,
      source,
      course,
      enquiryDate: new Date(), // Set enquiryDate to current date
      updatedAt: new Date(),
    };

    // Update if exists, otherwise insert
    const updatedDoc = await Enqure.findOneAndUpdate(query, updateData, {
      new: true, // Return updated document
      upsert: true, // Insert if not found
      setDefaultsOnInsert: true, // Set default values for new records
    });

    res.status(200).json({
      success: true,
      message: updatedDoc.isNew ? "Data inserted successfully" : "Data updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error inserting/updating data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create a new enquiry
exports.createEnquiry = async (req, res) => {
  try {
    const existingEnquiry = await Enqure.findOne({
      studentName: req.body.studentName,
      fatherName: req.body.fatherName,
      studentMobile: req.body.studentMobile,
    }).collation({ locale: 'en', strength: 2 });

    if (existingEnquiry) {
      return res.status(409).json({
        error: 'Duplicate data',
        message: 'An enquiry with the same student name, father name, and mobile number already exists.',
      });
    }

    const remarks = req.body.remarks || [];
    const enquiry = new Enqure(req.body);
    const savedEnquiry = await enquiry.save();
    try {
      const io = req.app?.get?.('io');
      if (io) {
        io.emit('enquiry:created', { _id: savedEnquiry._id, source: savedEnquiry.source, studentName: savedEnquiry.studentName, studentMobile: savedEnquiry.studentMobile, createdAt: savedEnquiry.createdAt, location: savedEnquiry.location, course: savedEnquiry.course });
        io.emit('counts:changed');
      }
    } catch (e) {
      console.warn('Socket emit failed for enquiry:created', e?.message || e);
    }

    const newEnquiryType = savedEnquiry.enquiryType;
    const validTypes = {
      "WIP": "payment",
      "Registration": "registration_template",
      "Drop": "drop_template",
      "Admission": "admission_template"
    };

    if (validTypes[newEnquiryType]) {
      const templateName = validTypes[newEnquiryType];
      const altNumber = savedEnquiry.studentAltNumber?.trim();
      const to = altNumber ? `91${altNumber}` : null;

      if (to) {
        const templateParameters = [];

        if (newEnquiryType === "WIP") {
          const studentName = savedEnquiry.studentName || "Student";
          const admissionLink = `https://ims.ifda.in/student/Form/${savedEnquiry._id}`;
          templateParameters.push(studentName, admissionLink);
        }

        try {
          const response = await doubletick.outgoingMessagesWhatsappTemplate({
            messages: [{
              content: {
                language: "en",
                templateName,
                templateData: {
                  body: { placeholders: templateParameters }
                }
              },
              to
            }]
          });
          console.log(`WhatsApp message sent for ${newEnquiryType}:`, response.data);
        } catch (whatsAppError) {
          console.error("Error sending WhatsApp message:", whatsAppError.message);
        }
      } else {
        console.log("No alternative phone number provided for WhatsApp message.");
      }
    }

    for (const remark of remarks) {
      await AllRemark.create({
        ...remark,
        student_id: savedEnquiry._id,
        source: savedEnquiry.source,
      });
    }

    await backupRecord(savedEnquiry.toObject(), savedEnquiry._id);

    res.status(201).json(savedEnquiry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate data',
        message: 'An enquiry with the same student name, father name, and mobile number already exists.',
      });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(400).json({ error: err.message });
  }
};

// Validate individual enquiry data (optional, depending on your requirements)
const validateEnquiry = (enquiry) => {
  // Add custom validation if necessary
  return enquiry.studentName && enquiry.studentMobile;
};

// Create multiple enquiries with bulkWrite in batches
exports.createMultipleEnquiries = async (req, res) => {
  try {
    const enquiries = req.body;

    if (!Array.isArray(enquiries) || enquiries.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of enquiries' });
    }

    const batchSize = 500; // Set batch size for memory optimization
    const totalBatches = Math.ceil(enquiries.length / batchSize);
    let totalInserted = 0;
    let totalFailed = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batchData = enquiries.slice(i * batchSize, (i + 1) * batchSize);

      const bulkOperations = batchData.map((enquiry) => ({
        insertOne: { document: enquiry }
      }));

      try {
        const result = await Enqure.bulkWrite(bulkOperations, { ordered: false });
        totalInserted += result.insertedCount;
      } catch (err) {
        console.error(`Error in batch ${i + 1}:`, err);
        totalFailed += batchData.length; // Assuming entire batch fails in case of error
      }
    }

    res.status(201).json({
      message: 'Enquiries processed successfully',
      totalInserted,
      totalFailed
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    } else if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate entry detected', details: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.getAllEnquiries = async (req, res) => {
  try {
    const { order = "desc", ...filters } = req.query;
    console.log("Incoming Filters:", filters);

    let queryFilters = {};

    // Handle `!=` and multiple values
    Object.keys(filters).forEach((key) => {
      if (key.endsWith("!")) {
        const field = key.slice(0, -1);
        queryFilters[field] = { $nin: filters[key].split(",") };
      } else if (filters[key].includes(",")) {
        queryFilters[key] = { $in: filters[key].split(",") };
      } else {
        queryFilters[key] = filters[key];
      }
    });

    // Handle `null` and `notnull`
    Object.keys(queryFilters).forEach((key) => {
      if (typeof queryFilters[key] === "string") {
        if (queryFilters[key].toLowerCase() === "null") {
          queryFilters[key] = { $in: [null, ""] };
        } else if (queryFilters[key].toLowerCase() === "notnull") {
          queryFilters[key] = { $exists: true, $ne: null };
        }
      }
    });

    // Handle OR conditions
    Object.keys(filters).forEach((key) => {
      if (key.includes("OR")) {
        const orConditions = key.split("OR").map((field) => {
          const value = filters[key];

          if (value.toLowerCase() === "null") {
            return { [field]: { $in: [null, ""] } };
          } else if (value.toLowerCase() === "notnull") {
            return { [field]: { $exists: true, $ne: null } };
          }
          return { [field]: value };
        });

        if (!queryFilters.$or) {
          queryFilters.$or = [];
        }

        queryFilters.$or.push(...orConditions);
      }
    });

    // Handle Date Fields (including comparison operators)
    const dateFields = [
      "callingDate",
      "visitDate",
      "registrationDate",
      "admissionDate",
      "nextFollowUpDate",
      "todayFollowUpDate",
      "enquiryDate",
    ];

    dateFields.forEach((field) => {
      if (queryFilters[field]) {
        const value = queryFilters[field];

        // Handle comparison operators (`<=`, `>=`, `<`, `>`)
        if (typeof value === "string" && (value.includes("<=") || value.includes(">=") || value.includes("<") || value.includes(">"))) {
          const operatorMap = {
            "<=": "$lte",
            ">=": "$gte",
            "<": "$lt",
            ">": "$gt",
          };

          Object.keys(operatorMap).forEach((op) => {
            if (value.includes(op)) {
              const dateStr = value.replace(op, "").trim();
              const dateValue = new Date(dateStr);
              if (!isNaN(dateValue.getTime())) {
                queryFilters[field] = { [operatorMap[op]]: dateValue };
              } else {
                console.warn(`Invalid date for ${field}:`, value);
                delete queryFilters[field]; // Remove invalid date filters
              }
            }
          });
        }
        // Handle exact date match (YYYY-MM-DD)
        else if (typeof value === "string") {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            queryFilters[field] = {
              $gte: new Date(dateValue.setHours(0, 0, 0, 0)),
              $lte: new Date(dateValue.setHours(23, 59, 59, 999)),
            };
          } else {
            console.warn(`Invalid date for ${field}:`, value);
            delete queryFilters[field]; // Remove invalid date filters
          }
        }
      }
    });

    console.log("Final MongoDB Query with OR conditions:", queryFilters);

    // Handle sorting and population
    const sortOrder = order === "asc" ? 1 : -1;
    const enquiries = await Enqure.find(queryFilters)
      .sort({ updatedAt: sortOrder })
      .populate("counsellor")
      .populate("caller");

    res.status(200).json(enquiries);
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({ error: error.message });
  }
};


// Get a single enquiry by ID
exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid enquiry ID' });
    }
    const enquiry = await Enqure.findById(id);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reassign = async (req, res) => {
  try {
    const currentTime = moment();
    const startTime = moment('18:00', 'HH:mm');
    const endTime = moment('23:59', 'HH:mm');

    // Ensure operation is within the allowed time range
    if (!currentTime.isBetween(startTime, endTime, 'minute', '[]')) {
      return res.status(403).json({
        success: false,
        error: 'This operation can only be performed between 06:00 PM and 12:00 AM.'
      });
    }

    const todayDate = moment().format('YYYY-MM-DD');
    const branch = req.branch || "Unknown Branch";

    // Find students who need reassignment
    const students = await Enqure.find({
      visitDate: { $lte: new Date(todayDate) },
      assign: 'Assigned',
      enquiryDate: null,
      parentStatus: null,
      source: { $in: ['DTSE', 'SOL'] }
    }).populate("caller");

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No pending data to reassign for the ${branch} branch.`
      });
    }

    let updatedCount = 0;

    // Iterate over students and update accordingly
    for (let student of students) {
      let updateData = { assign: 'ReAssigned' };

      // Check if caller is inactive and update caller ID
      if (student.caller && student.caller.status === "Inactive") {
        updateData.caller = "679dc01046fe586f574066f0";
      }

      const result = await Enqure.updateOne({ _id: student._id }, { $set: updateData });

      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    console.log(`Updated Records Count: ${updatedCount}`);

    res.json({
      success: true,
      message: `${updatedCount} students successfully reassigned.`
    });

  } catch (error) {
    console.error("Error during reassign:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.assignUnresponse = async (req, res) => {
  try {
    const { SelectUser, response, pincode, school, DataCount } = req.body;

    if (!SelectUser || !response.length || !pincode.length || !DataCount) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const todayDate = moment().format('YYYY-MM-DD');

    // Fetch eligible enquiries
    const enquiries = await Enqure.find({
      pincode: { $in: pincode },
      school: { $in: school },
      callingDate: { $nin: [todayDate, null] },
      todayFollowUpDate: { $nin: [todayDate] },
      $or: [
        { visitDate: { $lt: todayDate } }, // Before today
        { visitDate: null } // OR null
      ],
      "remarks.response": { $in: response },
      source: { $in: ['DTSE', 'SOL'] },
      enquiryType: null,
      enquiryDate: null,
      assign: "Assigned"
    }).limit(parseInt(DataCount));

    if (enquiries.length === 0) {
      return res.status(404).json({ error: "No matching enquiries found" });
    }

    // Assign the enquiries
    await Promise.all(
      enquiries.map((enquiry) =>
        Enqure.findByIdAndUpdate(enquiry._id, { assign: "Assigned", caller: SelectUser, callingDate: null, visitDate: null, leadStatus: null })
      )
    );

    res.json({ message: "Data assigned successfully", assignedCount: enquiries.length });
  } catch (error) {
    console.error("Error assigning data:", error);
    res.status(500).json({ error: "Failed to assign data" });
  }
};

exports.DeleteData = async (req, res) => {
  try {
      const { records } = req.body; // Get selected records from request body

      if (!records || !records.length) {
          return res.status(400).json({ success: false, error: "No records provided" });
      }

      const updatedRecords = await Enqure.updateMany(
          { _id: { $in: records } }, // Filter by selected _id values
          { $set: { assign: 'Delete' } }
      );

      console.log(`Updated Records Count: ${updatedRecords.modifiedCount}`);

      // Emit counts changed so clients can refresh sidebar badges
      try {
        const io = req.app?.get?.('io');
        if (io) io.emit('counts:changed');
      } catch {}

      res.json({ 
          success: true, 
          message: `${updatedRecords.modifiedCount} students successfully deleted.` 
      });

  } catch (error) {
      console.error("Error during deletion:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.refech = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "Caller ID is required" });
    }

    // Reassign students
    const updatedRecords = await Enqure.updateMany(
      {
        caller: id,
        assign: "Assigned",
        callingDate: null,
        source: { $in: ["DTSE", "SOL"] },
      },
      { $set: { caller: null, assign: null } }
    );

    console.log(`Updated Records Count: ${updatedRecords.modifiedCount || updatedRecords.nModified}`);

    if (updatedRecords.modifiedCount === 0) {
      return res.json({
        success: true,
        message: "No students found to reassign.",
      });
    }

    res.json({
      success: true,
      message: `${updatedRecords.modifiedCount} students successfully reassigned.`,
    });

  } catch (error) {
    console.error("Error during reassign:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
 
// Update an enquiry by ID
// exports.updateEnquiry = async (req, res) => {
//   try {
//     const enquiry = await Enqure.findById(req.params.id);
//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     // Prevent updating caller if it already has a value
//     if (enquiry.caller && req.body.caller) {
//       delete req.body.caller;
//     }

//     const updatedEnquiry = await Enqure.findByIdAndUpdate(
//       req.params.id,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );

//     await backupRecord(updatedEnquiry.toObject(), updatedEnquiry._id);
//     res.status(200).json({ message: 'Enquiry updated successfully', enquiry: updatedEnquiry });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Update an enquiry by ID
exports.updateEnquiry = async (req, res) => {
  try {
    console.log("Start of updateEnquiry function");

    const enquiry = await Enqure.findById(req.params.id);
    if (!enquiry) {
      console.log("Enquiry not found:", req.params.id);
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    console.log("Found Enquiry:", enquiry);

    // Prevent updating caller if it already has a value
    if (enquiry.caller && req.body.caller) {
      delete req.body.caller;
      console.log("Caller is already set, not updating caller field");
    }

    const previousEnquiryType = enquiry.enquiryType;
    console.log("Previous Enquiry Type:", previousEnquiryType);

    const remarks = req.body.remarks || [];

    const updatedEnquiry = await Enqure.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    for (const remark of remarks) {
      await AllRemark.create({
        ...remark,
        student_id: updatedEnquiry._id,
        source: updatedEnquiry.source,
      });
    }

    console.log("Enquiry updated:", updatedEnquiry._id);

    // await backupRecord(updatedEnquiry.toObject(), updatedEnquiry._id);

    // Check if enquiryType has changed and matches one of the defined cases
    const newEnquiryType = updatedEnquiry.enquiryType;
    const validTypes = {
      "WIP": "payment",
      "Registration": "registration_template",
      "Drop": "drop_template",
      "Admission": "admission_template"
    };

    if (
      previousEnquiryType === newEnquiryType &&
      validTypes[newEnquiryType]
    ) {
      console.log("Enquiry Type changed from", previousEnquiryType, "to", newEnquiryType);
      
      const templateName = validTypes[newEnquiryType];
      const to = `91${updatedEnquiry.studentAltNumber}`; // Corrected the phone number construction
      console.log("Phone number to send to:", to);
    
      if (to) {
        const templateParameters = [];
    
        if (newEnquiryType === "WIP") {
          const studentName = updatedEnquiry.studentName || "Student";
          const admissionLink = `https://ims.ifda.in/student/Form/${updatedEnquiry._id}`;
        
          // Log the parameters to ensure they're correctly populated
          console.log("Admission template parameters:", studentName, admissionLink);
        
          templateParameters.push(studentName, admissionLink);
          console.log("Sending Admission template with parameters:", templateParameters);
        }
        

        try {
          const response = await doubletick.outgoingMessagesWhatsappTemplate({
            messages: [{
              content: {
                language: "en",
                templateName,
                templateData: {
                  body: {
                    placeholders: templateParameters
                  }
                }
              },
              to
            }]
          });
          console.log(`WhatsApp message sent for ${newEnquiryType}:`, response.data);
        } catch (whatsAppError) {
          console.error("Error sending WhatsApp message:", whatsAppError.message);
        }
      } else {
        console.log("No alternative phone number provided for WhatsApp message.");
      }
    } else {
      console.log("Enquiry Type not changed or invalid type:", newEnquiryType);
    }

    console.log("End of function, returning response");
    res.status(200).json({
      message: 'Enquiry updated successfully',
      enquiry: updatedEnquiry
    });

  } catch (error) {
    console.error("Error caught in updateEnquiry:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.dataUpdate = async (req, res) => {
  const { SelectUser, SelectArea, SelectSchool, TypeofData, DataCount } = req.body;
  try {
    if (!SelectUser || !SelectArea || !SelectSchool || !TypeofData || !DataCount) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Step 1: Find matching enquiries and limit the number
    const enquiriesToUpdate = await Enqure.find(
      { source: TypeofData, pincode: SelectArea, school: { $in: SelectSchool }, assign: null }
    ).limit(parseInt(DataCount));

    if (enquiriesToUpdate.length === 0) {
      return res.status(404).json({ message: 'No enquiries found to update' });
    }

    // Step 2: Extract the IDs of the enquiries to update
    const enquiryIds = enquiriesToUpdate.map(enquiry => enquiry._id);

    // Step 3: Update the matched enquiries
    const result = await Enqure.updateMany(
      { _id: { $in: enquiryIds } },
      { $set: { caller: SelectUser, assign: 'Assigned' } }
    );

    res.status(200).json({ message: `${result.modifiedCount} enquiries updated successfully` });
  } catch (error) {
    console.error("Error updating enquiry:", error);
    res.status(500).json({ error: error.message });
  }
};

// Import CSV file and insert/update data in batches
exports.importFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded!" });
    }

    const csvBuffer = req.file.buffer;
    const jsonArray = await csv().fromString(csvBuffer.toString());
    const batchSize = 1000;
    let batch = [];
    let errorRecords = [];
    let insertedCount = 0;

    for (let row of jsonArray) {
      try {
        if (!/^\d{10}$/.test(row.studentMobile)) {
          errorRecords.push({ ...row, error: "Invalid mobile number. Must be 10 digits." });
          continue;
        }

        const existingRecord = await Enqure.findOne({ studentMobile: row.studentMobile });
        if (existingRecord) {
          errorRecords.push({ ...row, error: "Duplicate record" });
          continue;
        }

        const enquiryData = {
          source_type: row.source_type || null,
          source: row.source || null,
          studentName: row.studentName || null,
          fatherName: row.fatherName || null,
          motherName: row.motherName || null,
          studentMobile: row.studentMobile || null,
          studentAltNumber: row.studentAltNumber || null,
          location: row.location || null,
          school: row.school || null,
          class: row.class || null,
          pincode: row.pincode || null,
        };

        if (!enquiryData.source || !enquiryData.studentMobile) {
          errorRecords.push({ ...row, error: "Missing required fields (source or studentMobile)" });
          continue;
        }

        batch.push(enquiryData);

        if (batch.length >= batchSize) {
          await insertBatch(batch, errorRecords, () => insertedCount += batch.length);
          batch = [];
        }
      } catch (err) {
        errorRecords.push({ ...row, error: `Error: ${err.message}` });
      }
    }

    if (batch.length > 0) {
      await insertBatch(batch, errorRecords, () => insertedCount += batch.length);
    }

    let errorFileUrl = null;
    if (errorRecords.length > 0) {
      errorFileUrl = await writeErrorCsv(errorRecords);
    }

    res.status(200).json({
      success: true,
      message: "CSV data processed successfully.",
      totalRecords: jsonArray.length,
      insertedRecords: insertedCount,
      failedRecords: errorRecords.length,
      errorFileUrl,
    });
  } catch (err) {
    console.error("Error during import:", err);
    res.status(500).json({ success: false, message: "Internal Server Error.", error: err.message });
  }
};

const insertBatch = async (batch, errorRecords, updateInsertedCount) => {
  try {
    await Enqure.insertMany(batch, { ordered: false });
    updateInsertedCount();
  } catch (bulkErr) {
    if (bulkErr && bulkErr.writeErrors) {
      bulkErr.writeErrors.forEach((err) => {
        let failedDoc = err.err.op;
        failedDoc.error = err.errmsg;
        errorRecords.push(failedDoc);
      });
    }
  }
};

async function writeErrorCsv(errorRecords) {
  if (errorRecords.length === 0) return null;

  const parser = new Parser();
  const csvData = parser.parse(errorRecords);
  const fileKey = `error_logs/${uuidv4()}_error_records.csv`;

  await s3.upload({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: csvData,
    ContentType: 'text/csv',
  }).promise();

  return `https://imsdata.ifda.in/${fileKey}`;
}
// Create a new demo
exports.createDemo = async (req, res) => {
  try {
      const demo = new Demo(req.body);
      await demo.save();
      res.status(201).json({ message: "Demo created successfully", demo });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

// Get all demos
exports.getAllDemos = async (req, res) => {
  console.log("Incoming Request to getAllDemos:", req.originalUrl, req.params, req.query); // Debugging
  
  const { student, counsellor, faculty, demoStatus, branch } = req.query; // Extract filters from query

  // Build filter conditions
  const filter = {};
  if (student) filter.student = student;
  if (counsellor) filter.counsellor = counsellor;
  if (faculty) filter.faculty = faculty;
  if (demoStatus) filter.demoStatus = demoStatus;
  if (branch) filter.branch = branch;

  try {
      const demos = await Demo.find(filter).populate('student counsellor faculty'); // Apply filter
      res.status(200).json(demos);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};


// Get a single demo by ID
exports.getDemoById = async (req, res) => {
  try {
      const demo = await Demo.findById(req.params.id).populate('student counsellor faculty');
      if (!demo) {
          return res.status(404).json({ message: "Demo not found" });
      }
      res.status(200).json(demo);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Update a demo
exports.updateDemo = async (req, res) => {
  try {
      const demo = await Demo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!demo) {
          return res.status(404).json({ message: "Demo not found" });
      }
      res.status(200).json({ message: "Demo updated successfully", demo });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

exports.createTarget = async (req, res) => {
  const { username, totalRevenue, targets } = req.body;

  if (!username || !totalRevenue || !targets || targets.length === 0) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Create a new target entry
    const newTarget = new MonthlyTarget({
      username,
      totalRevenue,
      targets,
    });

    // Save the target data to the database
    await newTarget.save();
    res.status(201).json({ message: 'Target assigned successfully.', data: newTarget });
  } catch (error) {
    console.error('Error creating target:', error);
    res.status(500).json({ message: 'Server error. Could not save target.' });
  }
};

exports.getUserTargets = async (req, res) => {
  const { id } = req.params;
  console.log("Received ID:", id);

  try {
    // Check if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Convert the id to a valid ObjectId using "new"
    const objectId = new mongoose.Types.ObjectId(id);
    console.log("Object ID after conversion:", objectId);

    // Fetch targets for the user by username (ObjectId)
    const targets = await MonthlyTarget.find({ username: objectId });
    console.log("Fetched Targets:", targets);

    if (targets.length === 0) {
      return res.status(404).json({ message: 'No targets found for this user.' });
    }

    res.status(200).json({ data: targets });
  } catch (error) {
    console.error('Error retrieving targets:', error.message);
    res.status(500).json({ message: 'Server error. Could not retrieve targets.', error: error.message });
  }
};

exports.callercount = async (req, res) => {
  const { id } = req.params;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  try {
    console.log("Fetching data for caller ID:", id);

    // Fetch only required data
    const data = await Enqure.find({ $or: [{ caller: id }, { counsellor: id }] }).lean();
    
    // Function to check if a given date is today
    const isToday = (date) => {
      if (!date) return false;
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      return normalizedDate.getTime() === todayDate.getTime();
    };

    // Process data efficiently
    const filteredData = data.map(entry => ({
      ...entry,
      isCallingToday: isToday(entry.callingDate),
      isFollowUpToday: isToday(entry.todayFollowUpDate),
      isVisitToday: isToday(entry.visitDate),
      isNextFollowUpToday: isToday(entry.nextFollowUpDate),
      isTotalFollowUp: entry.visitDate !== null && entry.parentStatus === null && entry.callingDate !== null
    }));

    // Apply optimized filtering
    const TodayCalls = filteredData.filter(entry => 
      (entry.isCallingToday || entry.isFollowUpToday) && entry.caller == id
    );
    
    const RemainingData = filteredData.filter(entry => entry.callingDate === null && entry.caller == id);
    const ReAssigned = filteredData.filter(entry => entry.assign === "ReAssigned" && entry.caller == id);

    const TodayVisitWithParents = filteredData.filter(entry => entry.isVisitToday && entry.parentStatus === "With parents" && entry.caller == id);
    const TodayVisitWithoutParents = filteredData.filter(entry => entry.isVisitToday && entry.parentStatus === "Without parents" && entry.caller == id);
    const TodayVisitOnlyParents = filteredData.filter(entry => entry.isVisitToday && entry.parentStatus === "Only parents" && entry.caller == id);
    const TodayFollowUp = filteredData.filter(entry => entry.isVisitToday && entry.parentStatus === null && entry.caller == id);

    const TotalFollowUp = filteredData.filter(entry => entry.isTotalFollowUp && entry.caller == id);
    
    const CS_TodayFollowUp = filteredData.filter(entry => 
      entry.isNextFollowUpToday && !["Drop", "Admission"].includes(entry.enquiryType) && entry.counsellor == id
    );
    const CS_TotalFollowUp = filteredData.filter(entry => 
      entry.nextFollowUpDate !== null && !["Drop", "Admission"].includes(entry.enquiryType) && entry.counsellor == id
    );

    const TotalEnquiry = filteredData.filter(entry => entry.counsellor == id);

    // Fetch only required web leads
    const webLeads = await Enqure.countDocuments({
      source: 'Web Lead',
      assign: null,
      nextFollowUpDate: null,
      enquiryType: null,
    });


    const Broadcasts = await Enqure.countDocuments({
      source: "Double Tick",
      source_type: "broadcasts",
      nextFollowUpDate: null,
      enquiryType: null,
      assign: null
    });

    const ChatLeads = await Enqure.countDocuments({
      source: "Double Tick",
      source_type: "chat",
      nextFollowUpDate: null,
      enquiryType: null,
      assign: null
    });    

    const FranchiseLeads = await Enqure.countDocuments({
      source: "Double Tick",
      source_type: "franchise",
      nextFollowUpDate: null,
      enquiryType: null,
      assign: null
    });    

    // Send response
    res.status(200).json({
      success: true,
      totalEntries: data.length,
      TodayCalls: TodayCalls.length,
      RemainingData: RemainingData.length,
      ReAssigned: ReAssigned.length,
      TodayVisitWithParents: TodayVisitWithParents.length,
      TodayVisitWithoutParents: TodayVisitWithoutParents.length,
      TodayVisitOnlyParents: TodayVisitOnlyParents.length,
      TodayFollowUp: TodayFollowUp.length,
      TotalFollowUp: TotalFollowUp.length,
      TotalEnquiry: TotalEnquiry.length,
      CS_TodayFollowUp: CS_TodayFollowUp.length,
      CS_TotalFollowUp: CS_TotalFollowUp.length,
      webLeads,
      Broadcasts,
      ChatLeads,
      FranchiseLeads,
    });

  } catch (error) {
    console.error("Error fetching caller data:", error.message);
    res.status(500).json({ success: false, message: `Failed to fetch caller data: ${error.message}` });
  }
};


// Create a new registration
exports.createRegistration = async (req, res) => {
  try {
    const { student } = req.body;

    // Check if the student is already registered
    const existingRegistration = await Registration.findOne({ student });
    if (existingRegistration) {
      return res.status(400).json({ error: "Student is already registered." });
    }

    // If not registered, create a new registration
    const registration = new Registration(req.body);
    const savedRegistration = await registration.save();
    res.status(201).json(savedRegistration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const { studentMobile } = req.query;

    let query = {}; // Default: Fetch all registrations

    if (studentMobile) {
      // Find student by mobile number in Enquiry model
      const student = await Enqure.findOne({ studentMobile: studentMobile });

      if (!student) {
        return res.status(404).json({ message: "No student found with this number." });
      }

      // Query registrations by student ID
      query = { student: student._id };
    }

    const registrations = await Registration.find(query)
      .populate("student")
      .populate("counsellor");

    res.status(200).json(registrations);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: err.message });
  }
};
// Get a single registration by ID
exports.getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('student counsellor');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    res.status(200).json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get registrations by counsellor ID
exports.getRegistrationsByCounsellorId = async (req, res) => {
  try {
    const registrations = await Registration.find({ counsellor: req.params.counsellorId }).populate('student counsellor');
    if (registrations.length === 0) {
      return res.status(404).json({ message: 'No registrations found for this counsellor' });
    }
    res.status(200).json(registrations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update a registration
exports.updateRegistration = async (req, res) => {
  try {
    const { paymentDate, receipt, ...otherUpdates } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    // Build the update query
    const updateQuery = { $set: otherUpdates };

    // Handle paymentDate if it exists and is valid
    if (paymentDate && !isNaN(new Date(paymentDate))) {
      updateQuery.$push = { paymentDate: new Date(paymentDate) };
    }

    // Handle receipt if it exists
    if (receipt) {
      updateQuery.$addToSet = { receipt };
    }

    // Perform the update
    const updatedRegistration = await Registration.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    );

    // Check if the update was successful
    if (!updatedRegistration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json(updatedRegistration);
  } catch (err) {
    console.error("Update Registration Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a registration
exports.deleteRegistration = async (req, res) => {
  try {
    const deletedRegistration = await Registration.findByIdAndDelete(req.params.id);
    if (!deletedRegistration) return res.status(404).json({ message: 'Registration not found' });
    res.status(200).json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// exports.getRemarks = async (req, res) => {
//   try {
//     const { student_id, user, source, department, page = 1, limit = 10 } = req.query;
//     const query = {};

//     if (student_id) query.student_id = student_id;
//     if (user) query.user = user;
//     if (source) query.source = source;
//     if (department) query.department = department;

//     const remarks = await AllRemark.find(query)
//       .populate('user', 'name email')  // assuming user has these fields
//       .populate('student_id', 'studentName studentMobile enquiryType') // assuming these fields
//       .sort({ createdAt: 1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));

//     const total = await AllRemark.countDocuments(query);

//     res.status(200).json({
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit),
//       remarks
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getRemarks = async (req, res) => {
  try {
    const { student_id, user, source, department, studentNumber, page = 1, limit = 10 } = req.query;

    const matchStage = {};
    if (student_id) matchStage.student_id = mongoose.Types.ObjectId(student_id); // Ensure student_id is converted to ObjectId
    if (user) matchStage.user = mongoose.Types.ObjectId(user); // Ensure user is converted to ObjectId
    if (source) matchStage.source = source;
    if (department) matchStage.department = department;

    const aggregatePipeline = [
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: 'enqures',
          localField: 'student_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ];

    // Use $expr to safely match string/number types for studentNumber
    if (studentNumber) {
      aggregatePipeline.push({
        $match: {
          $expr: {
            $eq: [
              { $toString: '$student.studentMobile' }, // Assuming 'studentMobile' should be used for studentNumber
              studentNumber.toString()
            ]
          }
        }
      });
    }

    // Count total number of records
    const totalResults = await AllRemark.aggregate([...aggregatePipeline, { $count: 'count' }]);
    const total = totalResults[0]?.count || 0;

    // Apply pagination and projection
    aggregatePipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          remarks: 1,
          response: 1,
          formType: 1,
          department: 1,
          createdAt: 1,
          studentName: '$student.studentName',
          studentMobile: '$student.studentMobile',
          enquiryType: '$student.enquiryType',
          source: '$student.source',
          studentNumber: '$student.studentNumber',
          userName: '$user.name',
          userEmail: '$user.email'
        }
      }
    );

    const remarks = await AllRemark.aggregate(aggregatePipeline);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      remarks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addReplyToRemark = async (req, res) => {
  const { remarkId } = req.params;
  const { userId, reply } = req.body;

  try {
    const remark = await AllRemark.findById(remarkId);
    if (!remark) {
      return res.status(404).json({ message: 'Remark not found' });
    }

    remark.reply.push({
      user: userId,
      reply: reply,
    });

    await remark.save();

    return res.status(200).json({
      message: 'Reply added successfully',
      data: remark,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDuplicateMobileReport = async (req, res) => {
  try {
    const duplicates = await Enqure.aggregate([
      {
        $match: {
          enquiryType: { $in: ["Admission", "Drop", "Registration", "WIP"] },
        },
      },
      {
        $group: {
          _id: '$studentMobile',
          count: { $sum: 1 },
          enquiryIds: { $push: '$_id' },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $lookup: {
          from: 'enqures',
          localField: 'enquiryIds',
          foreignField: '_id',
          as: 'enquiries',
        },
      },
      {
        $unwind: '$enquiries',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'enquiries.counsellor',
          foreignField: '_id',
          as: 'counsellorDetails',
        },
      },
      {
        $unwind: {
          path: '$counsellorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id', // studentMobile
          count: { $first: '$count' },
          enquiries: {
            $push: {
              studentName: '$enquiries.studentName',
              enquiryType: '$enquiries.enquiryType',
              remark: { $arrayElemAt: ['$enquiries.remarks.remarks', 0] },
              counsellorName: '$counsellorDetails.name',
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: duplicates,
    });
  } catch (error) {
    console.error('Error generating duplicate mobile report:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

exports.getDailyEnquiryReport = async (req, res) => {
  try {
    const { date, counsellor, source, branch, leadStatus, visit, course } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Build dynamic filters
    let filters = {
      enquiryDate: { $gte: startDate, $lte: endDate },
      $or: [
        { source: { $in: ["Double Tick", "Web Lead", "Whatsapp API-Brodcast", "Whatsapp API-Web"] }, visit: "Visited" },
        { source: "Indoor"}
      ]
    };
    if (counsellor) filters.counsellor = counsellor;
    if (source) filters.source = source;
    if (branch) filters.branch = branch;
    if (leadStatus) filters.leadStatus = leadStatus;
    if (visit) filters.visit = visit;
    if (course) filters.course = course;

    const enquiries = await Enqure.find(filters)
      .populate('counsellor', 'name email')
      .populate('caller', 'name email')
      .sort({ createdAt: -1 });

    // Summary counts
    const total = enquiries.length;
    const visited = enquiries.filter(e => e.visit === 'Visited').length;
    const notVisited = enquiries.filter(e => e.visit !== 'Visited').length;
    const bySource = {};
    const byCounsellor = {};
    enquiries.forEach(e => {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      const cName = e.counsellor?.name || 'N/A';
      byCounsellor[cName] = (byCounsellor[cName] || 0) + 1;
    });

    res.status(200).json({
      data: enquiries,
      summary: {
        total,
        visited,
        notVisited,
        bySource,
        byCounsellor
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily enquiry report', error: error.message });
  }
};

exports.getAllVisitedEnquiries = async (req, res) => {
  try {
    const { counsellor, source, branch, course } = req.query;
    let filters = {
      visit: 'Visited'
    };
    if (counsellor) filters.counsellor = counsellor;
    if (source) filters.source = source;
    if (branch) filters.branch = branch;
    if (course) filters.course = course;

    const enquiries = await Enqure.find(filters)
      .populate('counsellor', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all visited enquiries', error: error.message });
  }
};

exports.getAllWebEnquiries = async (req, res) => {
  try {
    const { counsellor, branch, course, visit, date } = req.query;
    let filters = {
      source: 'Web Lead',
      assign: { $ne: 'Delete' },
      visit: { $ne: 'Visited' }
    };
    if (counsellor) filters.counsellor = counsellor;
    if (branch) filters.branch = branch;
    if (course) filters.course = course;
    if (visit) filters.visit = visit;
    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      filters.enquiryDate = { $gte: startDate, $lte: endDate };
    }
    const enquiries = await Enqure.find(filters)
      .populate('counsellor', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all web enquiries', error: error.message });
  }
};

exports.getAllDoubleTickEnquiries = async (req, res) => {
  try {
    const { counsellor, branch, course, visit, date } = req.query;
    let filters = {
      source: 'Double Tick',
      assign: { $ne: 'Delete' },
      visit: { $ne: 'Visited' }
    };
    if (counsellor) filters.counsellor = counsellor;
    if (branch) filters.branch = branch;
    if (course) filters.course = course;
    if (visit) filters.visit = visit;
    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      filters.enquiryDate = { $gte: startDate, $lte: endDate };
    }
    const enquiries = await Enqure.find(filters)
      .populate('counsellor', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all double tick enquiries', error: error.message });
  }
};


exports.getAllFollowupsReport = async (req, res) => {
  try {
    const { counsellor } = req.query;
    let filters = {
      assign: 'Assigned',
      callingDate: { $ne: null },
      parentStatus: null,
      $or: [
        { nextFollowUpDate: { $ne: null } },
        { todayFollowUpDate: { $ne: null } },
        { remarks: { $exists: true, $not: { $size: 0 } } }
      ]
    };
    if (counsellor) filters.counsellor = counsellor;
    const enquiries = await Enqure.find(filters)
      .populate('counsellor', 'name email')
      .populate('caller', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json({ data: enquiries });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all followups', error: error.message });
  }
};

exports.getAdmissionIncentiveReport = async (req, res) => {
  try {
    const { month } = req.query; // month format: YYYY-MM
    let filters = {
      enquiryType: 'Admission',
      assign: { $ne: 'Delete' }
    };
    let startDate, endDate;
    if (month) {
      startDate = new Date(month + '-01');
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // last day of month
      endDate.setHours(23, 59, 59, 999);
      filters.admissionDate = { $gte: startDate, $lte: endDate };
    }
    const admissions = await Enqure.find(filters)
      .populate('counsellor', 'name email') // Ensure counsellor is always populated
      .sort({ createdAt: 1 }); // oldest first for fair distribution

    // Group by counsellor and sum admissionAmount
    const counsellorGroups = {};
    admissions.forEach(a => {
      const cId = a.counsellor?._id?.toString() || 'none';
      if (!counsellorGroups[cId]) counsellorGroups[cId] = [];
      counsellorGroups[cId].push(a);
    });

    let result = [];
    Object.values(counsellorGroups).forEach((adms) => {
      const total = adms.reduce((sum, a) => sum + (a.admissionAmount || 0), 0);
      if (total <= 150000) {
        // No incentive for any admission
        result = result.concat(adms.map(a => ({ ...a.toObject(), incentiveAmount: 0 })));
      } else {
        // Only amount above 1.5 lakh gets 2% incentive, distributed proportionally
        const above = total - 150000;
        const incentiveTotal = above * 0.02;
        const totalForProportion = adms.reduce((sum, a) => sum + (a.admissionAmount || 0), 0);
        let distributed = 0;
        const mapped = adms.map((a, idx) => {
          const amt = a.admissionAmount || 0;
          // Proportional share
          let share = Math.round((amt / totalForProportion) * incentiveTotal);
          // Last admission gets the rounding difference
          if (idx === adms.length - 1) share = Math.round(incentiveTotal - distributed);
          distributed += share;
          return { ...a.toObject(), incentiveAmount: share };
        });
        result = result.concat(mapped);
      }
    });

    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admission incentive report', error: error.message });
  }
};

