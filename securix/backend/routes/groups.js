const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

//--- get all groups ---//
router.get('/', authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find()
            .populate('assignedTA', 'name email')
            .sort({ groupId: 1 });
        res.json({ success: true, groups });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get groups assigned to current TA ---//
router.get('/my-groups', authMiddleware, authorizeRoles('ta'), async (req, res) => {
    try {
        const groups = await Group.find({ assignedTA: req.user.id })
            .populate('assignedTA', 'name email')
            .sort({ groupId: 1 });
        res.json({ success: true, groups });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get all TAs (for faculty to assign) ---//
router.get('/tas', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const tas = await User.find({ role: 'ta' }).select('name email _id');
        res.json({ success: true, tas });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get student's own group ---//
router.get('/my-group', authMiddleware, async (req, res) => {
    try {
        // Find group by checking if user's name is in members or user's group field matches
        const userDoc = await User.findById(req.user.id);
        let group = null;

        if (userDoc && userDoc.group) {
            group = await Group.findOne({ groupId: userDoc.group })
                .populate('assignedTA', 'name email');
        }

        if (!group) {
            // Fallback: search by name in members
            group = await Group.findOne({ members: req.user.name })
                .populate('assignedTA', 'name email');
        }

        if (!group) {
            return res.json({ success: true, group: null, message: 'Not assigned to any group yet' });
        }
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get attack targets (other groups' IPs for students) ---//
router.get('/attack-targets', authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find()
            .select('groupId target members lead status')
            .sort({ groupId: 1 });
        res.json({ success: true, groups });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- create group ---//
router.post('/', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { groupId, lead, members, target, assignedTA } = req.body;
        const defaultMilestones = [
            { title: 'Reconnaissance', done: false },
            { title: 'Vulnerability Scanning', done: false },
            { title: 'Exploitation', done: false },
            { title: 'Report Submitted', done: false }
        ];
        const group = await Group.create({ groupId, lead, members, target, assignedTA, milestones: defaultMilestones });
        res.status(201).json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- grade group ---//
router.patch('/:id/grade', authMiddleware, authorizeRoles('ta', 'faculty'), async (req, res) => {
    try {
        const { score, feedback } = req.body;
        const group = await Group.findById(req.params.id);
        
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        if (req.user.role === 'ta' && group.assignedTA?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized to grade this group' });
        }

        group.score = score;
        group.feedback = feedback;
        await group.save();

        res.json({ success: true, message: `Grade saved for ${group.groupId}`, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- update progress & milestones ---//
router.patch('/:id/progress', authMiddleware, async (req, res) => {
    try {
        const { progress, milestones } = req.body;
        
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        if (req.user.role === 'ta' && group.assignedTA?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized to update progress for this group' });
        }
        
        if (req.user.role === 'student') {
            const userDoc = await User.findById(req.user.id);
            if (!group.members.includes(req.user.name) && userDoc?.group !== group.groupId) {
                return res.status(403).json({ success: false, error: 'Not authorized to update progress for this group' });
            }
        }

        if (progress !== undefined) group.progress = progress;
        if (milestones) group.milestones = milestones;

        await group.save();

        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- assign ta to group ---//
router.patch('/:id/assign-ta', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { taId } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { assignedTA: taId || null },
            { new: true }
        ).populate('assignedTA', 'name email');
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- seed default groups ---//
router.post('/seed', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const existing = await Group.countDocuments();
        if (existing > 0) {
            return res.json({ success: true, message: `${existing} groups already exist. Skipping seed.` });
        }

        const defaultMilestones = [
            { title: 'Reconnaissance', done: false },
            { title: 'Vulnerability Scanning', done: false },
            { title: 'Exploitation', done: false },
            { title: 'Report Submitted', done: false }
        ];

        const defaultGroups = [
            { groupId: 'G-01', lead: 'Ayush', members: ['Ayush', 'Ravi', 'Sneha'], target: '192.168.1.10', status: 'Active', milestones: defaultMilestones },
            { groupId: 'G-02', lead: 'Rahul', members: ['Rahul', 'Priya', 'Amit'], target: '192.168.1.15', status: 'Active', milestones: defaultMilestones },
            { groupId: 'G-03', lead: 'Sneha', members: ['Sneha', 'Karan', 'Neha'], target: '192.168.1.22', status: 'Idle', milestones: defaultMilestones },
            { groupId: 'G-04', lead: 'Amit', members: ['Amit', 'Pooja', 'Arjun'], target: '192.168.1.9', status: 'Active', milestones: defaultMilestones },
        ];

        await Group.insertMany(defaultGroups);
        res.status(201).json({ success: true, message: '4 default groups seeded' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
//--- delete group (faculty only) ---//
router.delete('/:id', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const group = await Group.findByIdAndDelete(req.params.id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, message: `Group ${group.groupId} deleted` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- update group details (faculty only) ---//
router.patch('/:id', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { groupId, lead, members, target } = req.body;
        const updateData = {};
        if (groupId !== undefined) updateData.groupId = groupId;
        if (lead !== undefined) updateData.lead = lead;
        if (members !== undefined) updateData.members = members;
        if (target !== undefined) updateData.target = target;

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('assignedTA', 'name email');
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
