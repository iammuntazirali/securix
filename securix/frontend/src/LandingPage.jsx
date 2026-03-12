import React from 'react';
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  Zap, 
  Terminal, 
  CheckCircle, 
  Search 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Step = ({ number, title, description, icon: Icon }) => (
  <div className="relative flex flex-col group h-full">
    {/* Connecting Line for Desktop */}
    <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-px bg-gradient-to-r from-blue-500/50 to-transparent z-0 group-last:hidden"></div>
    
    <div className="relative z-10 flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1">
      {/* Protocol Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-blue-500 font-black tracking-widest uppercase"></span>
          <span className="text-xs font-mono text-white font-bold">{number}</span>
        </div>
      </div>

      <h5 className="text-lg font-black text-white uppercase tracking-tight mb-3 group-hover:text-blue-400 transition-colors">
        {title}
      </h5>
      
      <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
        {description}
      </p>

      {/* Technical Footer Decoration */}
      <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/10"></div>
        </div>
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest"></span>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden relative font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e293b_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-20"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-10 py-8 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield className="text-white" fill="currentColor" size={24} />
          </div>
          <span>SECURE<span className="text-blue-500">LAB</span></span>
        </div>
        <Link to="/login" className="text-xs font-bold tracking-widest uppercase px-8 py-2.5 border border-slate-800 rounded-full hover:bg-white hover:text-black transition-all duration-300">
          Login Portal
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-10 pt-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-32">
          {/* Left Side: Impactful Heading */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              System Live // 0x882A
            </div>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
              AUDIT.<br />TRACK.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 uppercase">Secure.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed font-medium">
              A unified command center for university-led security assessments and automated cyber range reporting.
            </p>
            <Link to="/login" className="inline-flex items-center gap-4 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_20px_50px_rgba(37,99,235,0.25)] hover:scale-105 active:scale-95 group">
              GET STARTED <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right Side: BIG CIRCULAR HUD */}
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute w-[500px] h-[500px] bg-blue-500/15 blur-[100px] rounded-full animate-pulse"></div>
            
            <div className="relative w-[480px] h-[480px] md:w-[580px] md:h-[580px] bg-slate-900/40 border border-slate-800 rounded-full backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_80px_rgba(59,130,246,0.1)]">
              
              {/* Spinning Decorative Rings */}
              <div className="absolute w-[88%] h-[88%] border-2 border-dashed border-blue-500/10 rounded-full animate-[spin_30s_linear_infinite]"></div>
              <div className="absolute w-[75%] h-[75%] border border-dashed border-cyan-500/20 rounded-full animate-[spin_20s_linear_reverse_infinite]"></div>
              <div className="absolute w-[60%] h-[60%] border-2 border-blue-500/5 rounded-full"></div>
              
              {/* Central Shield Core */}
              <div className="z-10 bg-slate-800 p-12 rounded-full border-2 border-blue-500/40 shadow-[0_0_80px_rgba(59,130,246,0.25)] transition-transform duration-700 hover:scale-110">
                <Lock size={100} className="text-blue-500 shadow-inner" />
              </div>
              
              {/* Status Visuals */}
              <div className="mt-12 z-10 text-center">
                <div className="text-cyan-400 font-mono text-sm tracking-[0.5em] uppercase mb-5 font-bold">Attacks running</div>
                <div className="flex gap-2 justify-center h-10 items-end">
                  {[4, 10, 6, 8, 5].map((h, i) => (
                    <div 
                      key={i}
                      className={`w-2 bg-blue-500/60 animate-bounce`} 
                      style={{ height: `${h * 4}px`, animationDelay: `${i * 0.15}s` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Internal Scan Effect */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-scan-logic"></div>
            </div>
          </div>
        </div>

        {/* The 3-Card Architecture Framework */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <Step 
            // number="P-001"
            icon={Zap}
            title="Attack Simulation"
            description="Execute multi-vector security tests within a controlled, high-fidelity sandbox environment."
          />
          <Step 
            // number="P-002"
            icon={Terminal}
            title="Evidence Capture"
            description="Centrally log exploit payloads and technical findings for real-time faculty evaluation."
          />
          <Step 
            // number="P-003"
            icon={CheckCircle}
            title="System Hardening"
            description="Translate technical audit data into actionable structural fixes to build systemic resilience."
          />
        </div>
      </main>

      {/* Tailwind Animation Logic Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-logic {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(580px); opacity: 0; }
        }
        .animate-scan-logic {
          animation: scan-logic 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default LandingPage;