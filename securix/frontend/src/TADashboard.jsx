import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Clock, Search, LayoutDashboard, LogOut, Award, X, BarChart3, CheckCircle, Eye, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import API_BASE from './api';

const TADashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [vulns, setVulns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch TA's assigned groups
      const myRes = await fetch(`${API_BASE}/api/groups/my-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const myData = await myRes.json();

      // Fetch all groups (fallback if no assigned groups)
      const allRes = await fetch(`${API_BASE}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allRes.json();

      if (myData.success) {
        setGroups(myData.groups);
      }
      if (allData.success) {
        setAllGroups(allData.groups);
      }

      // Fetch vulnerabilities
      const vulnRes = await fetch(`${API_BASE}/api/vulnerabilities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vulnData = await vulnRes.json();
      if (vulnData.success) setVulns(vulnData.vulnerabilities);
    } catch { }
    finally { setLoading(false); }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const marks = e.target.marks.value;
    const feedback = e.target.feedback?.value || '';

    try {
      const res = await fetch(`${API_BASE}/api/groups/${selectedGroup._id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: parseInt(marks), feedback })
      });
      const data = await res.json();
      if (data.success) {
        setGroups(groups.map(g => g._id === selectedGroup._id ? { ...g, score: marks, feedback } : g));
        alert(`Grade saved for ${selectedGroup.groupId}: ${marks}/100`);
      }
    } catch { alert('Failed to save grade'); }
    setSelectedGroup(null);
  };

  const handleMilestoneToggle = async (group, milestoneIdx) => {
    const updatedMilestones = group.milestones.map((m, i) =>
      i === milestoneIdx ? { ...m, done: !m.done } : m
    );
    const doneCount = updatedMilestones.filter(m => m.done).length;
    const progress = Math.round((doneCount / updatedMilestones.length) * 100);

    try {
      const res = await fetch(`${API_BASE}/api/groups/${group._id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ milestones: updatedMilestones, progress })
      });
      const data = await res.json();
      if (data.success) {
        setGroups(groups.map(g => g._id === group._id ? { ...g, milestones: updatedMilestones, progress } : g));
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

  const filteredGroups = groups.filter(g =>
    g.groupId.toLowerCase().includes(filterSearch.toLowerCase()) ||
    g.lead.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans relative">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-black tracking-tighter text-blue-500 mb-10 italic">SECURE<span className="text-white">LAB.</span></div>
          <nav className="flex flex-col gap-2">
            <NavItem icon={<LayoutDashboard size={20} />} label="Groups & Progress" active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
            <NavItem icon={<ShieldAlert size={20} />} label="Attack Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          </nav>
        </div>
        <button
          onClick={() => { if (window.confirm('Are you sure you want to logout?')) { logout(); navigate('/login'); } }}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">TA Monitoring Panel</h1>
            <p className="text-slate-500 mt-1 font-medium">Welcome, {user?.name || 'TA'} — Monitoring {groups.length} Groups</p>
          </div>
          <div className="flex gap-4">
            <StatBox icon={<Users className="text-blue-400" />} label="My Groups" value={groups.length.toString()} />
            <StatBox icon={<ShieldAlert className="text-red-400" />} label="Pending Reports" value={vulns.filter(v => v.status === 'Pending').length.toString()} />
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading data...</div>
        ) : (
          <>
            {/* ========== GROUPS TAB ========== */}
            {activeTab === 'groups' && (
              <div className="space-y-8">
                {/* Groups Table */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Clock size={20} className="text-emerald-400" /> Live Group Activity
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="Filter Groups..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Group</th>
                        <th className="px-6 py-4 font-semibold">Target IP</th>
                        <th className="px-6 py-4 font-semibold">Progress</th>
                        <th className="px-6 py-4 font-semibold">Grade</th>
                        <th className="px-6 py-4 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredGroups.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">No groups found.</td></tr>
                      ) : filteredGroups.map((group) => (
                        <tr key={group._id || group.groupId} className="hover:bg-slate-800/30 transition-colors text-sm">
                          <td className="px-6 py-4">
                            <div className="font-bold text-blue-400">{group.groupId}</div>
                            <div className="text-xs text-slate-500">{group.lead}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{group.target}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${(group.progress || 0) >= 75 ? 'bg-emerald-500' : (group.progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                  style={{ width: `${group.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-slate-400 w-10">{group.progress || 0}%</span>
                            </div>
                            {/* Milestones */}
                            {group.milestones && group.milestones.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {group.milestones.map((m, idx) => (
                                  <label key={idx} className="flex items-center gap-2 text-xs cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={m.done}
                                      onChange={() => handleMilestoneToggle(group, idx)}
                                      className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
                                    />
                                    <span className={`${m.done ? 'text-emerald-400 line-through' : 'text-slate-400'} group-hover:text-white transition-colors`}>{m.title}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {group.score !== null && group.score !== undefined ? (
                              <span className="text-emerald-400 font-bold font-mono text-lg">{group.score}/100</span>
                            ) : (
                              <span className="text-slate-600 italic">Not Graded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setSelectedGroup(group)}
                              className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
                            >
                              <Award size={14} /> Review & Grade
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== ATTACK REPORTS TAB ========== */}
            {activeTab === 'reports' && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <ShieldAlert size={20} className="text-yellow-400" /> Attack Reports ({vulns.length})
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Review and accept/reject student attack submissions</p>
                </div>
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {vulns.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 italic">No attack reports submitted yet.</div>
                  ) : vulns.map(v => (
                    <div key={v._id} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg">{v.attackType}</div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                            {v.attackCategory && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/20">{v.attackCategory}</span>}
                            {v.attackMethod && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-lg border border-purple-500/20">{v.attackMethod}</span>}
                            {v.targetGroup && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/20">Target: {v.targetGroup}</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-2">By: {v.user?.name || 'Unknown'} ({v.user?.email}) — {new Date(v.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : v.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : v.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                            {v.severity}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${v.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : v.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {v.status}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {v.description && <p className="text-sm text-slate-300 mt-3">{v.description}</p>}

                      {/* Payload */}
                      {v.payload && (
                        <div className="mt-3 bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-400 border border-slate-700 max-h-24 overflow-auto">
                          <div className="text-[10px] text-slate-600 uppercase font-bold mb-1">Payload</div>
                          {v.payload}
                        </div>
                      )}

                      {/* Screenshot */}
                      {v.screenshotUrl && (
                        <div className="mt-3">
                          <img src={`${API_BASE}${v.screenshotUrl}`} alt="Attack Screenshot" className="max-h-48 rounded-lg border border-slate-700 object-contain" />
                        </div>
                      )}

                      {/* Review Buttons */}
                      {v.status === 'Pending' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleReviewVuln(v._id, 'Accepted')}
                            className="flex-1 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            ✅ Accept
                          </button>
                          <button
                            onClick={() => handleReviewVuln(v._id, 'Rejected')}
                            className="flex-1 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* --- GRADING MODAL --- */}
        {selectedGroup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedGroup(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                <X size={20} />
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Grading Session</h2>
                <p className="text-slate-400 text-sm">Reviewing: {selectedGroup.groupId} ({selectedGroup.lead})</p>
              </div>
              <form onSubmit={handleGradeSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Marks (0-100)</label>
                  <input name="marks" required type="number" max="100" min="0" placeholder="Enter score" defaultValue={selectedGroup.score || ''} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Feedback (optional)</label>
                  <textarea name="feedback" placeholder="Write feedback for the group..." defaultValue={selectedGroup.feedback || ''} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none text-sm" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSelectedGroup(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all text-sm">Close</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm">Submit</button>
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
    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg' : 'hover:bg-slate-800 text-slate-500'}`}
  >
    {icon}
    <span className="font-bold text-sm tracking-wide">{label}</span>
  </div>
);

const StatBox = ({ icon, label, value }) => (
  <div className="bg-slate-900/60 border border-slate-800 px-6 py-4 rounded-3xl flex items-center gap-5 backdrop-blur-sm">
    <div className="bg-slate-800 p-3 rounded-2xl">{icon}</div>
    <div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">{label}</p>
    </div>
  </div>
);

export default TADashboard;