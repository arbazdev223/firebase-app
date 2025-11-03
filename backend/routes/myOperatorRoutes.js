const express = require('express');
const router = express.Router();
const { syncMyOperatorLogs } = require('../myoperator');
const MyOperatorCall = require('../models/MyOperatorCall');
const mongoose = require('mongoose');

// POST /api/myoperator/sync to trigger sync manually
router.post('/sync', async (req, res) => {
    try {
        await syncMyOperatorLogs();
        res.status(200).json({ message: 'MyOperator logs sync triggered.' });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

// GET /api/myoperator/logs?page=1&page_size=10&query=... optional filters
// Supports filters: query (caller/receiver/callId), from, to (ISO dates), status, agent, receiver_name, sort_by, sort_dir
router.get('/logs', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const page_size = Math.max(1, parseInt(req.query.page_size) || 10);
        const skip = (page - 1) * page_size;

        const filter = {};
        if (req.query.query) {
            const q = req.query.query;
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
            filter.$or = [ { from: rx }, { to: rx }, { callId: rx }, { receiver_name: rx }, { agent: rx } ];
        }
        if (req.query.from || req.query.to) {
            filter.timestamp = {};
            if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
            if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
        }
        if (req.query.status) filter.status = String(req.query.status);
        if (req.query.agent) filter.agent = req.query.agent;
        if (req.query.receiver_name) filter.receiver_name = req.query.receiver_name;

        // Sorting
        const sort_by = req.query.sort_by || 'timestamp';
        const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;

        const [total, data] = await Promise.all([
            MyOperatorCall.countDocuments(filter),
            MyOperatorCall.find(filter).sort({ [sort_by]: sort_dir }).skip(skip).limit(page_size)
        ]);

        return res.json({ status: 'success', code: 200, page, page_size, total, logs: data });
    } catch (err) {
        console.error('GET /api/myoperator/logs error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
    }
});

    // Aggregation endpoints for dashboard
    // GET /api/myoperator/aggregate/summary
    router.get('/aggregate/summary', async (req, res) => {
        try {
            const match = {};
            if (req.query.from || req.query.to) {
                match.timestamp = {};
                if (req.query.from) match.timestamp.$gte = new Date(req.query.from);
                if (req.query.to) match.timestamp.$lte = new Date(req.query.to);
            }

            const total = await MyOperatorCall.countDocuments(match);
            const avgDurationAgg = await MyOperatorCall.aggregate([
                { $match: match },
                { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
            ]);
            const byStatus = await MyOperatorCall.aggregate([
                { $match: match },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            return res.json({ total, avgDuration: (avgDurationAgg[0] && avgDurationAgg[0].avgDuration) || 0, byStatus });
        } catch (err) {
            console.error('GET /api/myoperator/aggregate/summary error:', err);
            return res.status(500).json({ status: 'error', message: 'Aggregation failed' });
        }
    });

    // GET /api/myoperator/aggregate/daily?days=7
    router.get('/aggregate/daily', async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 7;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - (days - 1));
            fromDate.setHours(0,0,0,0);

            const data = await MyOperatorCall.aggregate([
                { $match: { timestamp: { $gte: fromDate } } },
                { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, duration: "$duration", status: "$status" } },
                { $group: { _id: "$day", total: { $sum: 1 }, avgDuration: { $avg: "$duration" }, statuses: { $push: "$status" } } },
                { $sort: { _id: 1 } }
            ]);

            return res.json({ days: data });
        } catch (err) {
            console.error('GET /api/myoperator/aggregate/daily error:', err);
            return res.status(500).json({ status: 'error', message: 'Aggregation failed' });
        }
    });

    // GET /api/myoperator/aggregate/agent-stats
    router.get('/aggregate/agent-stats', async (req, res) => {
        try {
            const match = {};
            if (req.query.from || req.query.to) {
                match.timestamp = {};
                if (req.query.from) match.timestamp.$gte = new Date(req.query.from);
                if (req.query.to) match.timestamp.$lte = new Date(req.query.to);
            }

            const data = await MyOperatorCall.aggregate([
                { $match: match },
                { $group: { _id: "$agent", count: { $sum: 1 }, avgDuration: { $avg: "$duration" }, statuses: { $push: "$status" } } },
                { $sort: { count: -1 } }
            ]);

            return res.json({ agents: data });
        } catch (err) {
            console.error('GET /api/myoperator/aggregate/agent-stats error:', err);
            return res.status(500).json({ status: 'error', message: 'Aggregation failed' });
        }
    });

module.exports = router;

