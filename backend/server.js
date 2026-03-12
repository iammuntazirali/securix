require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const path = require('path');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scans');
const vulnRoutes = require('./routes/vulnerabilities');
const groupRoutes = require('./routes/groups');
const Scan = require('./models/Scan');
const { authMiddleware } = require('./middleware/auth');
const app = express();
const PORT = process.env.PORT || 5000;



//--- http server + socket.io ---//
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});



//--- middleware ---//
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//--- mongodb connection ---//
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Server will run without DB. Auth features will not work.');
    });


//--- routes ---//
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/vulnerabilities', vulnRoutes);
app.use('/api/groups', groupRoutes);

//--- socket.io auth + live scan ---//
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`[SOCKET] Connected: ${socket.user.email}`);

    socket.on('start-scan', ({ targetIp, scanType }) => {
        //--- input validation ---//
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!targetIp || (!ipRegex.test(targetIp) && !domainRegex.test(targetIp))) {
            socket.emit('scan-error', { error: 'Invalid target. Use IP or domain.' });
            return;
        }
        if (/[;&|`$(){}]/.test(targetIp)) {
            socket.emit('scan-error', { error: 'Invalid characters in target.' });
            return;
        }

        //--- build nmap ---//
        let nmapArgs;
        switch (scanType) {
            case 'quick': nmapArgs = ['-Pn', '-F', '-T4', targetIp]; break;
            case 'full': nmapArgs = ['-Pn', '-p-', '-T4', targetIp]; break;
            case 'vuln': nmapArgs = ['-Pn', '--script', 'vuln', targetIp]; break;
            case 'os': nmapArgs = ['-Pn', '-O', '-T4', targetIp]; break;
            case 'service': nmapArgs = ['-Pn', '-sV', '-T4', targetIp]; break;
            default: nmapArgs = ['-Pn', '-F', '-T4', targetIp];
        }
            
        console.log(`[SCAN] User: ${socket.user.email} | nmap ${nmapArgs.join(' ')}`);
        socket.emit('scan-line', { line: `> Initializing ${(scanType || 'quick').toUpperCase()} scan on ${targetIp}...`, color: 'text-slate-300' });
        socket.emit('scan-line', { line: '> [SCANNING] Nmap process started...', color: 'text-blue-400' });

        let fullOutput = '';
        const nmap = spawn('nmap', nmapArgs, { timeout: 120000 });

        //--- stream stdout line by line ---//
        let buffer = '';
        nmap.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim()) {
                    fullOutput += line + '\n';
                    socket.emit('scan-line', { line: `> ${line}`, color: getLineColor(line) });
                }
            }
        });

        nmap.stderr.on('data', (data) => {
            const errLine = data.toString().trim();
            if (errLine) {
                socket.emit('scan-line', { line: `> [WARN] ${errLine}`, color: 'text-yellow-500' });
            }
        });

        nmap.on('close', (code) => {
            // flush remaining buffer
            if (buffer.trim()) {
                fullOutput += buffer + '\n';
                socket.emit('scan-line', { line: `> ${buffer}`, color: getLineColor(buffer) });
            }

            if (code !== 0 && code !== null) {
                socket.emit('scan-error', { error: `Nmap exited with code ${code}` });
                return;
            }

            const parsed = parseNmapOutput(fullOutput);

            //--- save to db ---//
            Scan.create({
                target: targetIp,
                scanType: scanType || 'quick',
                raw: fullOutput,
                parsed,
                user: socket.user.id
            }).catch(dbErr => console.error('[DB] Failed to save scan:', dbErr.message));
            socket.emit('scan-complete', {
                success: true,
                target: targetIp,
                scanType: scanType || 'quick',
                parsed,
                timestamp: new Date().toISOString(),
                scannedBy: socket.user.email
            });
            console.log(`[SCAN] Complete for ${socket.user.email}: ${targetIp}`);
        });
        nmap.on('error', (err) => {
            socket.emit('scan-error', { error: `Failed to start nmap: ${err.message}` });
        });
    });
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Disconnected: ${socket.user.email}`);
    });
});

