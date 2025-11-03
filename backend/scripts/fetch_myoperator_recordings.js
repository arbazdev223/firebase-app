#!/usr/bin/env node
const axios = require('axios');
const path = require('path');
const { connectMongoDB } = require('../config/db');
const MyOperatorCall = require('../models/MyOperatorCall');

const MYOPERATOR_TOKEN = process.env.MYOPERATOR_TOKEN || '';
const UPSTREAM_URL = 'https://developers.myoperator.co/recordings/link';

if (!MYOPERATOR_TOKEN) {
  console.error('MYOPERATOR_TOKEN is not set in environment. Abort.');
  process.exit(2);
}

function filenameFromDoc(doc) {
  if (!doc || !doc.raw) return null;
  const r = doc.raw;
  if (r.filename) return r.filename;
  // try extract from fileurl
  const fileurl = r.fileurl || r.fileUrl || r.file_url;
  if (fileurl) {
    try {
      const p = new URL(fileurl).pathname;
      return path.basename(p);
    } catch (e) {
      return path.basename(fileurl);
    }
  }
  return null;
}

async function fetchLinkForFile(file) {
  try {
    const res = await axios.get(UPSTREAM_URL, {
      params: { token: MYOPERATOR_TOKEN, file },
      timeout: 15000
    });
    if (res && res.data && res.data.url) return res.data.url;
    return null;
  } catch (err) {
    // log and return null
    console.error('Upstream error for file', file, err && err.response ? err.response.status : err.message);
    return null;
  }
}

async function main() {
  await connectMongoDB();
  console.log('Connected to MongoDB. Scanning for calls missing recording_url...');

  const cursor = MyOperatorCall.find({ $or: [{ recording_url: { $exists: false } }, { recording_url: null }, { recording_url: '' }] }).cursor();
  let checked = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    checked++;
    try {
      const file = filenameFromDoc(doc);
      if (!file) continue;
      const url = await fetchLinkForFile(file);
      if (url) {
        doc.recording_url = url;
        doc.recording = url;
        if (!doc.recordings) doc.recordings = [];
        if (!doc.recordings.find(r => (r.url || r) === url)) doc.recordings.push({ url });
        await doc.save();
        updated++;
        console.log('Updated', doc.callId || doc._id, '->', url);
      }
    } catch (err) {
      console.error('Error processing doc', doc._id, err && err.message);
    }
  }

  console.log(`Done. Checked ${checked} docs; updated ${updated}.`);
  process.exit(0);
}

if (require.main === module) main();
