const express = require('express');
const multer = require('multer');
const path = require('path');
const Vulnerability = require('../models/Vulnerability');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

//--- multer config for screenshot uploads ---//
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowedTypes.test(file.mimetype);
        if (extOk && mimeOk) cb(null, true);
        else cb(new Error('Only images (jpg, png, gif, webp) are allowed'));
    }
});

//--- submit vulnerability (with optional screenshot) ---//
router.post('/', authMiddleware, upload.single('screenshot'), async (req, res) => {
    try {
        const { attackCategory, attackType, attackMethod, severity, payload, description, target, targetGroup } = req.body;

        // Fetch user's group from DB to ensure it's always up-to-date
        const User = require('../models/User');
        const userDoc = await User.findById(req.user.id).select('group');
        const userGroup = userDoc?.group || req.user.group || '';

        const vulnData = {
            attackCategory,
            attackType,
            attackMethod,
            severity,
            payload: payload || '',
            description,
            target: target || '',
            targetGroup: targetGroup || '',
            user: req.user.id,
            group: userGroup
        };

        if (req.file) {
            vulnData.screenshotUrl = `/uploads/${req.file.filename}`;
        }

        const vuln = await Vulnerability.create(vulnData);

        res.status(201).json({
            success: true,
            message: 'Attack report submitted for review',
            vulnerability: vuln
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get my vulnerabilities ---//
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        const vulns = await Vulnerability.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ success: true, vulnerabilities: vulns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get all vulnerabilities (TA/Faculty) ---//
router.get('/', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'ta') {
            const Group = require('../models/Group');
            const myGroups = await Group.find({ assignedTA: req.user.id }).select('groupId');
            const groupIds = myGroups.map(g => g.groupId);
            query = { group: { $in: groupIds } };
        }

        const vulns = await Vulnerability.find(query)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });
        res.json({ success: true, vulnerabilities: vulns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- review vulnerability (TA/Faculty) ---//
router.patch('/:id/review', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'
        
        const vuln = await Vulnerability.findById(req.params.id);
        if (!vuln) return res.status(404).json({ success: false, error: 'Not found' });

        if (req.user.role === 'ta') {
            const Group = require('../models/Group');
            const group = await Group.findOne({ groupId: vuln.group });
            if (!group || group.assignedTA?.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Not authorized to review vulnerabilities for this group' });
            }
        }

        vuln.status = status;
        vuln.reviewedBy = req.user.id;
        await vuln.save();

        res.json({ success: true, vulnerability: vuln });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
