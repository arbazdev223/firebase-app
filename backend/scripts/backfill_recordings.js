#!/usr/bin/env node
const { connectMongoDB } = require('../config/db');
const MyOperatorCall = require('../models/MyOperatorCall');

async function extractRecording(doc) {
  if (!doc || !doc.raw) return null;
  const r = doc.raw;
  if (r.recording) return r.recording;
  if (r.recording_url) return r.recording_url;
  if (r.recordingUrl) return r.recordingUrl;
  if (r.recordings && Array.isArray(r.recordings) && r.recordings.length) {
    const first = r.recordings[0];
    if (first.url) return first.url;
    if (first.recording_url) return first.recording_url;
    if (first.playback_url) return first.playback_url;
  }
  return null;
}

async function main() {
  await connectMongoDB();
  console.log('Connected to MongoDB, scanning MyOperatorCall for recording URLs...');
  const cursor = MyOperatorCall.find({}).cursor();
  let updated = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const url = await extractRecording(doc);
      if (url && (!doc.recording_url || doc.recording_url !== url)) {
        doc.recording_url = url;
        doc.recording = url;
        await doc.save();
        updated++;
      }
    } catch (err) {
      console.error('Error processing doc', doc._id, err.message || err);
    }
  }
  console.log(`Done. Updated ${updated} documents.`);
  process.exit(0);
}

if (require.main === module) main();
