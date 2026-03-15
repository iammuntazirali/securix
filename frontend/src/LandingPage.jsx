import React from 'react';
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  Zap, 
  Terminal, 
  CheckCircle, 
  Activity,
  Cpu,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description, icon: Icon, delay }) => (
  <div className={`group relative p-8 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all duration-500`}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-blue-500/30 selection:text-blue-200 font-sans">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Header */}
      <nav className="relative z-50 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SECURE<span className="font-light opacity-80">LAB</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Infrastructure</a>
        </div>
        <Link to="/login" className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-blue-50 transition-all shadow-xl shadow-white/5">
          Access Portal
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Hero Section */}
        <div className="text-center mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            V3.0 Enterprise Engine Active
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            Security Infrastructure <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Redefined.
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            The intelligent command layer for university cyber ranges. 
            Automate audits, track real-time exploits, and harden systems in one unified interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all shadow-2xl shadow-blue-500/25 flex items-center justify-center gap-2">
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Visual Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-32">
          {/* Main Display Card */}
          <div className="md:col-span-8 relative overflow-hidden rounded-[2.5rem] bg-slate-900/50 border border-white/5 p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
            <div className="relative rounded-[2.3rem] bg-[#0A0A0B] overflow-hidden p-8 h-[450px]">
                {/* Mock UI Terminal Component */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                    <div className="ml-4 text-[10px] font-mono text-slate-500 tracking-widest uppercase">system_monitor.sh</div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                    <div className="flex gap-4 text-blue-400"><span className="opacity-50">01</span> <span>{'>'} Initializing security handshake...</span></div>
                    <div className="flex gap-4 text-emerald-400"><span className="opacity-50">02</span> <span>{'>'} Connection encrypted via TLS 1.3</span></div>
                    <div className="flex gap-4 text-slate-300"><span className="opacity-50">03</span> <span>{'>'} Monitoring node_082: <span className="text-yellow-500">STABLE</span></span></div>
                    <div className="flex gap-4 text-blue-400"><span className="opacity-50">04</span> <span>{'>'} Deploying sandbox environment...</span></div>
                    <div className="flex gap-4 text-pink-500 animate-pulse"><span className="opacity-50">05</span> <span>{'>'} INTRUSION ATTEMPT DETECTED [0x992]</span></div>
                </div>
                
                {/* Floating Stats */}
                <div className="absolute bottom-8 right-8 flex gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="text-[10px] uppercase tracking-tighter text-slate-500 mb-1">Threat Level</div>
                        <div className="text-2xl font-bold text-white">Low</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-500 border border-blue-400 shadow-lg shadow-blue-500/20">
                        <div className="text-[10px] uppercase tracking-tighter text-blue-100 mb-1">Uptime</div>
                        <div className="text-2xl font-bold text-white">99.9%</div>
                    </div>
                </div>
            </div>
          </div>

          {/* Secondary Stats Card */}
          <div className="md:col-span-4 rounded-[2.5rem] bg-gradient-to-b from-blue-600 to-indigo-700 p-8 flex flex-col justify-between text-white shadow-2xl shadow-blue-500/20">
            <Activity size={40} className="opacity-80" />
            <div>
              <h4 className="text-3xl font-bold mb-2">Automated Forensics</h4>
              <p className="text-blue-100/80 text-sm leading-relaxed">
                Real-time packet inspection and payload analysis handled by our proprietary neural engine.
              </p>
            </div>
            <div className="pt-6 border-t border-white/20 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest">View Network Map</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Zap}
            title="Attack Simulation"
            description="High-fidelity sandboxes for safely testing exploit vectors without compromising production integrity."
          />
          <FeatureCard 
            icon={Cpu}
            title="Evidence Capture"
            description="Immutable logging of all terminal activity, payloads, and architectural shifts during the audit process."
          />
          <FeatureCard 
            icon={Globe}
            title="System Hardening"
            description="Automated remediation roadmaps that prioritize structural fixes based on exploit severity."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-slate-500 text-sm">
            © 2026 SECURELAB. Built for next-gen security researchers.
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Github</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
