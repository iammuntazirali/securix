const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

//--- signup ---//
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, role });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, group: user.group || '' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true, message: 'Account created successfully', token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- login ---//
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, group: user.group || '' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true, message: 'Login successful', token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get current user ---//
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get all users (faculty only) ---//
router.get('/users', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ role: 1, name: 1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- get all students (faculty only) ---//
router.get('/students', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').sort({ name: 1 });
        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//--- assign student to group (faculty only) ---//
router.patch('/users/:id/group', authMiddleware, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { group } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { group: group || null },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
