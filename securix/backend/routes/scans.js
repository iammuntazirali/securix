const express = require('express');
const Scan = require('../models/Scan');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

//--- get scan history ---//
router.get('/', authMiddleware, async (req, res) => {
    try {
        const scans = await Scan.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('-raw'); // Exclude raw output to keep response small

        res.json({ success: true, scans });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get single scan details ---//
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const scan = await Scan.findOne({ _id: req.params.id, user: req.user.id });
        if (!scan) {
            return res.status(404).json({ success: false, error: 'Scan not found' });
        }
        res.json({ success: true, scan });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
