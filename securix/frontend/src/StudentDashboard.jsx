import React, { useState, useRef, useEffect } from 'react';
import { Shield, Activity, Search, AlertTriangle, Award, CheckCircle, PlayCircle, Terminal, Wifi, Server, LogOut, BarChart3, Upload, Crosshair, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import API_BASE from './api';
import { io } from 'socket.io-client';

const ATTACK_CATEGORIES = [
  'Web Application',
  'Network',
  'Social Engineering',
  'Wireless',
  'System',
  'Other'
];

const ATTACK_METHODS = {
  'Web Application': ['SQL Injection', 'Cross-Site Scripting (XSS)', 'CSRF', 'File Upload', 'Command Injection', 'Directory Traversal', 'IDOR', 'Other'],
  'Network': ['Port Scanning', 'Man-in-the-Middle', 'ARP Spoofing', 'DNS Spoofing', 'Packet Sniffing', 'DoS/DDoS', 'Other'],
  'Social Engineering': ['Phishing', 'Pretexting', 'Baiting', 'Tailgating', 'Other'],
  'Wireless': ['WPA Cracking', 'Evil Twin', 'Deauth Attack', 'Rogue AP', 'Other'],
  'System': ['Privilege Escalation', 'Buffer Overflow', 'Brute Force', 'Password Cracking', 'Backdoor', 'Other'],
  'Other': ['Other']
};

const StudentDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scanner');

  // Scanner state
  const [targetIp, setTargetIp] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('quick');
  const [scanResults, setScanResults] = useState(null);
  const [terminalLines, setTerminalLines] = useState([
    { text: 'SECURE-LAB OS v4.2.0-STABLE', color: 'text-slate-500' },
    { text: '> Ready. Enter a target IP and start scanning.', color: 'text-emerald-500' }
  ]);

  const terminalRef = useRef(null);
  const socketRef = useRef(null);

  // Scan history
  const [scanHistory, setScanHistory] = useState([]);

  // Attack Report form
  const [vulnForm, setVulnForm] = useState({
    attackCategory: '',
    attackType: '',
    attackMethod: '',
    severity: 'Critical',
    payload: '',
    description: '',
    targetGroup: ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [vulnMsg, setVulnMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Attack targets
  const [attackTargets, setAttackTargets] = useState([]);

  // My submitted reports
  const [myReports, setMyReports] = useState([]);

  // My Group info (from DB)
  const [myGroup, setMyGroup] = useState(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Socket connection
  useEffect(() => {
    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => console.log('[Socket] Connected'));

    socket.on('scan-line', ({ line, color }) => {
      setTerminalLines(prev => [...prev, { text: line, color: color || 'text-slate-400' }]);
    });

    socket.on('scan-complete', (data) => {
      setScanResults(data);
      setScanning(false);
      setTerminalLines(prev => [
        ...prev,
        { text: '> ─────────────────────────────────────────', color: 'text-slate-700' },
        { text: `> ✅ Scan Complete! ${data.parsed.openPorts} open ports found.`, color: 'text-emerald-400 font-bold' }
      ]);
      fetchScanHistory();
    });

    socket.on('scan-error', ({ error }) => {
      setScanning(false);
      setTerminalLines(prev => [...prev, { text: `> [ERROR] ${error}`, color: 'text-red-500 font-bold' }]);
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [token]);

  // Fetch data on mount
  useEffect(() => {
    fetchScanHistory();
    fetchAttackTargets();
    fetchMyReports();
    fetchMyGroup();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scans`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setScanHistory(data.scans);
    } catch { }
  };

  const fetchAttackTargets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/attack-targets`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAttackTargets(data.groups);
    } catch { }
  };

  const fetchMyReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vulnerabilities/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMyReports(data.vulnerabilities);
    } catch { }
  };

  const fetchMyGroup = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/my-group`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.group) setMyGroup(data.group);
    } catch { }
  };

  // Real scores from group (DB)
  const groupScore = myGroup?.score ?? '—';
  const groupFeedback = myGroup?.feedback || 'No feedback yet';
  const gradeStatus = myGroup?.score !== null && myGroup?.score !== undefined ? 'Graded' : 'Pending';

  // NMAP SCAN
  const runScan = async () => {
    if (!targetIp) return alert("Please enter a Target IP!");
    setScanning(true);
    setScanResults(null);
    setTerminalLines([{ text: 'SECURE-LAB OS v4.2.0-STABLE', color: 'text-slate-500' }]);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start-scan', { targetIp, scanType });
      return;
    }

    // REST fallback
    setTerminalLines(prev => [
      ...prev,
      { text: `> Initializing ${scanType.toUpperCase()} scan on ${targetIp}...`, color: 'text-slate-300' },
      { text: '> [SCANNING] Running Nmap... Please wait.', color: 'text-blue-400 animate-pulse' }
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetIp, scanType })
      });
      const data = await response.json();
      if (data.success) {
        const lines = [
          { text: 'SECURE-LAB OS v4.2.0-STABLE', color: 'text-slate-500' },
          { text: `> Scan Complete! Target: ${data.target}`, color: 'text-emerald-400 font-bold' },
          { text: `> Host Status: ${data.parsed.hostStatus}`, color: data.parsed.hostStatus.includes('up') ? 'text-emerald-400' : 'text-red-400' },
          { text: `> ─────────────────────────────────────────`, color: 'text-slate-700' },
          { text: `> PORTS: ${data.parsed.totalPorts} total | ${data.parsed.openPorts} open | ${data.parsed.closedPorts} closed`, color: 'text-yellow-400 font-bold' },
        ];
        if (data.parsed.ports.length > 0) {
          lines.push({ text: `>   PORT       STATE      SERVICE`, color: 'text-slate-500 font-bold' });
          data.parsed.ports.forEach(port => {
            const stateColor = port.state === 'open' ? 'text-red-400' : port.state === 'filtered' ? 'text-yellow-500' : 'text-slate-600';
            lines.push({ text: `>   ${`${port.port}/${port.protocol}`.padEnd(10)} ${port.state.padEnd(10)} ${port.service}`, color: stateColor });
          });
        }
        setTerminalLines(lines);
        setScanResults(data);
        fetchScanHistory();
      } else {
        setTerminalLines([
          { text: 'SECURE-LAB OS v4.2.0-STABLE', color: 'text-slate-500' },
          { text: `> [ERROR] ${data.error}`, color: 'text-red-500 font-bold' }
        ]);
      }
    } catch {
      setTerminalLines([
        { text: 'SECURE-LAB OS v4.2.0-STABLE', color: 'text-slate-500' },
        { text: `> [ERROR] Backend not reachable!`, color: 'text-red-500 font-bold' },
      ]);
    } finally {
      setScanning(false);
    }
  };

  // Screenshot handler
  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  // Submit Attack Report
  const submitAttackReport = async (e) => {
    e.preventDefault();
    setVulnMsg('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('attackCategory', vulnForm.attackCategory);
      formData.append('attackType', vulnForm.attackType);
      formData.append('attackMethod', vulnForm.attackMethod);
      formData.append('severity', vulnForm.severity);
      formData.append('payload', vulnForm.payload);
      formData.append('description', vulnForm.description);
      formData.append('targetGroup', vulnForm.targetGroup);
      if (screenshot) formData.append('screenshot', screenshot);

      const res = await fetch(`${API_BASE}/api/vulnerabilities`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setVulnMsg('✅ Attack report submitted successfully!');
        setVulnForm({ attackCategory: '', attackType: '', attackMethod: '', severity: 'Critical', payload: '', description: '', targetGroup: '' });
        setScreenshot(null);
        setScreenshotPreview('');
        fetchMyReports();
      } else {
        setVulnMsg(`❌ ${data.error}`);
      }
    } catch { setVulnMsg('❌ Backend not reachable'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tighter text-blue-500 italic mb-8">SECURE<span className="text-white">LAB</span></div>
          <nav className="flex flex-col gap-2">
            <NavItem icon={<Terminal size={20} />} label="Scanner" active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
            <NavItem icon={<Crosshair size={20} />} label="Attack Report" active={activeTab === 'attack'} onClick={() => setActiveTab('attack')} />
            <NavItem icon={<Target size={20} />} label="Attack Targets" active={activeTab === 'targets'} onClick={() => setActiveTab('targets')} />
            <NavItem icon={<Shield size={20} />} label="My Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            <NavItem icon={<Users size={20} />} label="My Group" active={activeTab === 'mygroup'} onClick={() => setActiveTab('mygroup')} />
            <NavItem icon={<Award size={20} />} label="Grades" active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} />
          </nav>
        </div>
        <button
          onClick={() => { if (window.confirm('Are you sure you want to logout?')) { logout(); navigate('/login'); } }}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-white">Student Terminal</h1>
            <p className="text-slate-500 font-medium">Session Active: {user?.name || 'Student'} ({user?.email})</p>
          </div>
          {/* <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-900/10">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Award size={24} /></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-400 tracking-widest leading-none mb-1">Final Score</p>
              <p className="text-2xl font-black text-white leading-none">{groupScore}<span className="text-sm text-slate-500">/100</span></p>
            </div>
          </div> */}
        </header>

        {/* ========== SCANNER TAB ========== */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Search size={20} className="text-blue-400" /> Target Configuration
                </h2>
                <div className="flex gap-4 mb-6 flex-wrap">
                  <input
                    type="text"
                    placeholder="Target IP (e.g. 192.168.1.1 or scanme.nmap.org)"
                    className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runScan()}
                  />
                  <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 cursor-pointer">
                    <option value="quick">⚡ Quick Scan</option>
                    <option value="full">🔍 Full Port Scan</option>
                    <option value="service">🧩 Service Detection</option>
                    <option value="vuln">🛡️ Vulnerability Scan</option>
                    <option value="os">💻 OS Detection</option>
                  </select>
                  <button
                    onClick={runScan}
                    disabled={scanning}
                    className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 ${scanning ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                  >
                    {scanning ? (<><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>Scanning...</>) : (<><PlayCircle size={18} /> Start Scan</>)}
                  </button>
                </div>

                {/* Terminal */}
                <div ref={terminalRef} className="bg-black/80 rounded-2xl p-5 font-mono text-sm h-72 border border-slate-800 shadow-inner overflow-y-auto scroll-smooth">
                  {terminalLines.map((line, i) => (
                    <p key={i} className={`${line.color} ${i === 0 ? 'opacity-50 tracking-tighter mb-2' : 'mt-0.5'}`}>{line.text}</p>
                  ))}
                  {scanning && <p className="animate-pulse text-blue-400 font-bold mt-2">{'> [SCANNING] Live output streaming...'}</p>}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <div className={`w-2 h-2 rounded-full ${socketRef.current?.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  {socketRef.current?.connected ? 'Live Mode (WebSocket)' : 'Standard Mode (REST)'}
                </div>
              </div>

              {scanResults && (
                <div className="grid grid-cols-3 gap-4">
                  <ScanStatCard icon={<Wifi size={20} />} label="Host Status" value={scanResults.parsed.hostStatus.includes('up') ? 'UP' : 'DOWN'} color={scanResults.parsed.hostStatus.includes('up') ? 'emerald' : 'red'} />
                  <ScanStatCard icon={<Server size={20} />} label="Open Ports" value={scanResults.parsed.openPorts.toString()} color="red" />
                  <ScanStatCard icon={<Terminal size={20} />} label="Total Ports" value={scanResults.parsed.totalPorts.toString()} color="blue" />
                </div>
              )}

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl backdrop-blur-sm">
                <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
                  <CheckCircle size={16} /> TA Feedback
                </h3>
                <p className="text-slate-300 italic text-sm">"{groupFeedback}"</p>
              </div>
            </div>

            {/* Scan History */}
            <div className="space-y-8">
              {scanHistory.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-400" /> Scan History
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanHistory.map((scan, i) => (
                      <div key={scan._id || i} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-blue-400">{scan.target}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{scan.scanType}</span>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                          <span>{scan.parsed?.openPorts || 0} open ports</span>
                          <span>{new Date(scan.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== ATTACK REPORT TAB ========== */}
        {activeTab === 'attack' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <Crosshair size={24} className="text-red-400" /> Submit Attack Report
              </h2>

              {vulnMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm text-center ${vulnMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {vulnMsg}
                </div>
              )}

              <form className="space-y-5" onSubmit={submitAttackReport}>
                {/* Target Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Target Group</label>
                  <select
                    required
                    value={vulnForm.targetGroup}
                    onChange={e => setVulnForm({ ...vulnForm, targetGroup: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300"
                  >
                    <option value="">Select target group...</option>
                    {attackTargets.map(g => (
                      <option key={g.groupId} value={g.groupId}>{g.groupId} — {g.target} ({g.lead})</option>
                    ))}
                  </select>
                </div>

                {/* Attack Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Attack Category</label>
                  <select
                    required
                    value={vulnForm.attackCategory}
                    onChange={e => setVulnForm({ ...vulnForm, attackCategory: e.target.value, attackMethod: '' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300"
                  >
                    <option value="">Select category...</option>
                    {ATTACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Attack Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Attack Method</label>
                  <select
                    required
                    value={vulnForm.attackMethod}
                    onChange={e => setVulnForm({ ...vulnForm, attackMethod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300"
                    disabled={!vulnForm.attackCategory}
                  >
                    <option value="">Select method...</option>
                    {(ATTACK_METHODS[vulnForm.attackCategory] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Attack Type (custom name) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Attack Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Login Bypass via SQLi"
                    value={vulnForm.attackType}
                    onChange={e => setVulnForm({ ...vulnForm, attackType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Severity</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Critical', 'High', 'Medium', 'Low'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setVulnForm({ ...vulnForm, severity: s })}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${vulnForm.severity === s
                          ? s === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : s === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : s === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payload */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Payload</label>
                  <textarea
                    required
                    placeholder="Paste your attack payload here..."
                    value={vulnForm.payload}
                    onChange={e => setVulnForm({ ...vulnForm, payload: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm h-28 focus:border-blue-500 outline-none text-white resize-none font-mono"
                  ></textarea>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Description / Steps to Reproduce</label>
                  <textarea
                    required
                    placeholder="Describe how the attack was performed..."
                    value={vulnForm.description}
                    onChange={e => setVulnForm({ ...vulnForm, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm h-28 focus:border-blue-500 outline-none text-white resize-none"
                  ></textarea>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Screenshot (Proof)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshot}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="flex items-center justify-center gap-3 w-full bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl px-4 py-6 text-sm text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-400 transition-all"
                    >
                      <Upload size={20} />
                      {screenshot ? screenshot.name : 'Click to upload screenshot (max 5MB)'}
                    </label>
                  </div>
                  {screenshotPreview && (
                    <div className="mt-3 relative">
                      <img src={screenshotPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl border border-slate-700" />
                      <button
                        type="button"
                        onClick={() => { setScreenshot(null); setScreenshotPreview(''); }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 text-xs"
                      >✕</button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all shadow-xl uppercase tracking-widest ${submitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'}`}
                >
                  {submitting ? 'Submitting...' : '🚀 Submit Attack Report'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========== ATTACK TARGETS TAB ========== */}
        {activeTab === 'targets' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Target size={20} className="text-red-400" /> Attack Targets — Other Groups
              </h2>
              <p className="text-slate-500 text-sm mt-1">Scan and attack these targets, then submit your report</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {attackTargets.map(g => (
                <div key={g.groupId} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-black text-blue-400">{g.groupId}</div>
                      <div className="text-xs text-slate-500">Lead: {g.lead}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${g.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {g.status}
                    </span>
                  </div>
                  <div className="bg-black/40 rounded-xl px-4 py-3 font-mono text-lg text-center text-red-400 border border-slate-700">
                    {g.target || 'No IP assigned'}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Members: {g.members?.join(', ')}</div>
                  <button
                    onClick={() => { setTargetIp(g.target); setActiveTab('scanner'); }}
                    className="mt-3 w-full bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    ⚡ Scan This Target
                  </button>
                </div>
              ))}
              {attackTargets.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500 italic">No groups available. Faculty needs to create groups first.</div>
              )}
            </div>
          </div>
        )}

        {/* ========== MY REPORTS TAB ========== */}
        {activeTab === 'reports' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Shield size={20} className="text-yellow-400" /> My Attack Reports ({myReports.length})
              </h2>
            </div>
            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {myReports.map(v => (
                <div key={v._id} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white">{v.attackType}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        <span className="text-blue-400">{v.attackCategory}</span> → <span>{v.attackMethod}</span>
                        {v.targetGroup && <span> | Target: <span className="text-red-400">{v.targetGroup}</span></span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(v.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : v.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : v.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {v.severity}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : v.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                  {v.payload && (
                    <div className="mt-3 bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-400 border border-slate-700 max-h-24 overflow-auto">{v.payload}</div>
                  )}
                </div>
              ))}
              {myReports.length === 0 && <div className="text-center py-12 text-slate-500 italic">No reports submitted yet.</div>}
            </div>
          </div>
        )}

        {/* ========== MY GROUP TAB ========== */}
        {activeTab === 'mygroup' && (
          <div className="max-w-2xl mx-auto">
            {myGroup ? (
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-blue-400">{myGroup.groupId}</h2>
                    <p className="text-slate-400 text-sm mt-1">Lead: {myGroup.lead}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${myGroup.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{myGroup.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Target IP</div>
                    <div className="font-mono text-lg text-red-400">{myGroup.target || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Assigned TA</div>
                    <div className="text-lg text-emerald-400 font-bold">{myGroup.assignedTA?.name || 'None'}</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Members</div>
                  <div className="flex flex-wrap gap-2">
                    {myGroup.members?.map((m, i) => (
                      <span key={i} className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/20">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Project Progress</div>
                    <span className="text-sm font-bold text-white">{myGroup.progress || 0}%</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${(myGroup.progress || 0) >= 75 ? 'bg-emerald-500' : (myGroup.progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${myGroup.progress || 0}%` }}></div>
                  </div>
                  {myGroup.milestones && myGroup.milestones.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {myGroup.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{m.done ? '✓' : i + 1}</span>
                          <span className={m.done ? 'text-emerald-400 line-through' : 'text-slate-400'}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score */}
                {myGroup.score !== null && myGroup.score !== undefined && (
                  <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl text-center">
                    <p className="text-4xl font-black text-white">{myGroup.score}<span className="text-sm text-slate-500">/100</span></p>
                    <p className="text-xs text-blue-400 uppercase tracking-widest mt-1 font-bold">Group Score</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[2.5rem] backdrop-blur-md text-center">
                <Users size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">Not in a Group Yet</h3>
                <p className="text-slate-500 text-sm">Ask your faculty to assign you to a group.</p>
              </div>
            )}
          </div>
        )}

        {/* ========== GRADES TAB ========== */}
        {activeTab === 'grades' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md text-center">
              <div className="bg-blue-600/10 border border-blue-500/20 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl font-black text-white">{groupScore}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Final Assessment Score</h3>
              <p className="text-slate-400 text-sm">Status: <span className={`font-bold ${gradeStatus === 'Graded' ? 'text-emerald-400' : 'text-yellow-400'}`}>{gradeStatus}</span></p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl backdrop-blur-sm">
              <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
                <CheckCircle size={16} /> TA Feedback
              </h3>
              <p className="text-slate-300 italic text-sm">"{groupFeedback}"</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// ========== REUSABLE COMPONENTS ==========

const NavItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-bold' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

const ScanStatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className={`${colors} border p-5 rounded-2xl backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon} <span className="text-xs font-bold uppercase tracking-widest">{label}</span></div>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
};

export default StudentDashboard;