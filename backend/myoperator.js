// --- Scheduled Sync from MyOperator API ---
const axios = require('axios');
const CallLog = require('./models/MyOperatorCall');
const SyncError = require('./models/SyncError');
const SYNC_INTERVAL_MINUTES = process.env.SYNC_INTERVAL_MINUTES || 10;

// Helper: parse duration strings like "HH:MM:SS" or "MM:SS" into seconds
function parseDurationToSeconds(d) {
	if (d == null) return null;
	if (typeof d === 'number') return d;
	if (typeof d === 'string') {
		// if it's a plain number string
		const n = Number(d);
		if (!isNaN(n)) return n;
		const parts = d.split(':').map(p => Number(p));
		if (parts.every(p => !isNaN(p))) {
			if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
			if (parts.length === 2) return parts[0] * 60 + parts[1];
			if (parts.length === 1) return parts[0];
		}
	}
	return null;
}

async function syncMyOperatorLogs() {
	try {
		let log_from = 0, page_size = 100, hasMore = true;
		const token = process.env.MYOPERATOR_TOKEN;
		while (hasMore) {
			const res = await axios.post('https://developers.myoperator.co/search', {
				token,
				log_from,
				page_size,
			});
			const logs = res.data.data && res.data.data.hits ? res.data.data.hits : [];
			for (const log of logs) {
				const src = log._source || log._source || log;
				let recording_url = null;
				if (src.filename) {
					try {
						const recRes = await axios.get('https://developers.myoperator.co/recordings/link', {
							params: { token, file: src.filename }
						});
						recording_url = recRes.data.url;
					} catch (e) { recording_url = null; }
				}

				// Normalize duration: prefer numeric seconds, fall back to parsing HH:MM:SS strings
				let durationSeconds = null;
				if (src.seconds && !isNaN(Number(src.seconds))) {
					durationSeconds = Number(src.seconds);
				} else {
					durationSeconds = parseDurationToSeconds(src.duration);
				}

				// Extract receiver name and remark from nested structures if present
				const receiverName = (src.log_details && src.log_details[0] && src.log_details[0].received_by && src.log_details[0].received_by[0] && src.log_details[0].received_by[0].name)
					|| (src.received_by && src.received_by[0] && src.received_by[0].name)
					|| src.receiver_name || src.to_name || '';
				const remarkText = (src.log_details && src.log_details[0] && (src.log_details[0]._ds || src.log_details[0].action)) || src.remark || src.remarks || '';
				let remarkDate = null;
				const remarkDateRaw = (src.log_details && src.log_details[0] && src.log_details[0]._rst) || src.remark_date || src.received_at || src._rst || null;
				if (remarkDateRaw) {
					const n = Number(remarkDateRaw);
					if (!isNaN(n)) {
						remarkDate = n > 1e12 ? new Date(n) : new Date(n * 1000);
					} else {
						const d = new Date(String(remarkDateRaw));
						if (!isNaN(d.getTime())) remarkDate = d;
					}
				}

				// Save normalized document with per-record try/catch
				try {
					await CallLog.updateOne(
						{ callId: log.user_id },
						{
							callId: log.user_id,
							from: src.caller_number || src.caller_number_raw || src.caller || null,
							to: src.to_number || src.to || src.fileurl || null,
							receiver_name: receiverName || undefined,
							timestamp: src.start_time ? new Date(src.start_time * 1000) : (src._ms ? new Date(src._ms) : undefined),
							duration: (durationSeconds != null) ? durationSeconds : undefined,
							durationRaw: src.duration || undefined,
							status: String(src.status || ''),
							// Agent should come from explicit agent_name if provided by MyOperator.
							// receiver_name is taken from log_details.received_by; they may be the same in many cases,
							// but keep them separate to allow distinguishing "agent" vs "receiver_name".
							agent: src.agent_name || undefined,
							filename: src.filename || undefined,
							recording_url: recording_url || src.fileurl || undefined,
							remark: remarkText || undefined,
							remark_date: remarkDate || undefined,
							raw: src,
						},
						{ upsert: true }
					);
				} catch (recErr) {
					console.error('Error saving record', recErr && recErr.message);
					// store sync error for later inspection
					try {
						await SyncError.create({ source: 'myoperator', callId: log.user_id, payload: src, error: (recErr && recErr.stack) || String(recErr) });
					} catch (e2) {
						console.error('Failed to save SyncError', e2 && e2.message);
					}
				}
			}
			hasMore = logs.length === page_size;
			log_from += page_size;
		}
		console.log('MyOperator logs sync complete');
	} catch (err) {
		console.error('MyOperator logs sync error:', err);
	}
}

setInterval(syncMyOperatorLogs, SYNC_INTERVAL_MINUTES * 60 * 1000);
syncMyOperatorLogs();

// Export for manual trigger from routes
module.exports = { syncMyOperatorLogs };
