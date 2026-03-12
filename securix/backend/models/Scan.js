const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
    target: {
        type: String,
        required: true
    },
    scanType: {
        type: String,
        enum: ['quick', 'full', 'service', 'vuln', 'os'],
        default: 'quick'
    },
    raw: {
        type: String
    },
    parsed: {
        hostStatus: String,
        totalPorts: Number,
        openPorts: Number,
        closedPorts: Number,
        filteredPorts: Number,
        ports: [{
            port: Number,
            protocol: String,
            state: String,
            service: String
        }],
        osGuess: String,
        scanTime: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Scan', scanSchema);