// Color helper for live terminal lines
function getLineColor(line) {
    if (line.includes('open')) return 'text-red-400';
    if (line.includes('closed')) return 'text-slate-600';
    if (line.includes('filtered')) return 'text-yellow-500';
    if (line.includes('Host is up')) return 'text-emerald-400';
    if (line.includes('Host seems down') || line.includes('host down')) return 'text-red-500';
    if (line.includes('Nmap done')) return 'text-slate-500';
    if (line.includes('PORT') && line.includes('STATE')) return 'text-slate-500 font-bold';
    if (line.includes('OS details') || line.includes('Running:')) return 'text-cyan-400';
    return 'text-slate-400';
}

//--- legacy rest scan api  ---//
app.post('/api/scan', authMiddleware, async (req, res) => {
    const { targetIp, scanType } = req.body;

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!targetIp || (!ipRegex.test(targetIp) && !domainRegex.test(targetIp))) {
        return res.status(400).json({ success: false, error: 'Invalid target.' });
    }
    if (/[;&|`$(){}]/.test(targetIp)) {
        return res.status(400).json({ success: false, error: 'Invalid characters in target IP' });
    }

    let nmapArgs;
    switch (scanType) {
        case 'quick': nmapArgs = ['-Pn', '-F', '-T4', targetIp]; break;
        case 'full': nmapArgs = ['-Pn', '-p-', '-T4', targetIp]; break;
        case 'vuln': nmapArgs = ['-Pn', '--script', 'vuln', targetIp]; break;
        case 'os': nmapArgs = ['-Pn', '-O', '-T4', targetIp]; break;
        case 'service': nmapArgs = ['-Pn', '-sV', '-T4', targetIp]; break;
        default: nmapArgs = ['-Pn', '-F', '-T4', targetIp];
    }

    const nmap = spawn('nmap', nmapArgs, { timeout: 120000 });
    let stdout = '';
    let stderr = '';

    nmap.stdout.on('data', d => stdout += d.toString());
    nmap.stderr.on('data', d => stderr += d.toString());

    nmap.on('close', (code) => {
        if (code !== 0 && code !== null) {
            return res.status(500).json({ success: false, error: `Scan failed (code ${code})`, raw: stderr });
        }
        const parsed = parseNmapOutput(stdout);
        Scan.create({ target: targetIp, scanType: scanType || 'quick', raw: stdout, parsed, user: req.user.id })
            .catch(dbErr => console.error('[DB] Failed to save scan:', dbErr.message));
        res.json({ success: true, target: targetIp, scanType: scanType || 'quick', raw: stdout, parsed, timestamp: new Date().toISOString(), scannedBy: req.user.email });
    });

    nmap.on('error', (err) => {
        res.status(500).json({ success: false, error: `Failed to start nmap: ${err.message}` });
    });
});

//--- nmap output  ---//

function parseNmapOutput(output) {
    const lines = output.split('\n');
    const ports = [];
    let hostStatus = 'unknown';
    let osGuess = '';
    let scanTime = '';

    for (const line of lines) {
        if (line.includes('Host is up')) {
            hostStatus = 'up';
            const latencyMatch = line.match(/\(([\d.]+)s latency\)/);
            if (latencyMatch) {
                hostStatus = `up (${latencyMatch[1]}s latency)`;
            }
        }
        if (line.includes('Host seems down') || line.includes('host down')) {
            hostStatus = 'down';
        }
        const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(.*)$/);
        if (portMatch) {
            ports.push({
                port: parseInt(portMatch[1]),
                protocol: portMatch[2],
                state: portMatch[3],
                service: portMatch[4].trim()
            });
        }
        if (line.includes('OS details:') || line.includes('Running:')) {
            osGuess = line.trim();
        }
        if (line.includes('Nmap done:')) {
            scanTime = line.trim();
        }
    }
    return {
        hostStatus,
        totalPorts: ports.length,
        openPorts: ports.filter(p => p.state === 'open').length,
        closedPorts: ports.filter(p => p.state === 'closed').length,
        filteredPorts: ports.filter(p => p.state === 'filtered').length,
        ports,
        osGuess,
        scanTime
    };
}

//--- health check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SecureLab Backend Running' });
});

//--- start server ---
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  SecureLab Backend running on http://localhost:${PORT}`);
    console.log(` Nmap API:  POST http://localhost:${PORT}/api/scan`);
    console.log(` WebSocket: ws://localhost:${PORT} (live scan)`);
    console.log(` Auth API:  POST http://localhost:${PORT}/api/auth/signup`);
    console.log(` Auth API:  POST http://localhost:${PORT}/api/auth/login`);
    console.log(` Health:    GET  http://localhost:${PORT}/api/health\n`);
});
