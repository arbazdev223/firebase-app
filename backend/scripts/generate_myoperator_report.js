#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:5000';

function usage() {
  console.log('Usage: node generate_myoperator_report.js --type=daily|uncalled|logs --from=YYYY-MM-DD --to=YYYY-MM-DD [--out=path]');
}

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const m = arg.match(/^--([a-zA-Z0-9_-]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  });
  return args;
}

async function writeCsv(filePath, header, records) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const csvWriter = createObjectCsvWriter({ path: filePath, header });
  await csvWriter.writeRecords(records);
  console.log('Wrote', filePath);
}

async function fetchDaily(from, to, out) {
  const url = `${API_BASE}/api/myoperator/reports/daily-calls`;
  const res = await axios.get(url, { params: { from, to, groupBy: 'lead' }, timeout: 30000 });
  const rows = res.data && res.data.rows ? res.data.rows : res.data;
  const records = (rows || []).map(r => ({ date: r._id?.day, lead: r._id?.lead, count: r.count, totalDuration: r.totalDuration }));
  const file = out || path.join(__dirname, '..', 'reports', `myoperator_daily_${from}_to_${to}.csv`);
  await writeCsv(file, [
    { id: 'date', title: 'Date' },
    { id: 'lead', title: 'Lead' },
    { id: 'count', title: 'CallCount' },
    { id: 'totalDuration', title: 'TotalDurationSec' }
  ], records);
}

async function fetchUncalled(from, to, out) {
  const url = `${API_BASE}/api/reports/calls`;
  const res = await axios.get(url, { params: { start: from, end: to, limit: 5000 }, timeout: 30000 });
  const list = (res.data && res.data.summary && res.data.summary.uncalledLeads) ? res.data.summary.uncalledLeads : [];
  const file = out || path.join(__dirname, '..', 'reports', `myoperator_uncalled_${from}_to_${to}.csv`);
  const records = list.map(u => ({ studentName: u.studentName || u.name || '', studentMobile: u.studentMobile || u.candidatePhone || '', caller: u.caller || '', assign: u.assign || '', enquiryDate: u.enquiryDate || '', createdAt: u.createdAt || '' }));
  await writeCsv(file, [
    { id: 'studentName', title: 'Name' },
    { id: 'studentMobile', title: 'Mobile' },
    { id: 'caller', title: 'Caller' },
    { id: 'assign', title: 'AssignedTo' },
    { id: 'enquiryDate', title: 'EnquiryDate' },
    { id: 'createdAt', title: 'CreatedAt' }
  ], records);
}

async function fetchLogs(from, to, out) {
  const url = `${API_BASE}/api/myoperator/logs/search`;
  const body = { from, to, page: 1, page_size: 10000 };
  const res = await axios.post(url, body, { timeout: 60000 });
  const data = (res.data && res.data.data) ? res.data.data : res.data;
  const file = out || path.join(__dirname, '..', 'reports', `myoperator_logs_${from}_to_${to}.csv`);
  const records = (Array.isArray(data) ? data : []).map(r => ({ time: r.timestamp || r.createdAt || '', callId: r.callId || '', from: r.from || '', to: r.to || '', extension: r.extension || '', duration: r.duration || '', status: r.status || '' }));
  await writeCsv(file, [
    { id: 'time', title: 'Time' },
    { id: 'callId', title: 'CallId' },
    { id: 'from', title: 'Caller' },
    { id: 'to', title: 'Callee' },
    { id: 'extension', title: 'Extension' },
    { id: 'duration', title: 'DurationSec' },
    { id: 'status', title: 'Status' }
  ], records);
}

async function main() {
  const args = parseArgs();
  const type = args.type;
  const from = args.from;
  const to = args.to;
  const out = args.out;
  if (!type || !from || !to) {
    usage();
    process.exit(1);
  }
  try {
    if (type === 'daily') await fetchDaily(from, to, out);
    else if (type === 'uncalled') await fetchUncalled(from, to, out);
    else if (type === 'logs') await fetchLogs(from, to, out);
    else {
      console.error('Unknown type:', type);
      usage();
      process.exit(2);
    }
  } catch (err) {
    console.error('Error generating report:', err.message || err);
    process.exit(3);
  }
}

if (require.main === module) main();
