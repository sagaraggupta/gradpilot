import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Icon, Icons } from "../components/ui/Icon";
import { motion } from "framer-motion";

// ─── 1. INTERACTIVE FEATURE CARD COMPONENT ───
<<<<<<< HEAD

// 🎨 FIX: Tailwind Dynamic Class Map
// Tailwind purges dynamic strings during build, so we explicitly map them here!
const colorStyles = {
  indigo: { wrapper: "hover:border-indigo-500/50", iconBg: "bg-indigo-500/20", iconText: "text-indigo-400" },
  emerald: { wrapper: "hover:border-emerald-500/50", iconBg: "bg-emerald-500/20", iconText: "text-emerald-400" },
  fuchsia: { wrapper: "hover:border-fuchsia-500/50", iconBg: "bg-fuchsia-500/20", iconText: "text-fuchsia-400" },
  amber: { wrapper: "hover:border-amber-500/50", iconBg: "bg-amber-500/20", iconText: "text-amber-400" },
  purple: { wrapper: "hover:border-purple-500/50", iconBg: "bg-purple-500/20", iconText: "text-purple-400" },
  blue: { wrapper: "hover:border-blue-500/50", iconBg: "bg-blue-500/20", iconText: "text-blue-400" },
  red: { wrapper: "hover:border-red-500/50", iconBg: "bg-red-500/20", iconText: "text-red-400" },
  orange: { wrapper: "hover:border-orange-500/50", iconBg: "bg-orange-500/20", iconText: "text-orange-400" },
  green: { wrapper: "hover:border-green-500/50", iconBg: "bg-green-500/20", iconText: "text-green-400" },
  pink: { wrapper: "hover:border-pink-500/50", iconBg: "bg-pink-500/20", iconText: "text-pink-400" },
};

// Uses "Lazy Render" for the video to save bandwidth until hovered.
const FeatureCard = ({ icon, title, desc, videoPlaceholder, colorClass }) => {
  const [isHovered, setIsHovered] = useState(false);
  const styles = colorStyles[colorClass] || colorStyles.indigo; // Fallback to indigo

  return (
    <div 
      className={`bg-white/5 border border-white/10 rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden h-full flex flex-col cursor-pointer ${styles.wrapper}`}
=======
// Uses "Lazy Render" for the video to save bandwidth until hovered.
const FeatureCard = ({ icon, title, desc, videoPlaceholder, colorClass }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`bg-white/5 border border-white/10 rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden h-full flex flex-col cursor-pointer hover:border-${colorClass}-500/50`}
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)} // Mobile tap support
    >
      {/* Lazy-loaded Video Background overlay */}
      {isHovered && (
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-screen transition-opacity duration-500">
<<<<<<< HEAD
          {/* 🎬 FIX: Replaced the cartoon bunny with a professional local placeholder */}
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/demo.mp4" type="video/mp4" />
=======
          {/* Replace src with your actual Loom/Demo video URL later */}
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
          </video>
        </div>
      )}

      <div className="relative z-10 flex-1">
<<<<<<< HEAD
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${styles.iconBg} ${styles.iconText}`}>
=======
        <div className={`w-14 h-14 rounded-2xl bg-${colorClass}-500/20 text-${colorClass}-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
          <Icon d={icon} size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-[14px] text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

