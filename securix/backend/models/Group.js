const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        unique: true
    },
    lead: {
        type: String,
        required: true
    },
    members: [{
        type: String
    }],
    target: {
        type: String,
        default: ''
    },
    assignedTA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    score: {
        type: Number,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Idle', 'Completed'],
        default: 'Idle'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    milestones: [{
        title: { type: String, required: true },
        done: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
