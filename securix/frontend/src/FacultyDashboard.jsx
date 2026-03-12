import React, { useState, useEffect } from 'react';
import { Users, Award, LogOut, Activity, RefreshCw, Database, ShieldAlert, BarChart3, TrendingUp, UserCheck, Plus, UserPlus, Trash2, Edit3, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import API_BASE from './api';

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const { user, token, logout } = useAuth();

    const [activeTab, setActiveTab] = useState('overview');
    const [groups, setGroups] = useState([]);
    const [vulns, setVulns] = useState([]);
    const [tas, setTas] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seedMsg, setSeedMsg] = useState('');

    // Create Group form
    const [newGroup, setNewGroup] = useState({ groupId: '', lead: '', members: '', target: '' });
    const [createMsg, setCreateMsg] = useState('');

    // Edit Group
    const [editingGroup, setEditingGroup] = useState(null);
    const [editForm, setEditForm] = useState({ groupId: '', lead: '', members: '', target: '' });
    const [editMsg, setEditMsg] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupRes, vulnRes, taRes, usersRes] = await Promise.all([
                fetch(`${API_BASE}/api/groups`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/vulnerabilities`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/groups/tas`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const groupData = await groupRes.json();
            const vulnData = await vulnRes.json();
            const taData = await taRes.json();
            const usersData = await usersRes.json();
            if (groupData.success) setGroups(groupData.groups);
            if (vulnData.success) setVulns(vulnData.vulnerabilities);
            if (taData.success) setTas(taData.tas);
            if (usersData.success) setAllUsers(usersData.users);
        } catch { }
        finally { setLoading(false); }
    };

    const seedGroups = async () => {
        setSeedMsg('');
        try {
            const res = await fetch(`${API_BASE}/api/groups/seed`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSeedMsg(data.message);
            fetchData();
        } catch { setSeedMsg('Failed to seed'); }
    };

    const assignTA = async (groupId, taId) => {
        try {
            const res = await fetch(`${API_BASE}/api/groups/${groupId}/assign-ta`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ taId: taId || null })
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            }
        } catch { }
    };

    const handleReviewVuln = async (vulnId, status) => {
        try {
            const res = await fetch(`${API_BASE}/api/vulnerabilities/${vulnId}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setVulns(vulns.map(v => v._id === vulnId ? { ...v, status } : v));
            }
        } catch { }
    };

    const totalGroups = groups.length;
    const gradedGroups = groups.filter(g => g.score !== null && g.score !== undefined).length;
    const activeGroups = groups.filter(g => g.status === 'Active').length;
    const avgProgress = groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + (g.progress || 0), 0) / groups.length) : 0;

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreateMsg('');
        try {
            const membersArr = newGroup.members.split(',').map(m => m.trim()).filter(Boolean);
            const res = await fetch(`${API_BASE}/api/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newGroup, members: membersArr })
            });
            const data = await res.json();
            if (data.success) {
                setCreateMsg('✅ Group created!');
                setNewGroup({ groupId: '', lead: '', members: '', target: '' });
                fetchData();
            } else {
                setCreateMsg(`❌ ${data.error}`);
            }
        } catch { setCreateMsg('❌ Failed'); }
    };

    const assignStudentToGroup = async (userId, groupId) => {
        try {
            await fetch(`${API_BASE}/api/auth/users/${userId}/group`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ group: groupId })
            });
            fetchData();
        } catch { }
    };

    const deleteGroup = async (groupDbId, groupId) => {
        if (!window.confirm(`Are you sure you want to delete ${groupId}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/groups/${groupDbId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch { }
    };

    const openEditGroup = (group) => {
        setEditingGroup(group);
        setEditForm({
            groupId: group.groupId,
            lead: group.lead,
            members: group.members?.join(', ') || '',
            target: group.target || ''
        });
        setEditMsg('');
    };

    const handleEditGroup = async (e) => {
        e.preventDefault();
        setEditMsg('');
        try {
            const membersArr = editForm.members.split(',').map(m => m.trim()).filter(Boolean);
            const res = await fetch(`${API_BASE}/api/groups/${editingGroup._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...editForm, members: membersArr })
            });
            const data = await res.json();
            if (data.success) {
                setEditMsg('✅ Group updated!');
                fetchData();
                setTimeout(() => setEditingGroup(null), 800);
            } else {
                setEditMsg(`❌ ${data.error}`);
            }
        } catch { setEditMsg('❌ Failed'); }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <div className="text-2xl font-black text-blue-500 mb-10 italic">SECURE<span className="text-white">LAB.</span></div>
                    <nav className="flex flex-col gap-2">
                        <NavItem icon={<Users size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <NavItem icon={<Plus size={20} />} label="Create Group" active={activeTab === 'create'} onClick={() => setActiveTab('create')} />
                        <NavItem icon={<ShieldAlert size={20} />} label="Attack Reports" active={activeTab === 'vulns'} onClick={() => setActiveTab('vulns')} />
                        <NavItem icon={<UserCheck size={20} />} label="Assign TAs" active={activeTab === 'assign'} onClick={() => setActiveTab('assign')} />
                        <NavItem icon={<UserPlus size={20} />} label="Manage Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    </nav>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
                >
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Faculty Oversight Panel</h1>
                        <p className="text-slate-500 mt-1 font-medium">Welcome, {user?.name || 'Faculty'} — Monitoring Lab Assessments</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700">
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <button onClick={seedGroups} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-blue-500/30">
                            <Database size={14} /> Seed Groups
                        </button>
                    </div>
                </header>

                {seedMsg && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm text-center">
                        {seedMsg}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <StatCard label="Total Groups" value={totalGroups} color="blue" />
                    <StatCard label="Active" value={activeGroups} color="emerald" />
                    <StatCard label="Graded" value={gradedGroups} color="purple" />
                    <StatCard label="Avg Progress" value={`${avgProgress}%`} color="cyan" />
                    <StatCard label="Attack Reports" value={vulns.length} color="yellow" />
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading data...</div>
                ) : (
                    <>
                        {/* ========== OVERVIEW TAB ========== */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Groups Table with Progress */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                                    <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                        <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                            <Users size={20} className="text-blue-400" /> All Student Groups
                                        </h2>
                                    </div>

                                    <table className="w-full text-left">
                                        <thead className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                            <tr>
                                                <th className="px-6 py-4">Group</th>
                                                <th className="px-6 py-4">Target</th>
                                                <th className="px-6 py-4">Members</th>
                                                <th className="px-6 py-4">Progress</th>
                                                <th className="px-6 py-4">Assigned TA</th>
                                                <th className="px-6 py-4 text-center">Score</th>
                                                <th className="px-6 py-4">Feedback</th>
                                                <th className="px-6 py-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {groups.length === 0 ? (
                                                <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500 italic">No groups yet. Click "Seed Groups".</td></tr>
                                            ) : groups.map((group) => (
                                                <tr key={group._id} className="hover:bg-slate-800/20 transition-all text-sm">
                                                    <td className="px-6 py-4">
                                                        <div className="font-black text-blue-400 tracking-tight">{group.groupId}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{group.lead} (Lead)</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{group.target || '—'}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-400">{group.members?.join(', ') || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden w-20">
                                                                <div
                                                                    className={`h-full rounded-full ${(group.progress || 0) >= 75 ? 'bg-emerald-500' : (group.progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                                    style={{ width: `${group.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-500">{group.progress || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {group.assignedTA ? (
                                                            <span className="text-emerald-400 font-bold">{group.assignedTA.name}</span>
                                                        ) : (
                                                            <span className="text-slate-600 italic">None</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {group.score !== null && group.score !== undefined ? (
                                                            <div className="inline-flex items-center gap-1 bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-xl">
                                                                <span className="text-lg font-black text-white">{group.score}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold">pts</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-600 italic text-sm">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[150px] truncate">{group.feedback || '—'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEditGroup(group)} className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-lg transition-all" title="Edit Group">
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button onClick={() => deleteGroup(group._id, group.groupId)} className="p-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg transition-all" title="Delete Group">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ========== ATTACK REPORTS TAB ========== */}
                        {activeTab === 'vulns' && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                    <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                        <ShieldAlert size={20} className="text-yellow-400" /> All Attack Reports ({vulns.length})
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                                    {vulns.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 italic">No attack reports.</div>
                                    ) : vulns.map(v => (
                                        <div key={v._id} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-bold text-white">{v.attackType}</div>
                                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                                                        {v.attackCategory && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{v.attackCategory}</span>}
                                                        {v.attackMethod && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{v.attackMethod}</span>}
                                                        {v.targetGroup && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">→ {v.targetGroup}</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-2">
                                                        By: {v.user?.name || 'Unknown'} — {new Date(v.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : v.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : v.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                        {v.severity}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : v.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {v.description && <p className="text-sm text-slate-300 mt-3">{v.description}</p>}
                                            {v.payload && (
                                                <div className="mt-3 bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-400 border border-slate-700 max-h-20 overflow-auto">{v.payload}</div>
                                            )}
                                            {v.screenshotUrl && (
                                                <img src={`${API_BASE}${v.screenshotUrl}`} alt="Screenshot" className="mt-3 max-h-40 rounded-lg border border-slate-700 object-contain" />
                                            )}
                                            {v.status === 'Pending' && (
                                                <div className="flex gap-2 mt-4">
                                                    <button onClick={() => handleReviewVuln(v._id, 'Accepted')} className="flex-1 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 py-2 rounded-xl text-xs font-bold transition-all">✅ Accept</button>
                                                    <button onClick={() => handleReviewVuln(v._id, 'Rejected')} className="flex-1 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 py-2 rounded-xl text-xs font-bold transition-all">❌ Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ========== ASSIGN TAs TAB ========== */}
                        {activeTab === 'assign' && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                    <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                        <UserCheck size={20} className="text-emerald-400" /> Assign TAs to Groups
                                    </h2>
                                    {tas.length === 0 && <p className="text-yellow-400 text-sm mt-2">⚠️ No TAs registered yet. Ask TAs to sign up first.</p>}
                                </div>
                                <div className="p-6 space-y-4">
                                    {groups.map(group => (
                                        <div key={group._id} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-blue-400 text-lg">{group.groupId}</div>
                                                <div className="text-xs text-slate-500">{group.lead} — {group.members?.join(', ')}</div>
                                                <div className="text-xs text-slate-500 mt-1">Target: <span className="font-mono text-slate-400">{group.target}</span></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={group.assignedTA?._id || group.assignedTA || ''}
                                                    onChange={(e) => assignTA(group._id, e.target.value)}
                                                    className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none min-w-[200px]"
                                                >
                                                    <option value="">No TA Assigned</option>
                                                    {tas.map(ta => (
                                                        <option key={ta._id} value={ta._id}>{ta.name} ({ta.email})</option>
                                                    ))}
                                                </select>
                                                {group.assignedTA && (
                                                    <span className="text-emerald-400 text-xs font-bold">✓ Assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {groups.length === 0 && <div className="text-center py-12 text-slate-500 italic">No groups yet. Seed groups first.</div>}
                                </div>
                            </div>
                        )}

                        {/* ========== CREATE GROUP TAB ========== */}
                        {activeTab === 'create' && (
                            <div className="max-w-xl mx-auto">
                                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Plus size={24} className="text-emerald-400" /> Create New Group
                                    </h2>
                                    {createMsg && (
                                        <div className={`mb-4 px-4 py-2 rounded-xl text-sm text-center ${createMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {createMsg}
                                        </div>
                                    )}
                                    <form onSubmit={handleCreateGroup} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Group ID</label>
                                            <input required type="text" placeholder="e.g. Group-5" value={newGroup.groupId} onChange={e => setNewGroup({ ...newGroup, groupId: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Group Lead</label>
                                            <input required type="text" placeholder="Lead name" value={newGroup.lead} onChange={e => setNewGroup({ ...newGroup, lead: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Members (comma separated)</label>
                                            <input required type="text" placeholder="Alice, Bob, Charlie" value={newGroup.members} onChange={e => setNewGroup({ ...newGroup, members: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Target IP / Server</label>
                                            <input required type="text" placeholder="192.168.1.X" value={newGroup.target} onChange={e => setNewGroup({ ...newGroup, target: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none" />
                                        </div>
                                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest">
                                            ➕ Create Group
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* ========== MANAGE USERS TAB ========== */}
                        {activeTab === 'users' && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                                    <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                                        <UserPlus size={20} className="text-blue-400" /> Registered Users ({allUsers.length})
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">View all users & assign students to groups</p>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                        <tr>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Assigned Group</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {allUsers.map(u => (
                                            <tr key={u._id} className="hover:bg-slate-800/20 transition-all text-sm">
                                                <td className="px-6 py-3 font-bold text-white">{u.name}</td>
                                                <td className="px-6 py-3 text-slate-400">{u.email}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${u.role === 'faculty' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : u.role === 'ta' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {u.role === 'student' ? (
                                                        <select
                                                            value={u.group || ''}
                                                            onChange={(e) => assignStudentToGroup(u._id, e.target.value)}
                                                            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                        >
                                                            <option value="">No Group</option>
                                                            {groups.map(g => <option key={g._id} value={g.groupId}>{g.groupId}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {allUsers.length === 0 && <div className="text-center py-12 text-slate-500 italic">No users registered.</div>}
                            </div>
                        )}
                    </>
                )}

                {/* ========== EDIT GROUP MODAL ========== */}
                {editingGroup && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
                            <button onClick={() => setEditingGroup(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">Edit Group</h2>
                            <p className="text-slate-400 text-sm mb-6">Editing: {editingGroup.groupId}</p>
                            {editMsg && (
                                <div className={`mb-4 px-4 py-2 rounded-xl text-sm text-center ${editMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {editMsg}
                                </div>
                            )}
                            <form onSubmit={handleEditGroup} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Group ID</label>
                                    <input required type="text" value={editForm.groupId} onChange={e => setEditForm({ ...editForm, groupId: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Group Lead</label>
                                    <input required type="text" value={editForm.lead} onChange={e => setEditForm({ ...editForm, lead: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Members (comma separated)</label>
                                    <input required type="text" value={editForm.members} onChange={e => setEditForm({ ...editForm, members: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Target IP</label>
                                    <input required type="text" value={editForm.target} onChange={e => setEditForm({ ...editForm, target: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all text-sm">Cancel</button>
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </div>
);

const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-600/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-600/10 border-purple-500/20',
        yellow: 'text-yellow-400 bg-yellow-600/10 border-yellow-500/20',
        cyan: 'text-cyan-400 bg-cyan-600/10 border-cyan-500/20'
    };
    return (
        <div className={`border rounded-2xl p-5 ${colors[color]}`}>
            <div className="text-3xl font-black">{value}</div>
            <div className="text-xs font-bold uppercase tracking-widest mt-1 opacity-60">{label}</div>
        </div>
    );
};

export default FacultyDashboard;