// ─── FAQ COMPONENT ───
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full justify-between items-center text-left focus:outline-none">
        <span className="text-[15px] font-bold text-slate-200">{question}</span>
        <span className="text-indigo-400 text-xl">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <p className="mt-3 text-[14px] text-white/50 leading-relaxed animate-[fadeIn_0.2s_ease-out]">{answer}</p>}
    </div>
  );
};

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-slate-200 font-['Plus_Jakarta_Sans'] overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* GLOBAL CUSTOM SCROLLBAR */}
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0d0d14; }
        ::-webkit-scrollbar-thumb { background: #2d2d3a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #4f4f66; }
      `}</style>

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d0d14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/GradPilot.png" alt="GradPilot Logo" className="h-8 w-auto" />
            <span className="text-xl font-extrabold tracking-tight text-white hidden sm:block">GradPilot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Sign In</Link>
<<<<<<< HEAD
            <Link to="/login" className="text-sm font-bold bg-white text-[#0d0d14] px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
=======
            <Link to="/signup" className="text-sm font-bold bg-white text-[#0d0d14] px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <div className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-bold text-indigo-300 mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
            GradPilot v2.0 is Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-6">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI-Powered</span><br /> Student Command Center.
          </h1>
          
          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Gamify your productivity, automate your syllabus with AI, and compete on the global campus leaderboard. Studying doesn't have to be boring.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
<<<<<<< HEAD
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[15px] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(99,102,241,0.4)]">
=======
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[15px] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(99,102,241,0.4)]">
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
              Start Your Journey
            </Link>
            <button onClick={scrollToFeatures} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[15px] hover:bg-white/10 transition-colors">
              Explore Features
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── 1. THE TRUST BAR ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-y border-white/5 bg-white/[0.02] py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-8 md:gap-16 text-white/20 font-bold text-[13px] md:text-[15px] uppercase tracking-widest text-center">
          <div className="flex items-center gap-2"><Icon d={Icons.file} size={18} /> 1,200+ Syllabus Scanned</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
          <div className="flex items-center gap-2"><Icon d={Icons.star} size={18} /> 45k+ XP Earned Today</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
          <div className="flex items-center gap-2"><Icon d={Icons.users} size={18} /> Used by Students Worldwide</div>
        </div>
      </motion.div>

      {/* ─── 3. HOW IT WORKS (1-2-3 Process) ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-3">How GradPilot Works</h2>
          <p className="text-white/40">Your path to academic dominance in three simple steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">1</div>
            <h3 className="text-lg font-bold text-white mb-2">Sync Your Syllabi</h3>
            <p className="text-[14px] text-white/50">Upload your course documents and let our AI instantly extract your assignments and deadlines.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(217,70,239,0.2)]">2</div>
            <h3 className="text-lg font-bold text-white mb-2">Gamify Your Study</h3>
            <p className="text-[14px] text-white/50">Use the Focus Timer, generate AI Flashcards, and earn XP for every productive minute.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">3</div>
            <h3 className="text-lg font-bold text-white mb-2">Conquer The Campus</h3>
            <p className="text-[14px] text-white/50">Spend XP on cosmetics, track your GPA, and climb the Global Study Leaderboard.</p>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. INTERACTIVE FEATURE GRID ─── */}
      <motion.div id="features" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-7xl mx-auto px-6 py-10 relative z-10 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Everything you need to dominate your classes.</h2>
          <p className="text-white/40">Built by students, for students. Powered by Google Gemini & Groq.</p>
          <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-4">Hover cards to see them in action</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard colorClass="purple" icon={Icons.zap} title="AI Syllabus & Flashcards" desc="Let Gemini extract your syllabus due dates instantly, or generate interactive 3D study flashcards for any assignment." />
          <FeatureCard colorClass="amber" icon={Icons.star} title="Gamified XP Economy" desc="Earn XP for completing focus sessions and crushing habits. Spend it in the store on animated profile frames and streak freezes." />
          <FeatureCard colorClass="orange" icon={Icons.trophy} title="Study Squad Leaderboards" desc="Add friends to your private squad or compete on the Global Campus leaderboard. See who is the most productive pilot." />
          <FeatureCard colorClass="cyan" icon={Icons.clock} title="Smart Focus Timer" desc="A built-in Pomodoro timer that tracks your deep-work minutes, tracks your mood, and syncs directly to your daily XP goals." />
          <FeatureCard colorClass="indigo" icon={Icons.file} title="Master Assignment Board" desc="Manage tasks with beautiful Kanban boards. One click automatically syncs your deadlines to Google Calendar." />
          <FeatureCard colorClass="green" icon={Icons.chart} title="Advanced Analytics" desc="Visualize your success with SVG Radar charts. We calculate a unified 'Master Score' combining grades, attendance, and finances." />
          <FeatureCard colorClass="rose" icon={Icons.calendar} title="Attendance Tracking" desc="Never guess how many classes you've missed. Track your exact attendance percentages to avoid the danger zone." />
          <FeatureCard colorClass="blue" icon={Icons.book} title="GPA & Grade Book" desc="Log your semester grades to automatically calculate your cumulative GPA, keeping your academic targets crystal clear." />
          <FeatureCard colorClass="emerald" icon={Icons.expenses} title="Student Budgeting" desc="Manage your monthly allowance. Track where your money is going with categorized expense logging and budget warnings." />
        </div>
      </motion.div>

      {/* ─── 4. THE LEADERBOARD PREVIEW ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-5xl mx-auto px-6 py-24 relative z-10">
        <div className="bg-[#0d0d14] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Join the Global Campus</h2>
            <p className="text-white/40 text-[14px]">Compete with thousands of students. Claim the #1 spot.</p>
          </div>

          {/* Static Podium Mockup */}
          <div className="flex justify-center items-end gap-4 md:gap-8 h-[200px] relative z-10">
            {/* Silver */}
            <div className="flex flex-col items-center">
<<<<<<< HEAD
              <div className="w-14 h-14 rounded-full border-4 border-slate-300 bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-200 mb-2 shadow-[0_0_15px_rgba(203,213,225,0.3)]">P</div>
              <div className="text-[12px] font-bold text-slate-200 mb-1">Pratik</div>
=======
              <div className="w-14 h-14 rounded-full border-4 border-slate-300 bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-200 mb-2 shadow-[0_0_15px_rgba(203,213,225,0.3)]">SC</div>
              <div className="text-[12px] font-bold text-slate-200 mb-1">Sarah</div>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
              <div className="text-[10px] font-extrabold text-slate-400 mb-2">12,450 XP</div>
              <div className="w-20 md:w-28 h-24 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border border-slate-400/20 rounded-t-xl flex justify-center"><span className="text-slate-400/50 font-black text-2xl mt-3">2</span></div>
            </div>
            {/* Gold */}
            <div className="flex flex-col items-center">
<<<<<<< HEAD
              <div className="w-16 h-16 rounded-full border-4 border-amber-400 bg-amber-900/50 flex items-center justify-center text-lg font-black text-amber-100 mb-2 shadow-[0_0_20px_rgba(251,191,36,0.4)]">S</div>
              <div className="text-[14px] font-black text-amber-400 mb-1">Sagar</div>
=======
              <div className="w-16 h-16 rounded-full border-4 border-amber-400 bg-amber-900/50 flex items-center justify-center text-lg font-black text-amber-100 mb-2 shadow-[0_0_20px_rgba(251,191,36,0.4)]">AC</div>
              <div className="text-[14px] font-black text-amber-400 mb-1">Alex</div>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
              <div className="text-[11px] font-extrabold text-amber-200/70 mb-2">15,200 XP</div>
              <div className="w-24 md:w-32 h-32 bg-gradient-to-t from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-t-xl shadow-[0_0_30px_rgba(251,191,36,0.1)] flex justify-center"><span className="text-amber-500/40 font-black text-4xl mt-3">1</span></div>
            </div>
            {/* Bronze */}
            <div className="flex flex-col items-center">
<<<<<<< HEAD
              <div className="w-14 h-14 rounded-full border-4 border-orange-700 bg-orange-900/50 flex items-center justify-center text-sm font-bold text-orange-200 mb-2 shadow-[0_0_15px_rgba(194,65,12,0.3)]">Y</div>
              <div className="text-[12px] font-bold text-slate-200 mb-1">Yaksh</div>
=======
              <div className="w-14 h-14 rounded-full border-4 border-orange-700 bg-orange-900/50 flex items-center justify-center text-sm font-bold text-orange-200 mb-2 shadow-[0_0_15px_rgba(194,65,12,0.3)]">DM</div>
              <div className="text-[12px] font-bold text-slate-200 mb-1">David</div>
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
              <div className="text-[10px] font-extrabold text-orange-400 mb-2">10,800 XP</div>
              <div className="w-20 md:w-28 h-20 bg-gradient-to-t from-orange-700/20 to-orange-700/5 border border-orange-700/20 rounded-t-xl flex justify-center"><span className="text-orange-700/50 font-black text-2xl mt-3">3</span></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 5. FAQ SECTION ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        <h2 className="text-3xl font-extrabold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10">
          <FAQItem question="Is GradPilot really free?" answer="Yes! The core platform, including the task manager, timer, and leaderboards, is completely free for students." />
          <FAQItem question="How does the AI Syllabus feature work?" answer="We securely connect to Google Gemini. You paste your syllabus text, and the AI extracts every single assignment, due date, and exam into a structured format you can add to your board with one click." />
          <FAQItem question="Can I use GradPilot on my phone?" answer="Absolutely. GradPilot is a Progressive Web App (PWA). Just open it in Safari or Chrome on your phone, and tap 'Add to Home Screen' for a native app experience." />
          <FAQItem question="Can I connect my Google Calendar?" answer="Yes! Every task has a 'Sync to GCal' button that securely generates a Google Calendar event for your assignment without requiring invasive account permissions." />
        </div>
      </motion.div>

      {/* ─── 7. FINAL CTA BLOCK ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[50px]"></div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Ready to pilot your education?</h2>
          <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto relative z-10">Join thousands of students who have already gamified their studies and taken control of their semester.</p>
<<<<<<< HEAD
          <Link to="/login" className="relative z-10 inline-block bg-white text-indigo-700 font-extrabold text-[16px] px-10 py-5 rounded-2xl hover:scale-105 hover:shadow-2xl transition-all">
=======
          <Link to="/signup" className="relative z-10 inline-block bg-white text-indigo-700 font-extrabold text-[16px] px-10 py-5 rounded-2xl hover:scale-105 hover:shadow-2xl transition-all">
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
            Get Started for Free
          </Link>
        </div>
      </motion.div>

      {/* ─── 6. THE MEGA FOOTER ─── */}
      <footer className="border-t border-white/10 bg-[#0a0a10] pt-16 pb-8 relative z-10 mt-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/GradPilot.png" alt="GradPilot" className="h-6 w-auto" />
              <span className="text-lg font-extrabold text-white">GradPilot</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed mb-6">The AI-powered command center designed to gamify your academic life.</p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Icon d={Icons.star} size={14} /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Icon d={Icons.users} size={14} /></a>
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Product</h4>
            <ul className="space-y-3 text-[13px] text-white/50">
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Interactive Demo</Link></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Global Leaderboard</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Product Roadmap</a></li>
            </ul>
          </div>

          {/* Support Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Support</h4>
            <ul className="space-y-3 text-[13px] text-white/50">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Submit Feedback</a></li>
            </ul>
          </div>

          {/* Legal Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Legal</h4>
            <ul className="space-y-3 text-[13px] text-white/50">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

        </div>
        
        {/* Bottom Bar with Tri-color & Rotating Chakra */}
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[12px] font-bold text-white/30 uppercase tracking-widest">
            © {new Date().getFullYear()} GradPilot Inc. All rights reserved.
          </p>
          
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-white/30 uppercase tracking-widest">
              Made in India with Love
            </span>
            
            {/* 🇮🇳 THE INTERACTIVE FLAG 🇮🇳 */}
            <div className="relative w-8 h-5 rounded-[2px] overflow-hidden shadow-lg border border-white/5 flex flex-col group hover:scale-110 transition-transform duration-500">
              <div className="flex-1 bg-[#FF9933]"></div> {/* Saffron */}
              <div className="flex-1 bg-white flex items-center justify-center relative">
                {/* Ashoka Chakra SVG */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-2 h-2 text-[#000080] animate-spin-slow opacity-80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  {[...Array(12)].map((_, i) => (
                    <line
                      key={i}
                      x1="12" y1="12"
                      x2={12 + 10 * Math.cos((i * 30 * Math.PI) / 180)}
                      y2={12 + 10 * Math.sin((i * 30 * Math.PI) / 180)}
                    />
                  ))}
                </svg>
              </div>
              <div className="flex-1 bg-[#138808]"></div> {/* Green */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}