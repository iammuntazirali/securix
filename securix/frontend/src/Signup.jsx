import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await signup(name, email, password, role);
            // Redirect based on role
            if (data.user.role === 'student') navigate('/student-dashboard');
            else if (data.user.role === 'ta') navigate('/ta-dashboard');
            else navigate('/faculty-dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 blur-[130px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-extrabold mb-2 tracking-tight">Create Account</h2>
                    <p className="text-slate-400 text-sm">Join Security Assessment Management System</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                {/* ROLE TOGGLE */}
                <div className="bg-slate-800/50 p-1.5 rounded-2xl flex mb-8 relative border border-slate-700">
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-6px)] bg-emerald-600 rounded-xl transition-all duration-300 shadow-lg ${role === 'student' ? 'left-1.5' : role === 'ta' ? 'left-[34.5%]' : 'left-[67.5%]'
                            }`}
                    />
                    <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2.5 z-10 font-semibold ${role === 'student' ? 'text-white' : 'text-slate-400'}`}>Student</button>
                    <button type="button" onClick={() => setRole('ta')} className={`flex-1 py-2.5 z-10 font-semibold ${role === 'ta' ? 'text-white' : 'text-slate-400'}`}>TA</button>
                    <button type="button" onClick={() => setRole('faculty')} className={`flex-1 py-2.5 z-10 font-semibold ${role === 'faculty' ? 'text-white' : 'text-slate-400'}`}>Faculty</button>
                </div>

                <form className="space-y-5" onSubmit={handleSignup}>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            required
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            required
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            required
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-4 rounded-2xl transition-all shadow-xl transform active:scale-[0.98] ${loading
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                            }`}
                    >
                        {loading ? 'Creating Account...' : `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Account`}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Login here</Link>
                </p>

                <p className="mt-8 text-center text-slate-500 text-xs tracking-wider">
                    PROTECTED ACADEMIC ENVIRONMENT
                </p>
            </div>
        </div>
    );
};

export default Signup;
