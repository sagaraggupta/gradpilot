import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Icon, Icons } from "../components/ui/Icon";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

// ─── 📊 ANALYTICS TRACKER (Mock implementation for Feature #8) ───
const trackEvent = (eventName, data = {}) => {
  console.log(`[Analytics] ${eventName}`, data);
  // Future: window.gtag('event', eventName, data); or posthog.capture()
};

// ─── 1. INTERACTIVE FEATURE CARD COMPONENT ───
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

const FeatureCard = ({ icon, title, desc, colorClass }) => {
  const styles = colorStyles[colorClass] || colorStyles.indigo;

  return (
    <div 
      className={`bg-white/5 border border-white/10 rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden h-full flex flex-col cursor-pointer ${styles.wrapper}`}
      onClick={() => trackEvent('feature_card_clicked', { feature: title })}
      aria-label={`Feature: ${title}`}
    >
      <div className="relative z-10 flex-1">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${styles.iconBg} ${styles.iconText}`}>
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
      <button 
        onClick={() => { setIsOpen(!isOpen); trackEvent('faq_toggled', { question }); }} 
        className="flex w-full justify-between items-center text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-bold text-slate-200">{question}</span>
        <span className="text-indigo-400 text-xl">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <p className="mt-3 text-[14px] text-white/50 leading-relaxed animate-[fadeIn_0.2s_ease-out]">{answer}</p>}
    </div>
  );
};

// ─── TESTIMONIAL COMPONENT ───
const Testimonial = ({ quote, author, role, avatar }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-full hover:bg-white/10 transition-colors">
    <div className="text-amber-400 text-xl mb-4">{"★★★★★"}</div>
    <p className="text-[14px] text-white/70 italic mb-6 leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center font-bold text-indigo-300">
        {avatar}
      </div>
      <div>
        <div className="text-[13px] font-bold text-slate-200">{author}</div>
        <div className="text-[11px] text-white/40">{role}</div>
      </div>
    </div>
  </div>
);

export default function Landing() {
  const { user } = useAuth();
  
  // DYNAMIC STATS ANIMATION
  const [creditsEarned, setCreditsEarned] = useState(44800);

  // STATE FOR YOUTUBE MODAL
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // NEWSLETTER STATE
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setNewsletterStatus("loading");
    trackEvent('newsletter_subscribed');

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }]);

    if (error) {
      // Code 23505 means it violates the UNIQUE constraint (they are already subscribed)
      if (error.code === '23505') {
        setNewsletterStatus("success"); // Treat as success so they don't worry
      } else {
        setNewsletterStatus("error");
        console.error("Newsletter error:", error);
      }
    } else {
      setNewsletterStatus("success");
      setEmail(""); // Clear the input
    }

    // Reset status after 3 seconds
    setTimeout(() => setNewsletterStatus("idle"), 3000);
  };

  // ─── 🔍 SEO & META TAGS INJECTION (Feature #5 Fix) ───
  useEffect(() => {
    document.title = "GradPilot | The Ultimate Student Command Center";
    
    // Inject Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Gamify your study, automate your syllabus with AI, and track your GPA. The smart dashboard built by students, for students.";

    // Simulate Live Credits Data
    const interval = setInterval(() => setCreditsEarned(prev => prev + Math.floor(Math.random() * 10)), 3000);
    return () => clearInterval(interval);
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const scrollToFeatures = (e) => {
    e.preventDefault();
    trackEvent('scrolled_to_features');
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-slate-200 font-['Plus_Jakarta_Sans'] overflow-x-hidden selection:bg-indigo-500/30">
      
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
            {/* ACCESSIBILITY FIX: Added meaningful alt text */}
            <img src="/GradPilot.png" alt="GradPilot Logo - Blue paper plane" className="h-8 w-auto" loading="lazy" />
            <span className="text-xl font-extrabold tracking-tight text-white hidden sm:block">GradPilot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" onClick={() => trackEvent('nav_signin_clicked')} className="text-sm font-bold text-white/60 hover:text-white transition-colors">Sign In</Link>
            <Link to="/login" onClick={() => trackEvent('nav_signup_clicked')} className="text-sm font-bold bg-white text-[#0d0d14] px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
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
            <Link to="/login" onClick={() => trackEvent('hero_cta_clicked')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[15px] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2">
              Start Your Journey <span className="text-lg">🚀</span>
            </Link>
            <button 
              onClick={() => { setIsVideoOpen(true); trackEvent('demo_video_opened'); }} 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[15px] hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Icon d={Icons.play} size={18} /> Watch Product Demo
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── 1. DYNAMIC TRUST BAR ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-y border-white/5 bg-white/[0.02] py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-8 md:gap-16 text-white/30 font-bold text-[13px] md:text-[15px] uppercase tracking-widest text-center">
          <div className="flex items-center gap-2"><Icon d={Icons.file} size={18} /> 1,200+ Syllabus Scanned</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
          {/* DYNAMIC STAT */}
          <div className="flex items-center gap-2 text-amber-300/80"><span className="text-[16px]">🪙</span> {creditsEarned.toLocaleString()}+ Credits Earned Today</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
          <div className="flex items-center gap-2"><Icon d={Icons.users} size={18} /> Used by Students Across India</div>
        </div>
      </motion.div>

      {/* ─── 📝 STORY SECTION (Emotional Hook) ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-5xl mx-auto px-6 py-24 relative z-10">
        <div className="bg-gradient-to-r from-red-500/10 to-indigo-500/10 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1">
            <h3 className="text-red-400 font-bold uppercase tracking-widest text-[12px] mb-2">The Problem</h3>
            <h2 className="text-2xl font-extrabold text-white mb-4 leading-snug">Studying today is an unorganized, burnout-inducing nightmare.</h2>
            <p className="text-[14px] text-white/50 leading-relaxed mb-4">
              Between 5 different syllabi, canvas dashboards, missed attendance, and scattered Notion pages, you are spending more time <em>managing</em> your work than actually doing it.
            </p>
          </div>
          <div className="hidden md:block w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
          <div className="flex-1">
            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-[12px] mb-2">The Solution</h3>
            <h2 className="text-2xl font-extrabold text-white mb-4 leading-snug">An integrated system that actually rewards your discipline.</h2>
            <p className="text-[14px] text-white/50 leading-relaxed">
              GradPilot automatically extracts your deadlines, tracks your study hours, monitors your budget, and gives you <strong>dopamine-hitting XP</strong> for doing the hard work. 
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── 3. HOW IT WORKS (1-2-3 Process) ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-3">Your new daily operating system.</h2>
          <p className="text-white/40">From syllabus to graduation, we handle the logistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">1</div>
            <h3 className="text-lg font-bold text-white mb-2">Sync Your Syllabi</h3>
            <p className="text-[14px] text-white/50">Upload your course documents and let our AI instantly extract your assignments and deadlines.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(217,70,239,0.2)]">2</div>
            <h3 className="text-lg font-bold text-white mb-2">Gamify Your Study</h3>
            <p className="text-[14px] text-white/50">Use the Focus Timer to enter deep work. Earn spendable <strong>Credits</strong> and build your <strong>Pilot Score</strong>.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-black mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">3</div>
            <h3 className="text-lg font-bold text-white mb-2">Conquer The Campus</h3>
            <p className="text-[14px] text-white/50">Send bounties to your squad, track your GPA, and climb the Global Study Leaderboard.</p>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. INTERACTIVE FEATURE GRID ─── */}
      <motion.div id="features" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-7xl mx-auto px-6 py-10 relative z-10 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Everything you need to dominate your classes.</h2>
          <p className="text-white/40">Powered by advanced AI models. Designed with obsessive detail.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard colorClass="purple" icon={Icons.zap} title="AI Syllabus & Flashcards" desc="Let AI extract your syllabus due dates instantly, or generate interactive study flashcards for any assignment." />
          <FeatureCard colorClass="amber" icon={Icons.star} title="Dual Economy & Ranks" desc="Earn spendable Credits to buy profile cosmetics, and build your infinite Pilot Score to rank up from Flight Cadet to Fleet Admiral." />
          <FeatureCard colorClass="orange" icon={Icons.trophy} title="Study Squad Leaderboards" desc="Issue active bounties to friends or compete on the Global Campus leaderboard. See who is the most productive." />
          <FeatureCard colorClass="cyan" icon={Icons.clock} title="Smart Focus Timer" desc="A built-in Pomodoro timer with an evolving digital pet that tracks your deep-work minutes and syncs to your rating." />
          <FeatureCard colorClass="indigo" icon={Icons.file} title="AI Daily Commander" desc="A dynamic mission control dashboard that calculates the mathematical urgency of your tasks every morning." />
          <FeatureCard colorClass="green" icon={Icons.chart} title="Advanced Analytics" desc="Visualize your success. We calculate a unified 'Master Score' combining grades, attendance, and finances." />
          <FeatureCard colorClass="rose" icon={Icons.calendar} title="Attendance Tracking" desc="Never guess how many classes you've missed. Track your exact attendance percentages to avoid the danger zone." />
          <FeatureCard colorClass="blue" icon={Icons.book} title="GPA & Grade Book" desc="Log your semester grades to automatically calculate your cumulative GPA, keeping your academic targets crystal clear." />
          <FeatureCard colorClass="emerald" icon={Icons.expenses} title="Student Budgeting" desc="Manage your monthly allowance. Track where your money is going with categorized expense logging and budget warnings." />
        </div>
      </motion.div>

      {/* ─── WALL OF LOVE (Testimonials) ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">Wall of Love</h2>
          <p className="text-white/40">Hear from pilots who have already revolutionized their semesters.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Testimonial quote="GradPilot completely changed how I study. The AI syllabus extractor saved me hours of manual data entry during syllabus week." author="Priya S." role="Computer Science, Junior" avatar="PS" />
          <Testimonial quote="The Military Rank system is dangerously addictive. I literally studied for an extra two hours just so I could pass my friend and finally reach Fleet Admiral." author="Rahul M." role="Pre-Med, Sophomore" avatar="RM" />
          <Testimonial quote="Having my tasks, attendance, and budget in one single dashboard makes me feel like I actually have my life together." author="Ananya K." role="Business Administration, Senior" avatar="AK" />
        </div>
      </motion.div>

      {/* ─── PRICING SECTION ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">Simple, Student-Friendly Pricing</h2>
          <p className="text-white/40">Start optimizing your semester right now, completely free.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/5 border border-white/20 p-8 rounded-3xl relative">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl uppercase tracking-widest">Most Popular</div>
            <h3 className="text-2xl font-bold text-white mb-2">Cadet Plan</h3>
            <div className="text-4xl font-extrabold text-indigo-400 mb-6">₹0 <span className="text-lg text-white/40 font-medium">/forever</span></div>
            <ul className="space-y-4 mb-8 text-[14px] text-slate-300">
              <li className="flex items-center gap-2">✅ Full Task & Dashboard Access</li>
              <li className="flex items-center gap-2">✅ Focus Timer & Pet Evolution</li>
              <li className="flex items-center gap-2">✅ Global Leaderboard Access</li>
              <li className="flex items-center gap-2 text-white/40">❌ AI Syllabus Extraction</li>
            </ul>
            <Link to="/login" className="block text-center w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Start Free</Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 p-8 rounded-3xl relative">
            <h3 className="text-2xl font-bold text-white mb-2">Commander Plan</h3>
            <div className="text-4xl font-extrabold text-fuchsia-400 mb-6">₹199 <span className="text-lg text-white/40 font-medium">/month</span></div>
            <ul className="space-y-4 mb-8 text-[14px] text-slate-300">
              <li className="flex items-center gap-2">✅ Everything in Cadet</li>
              <li className="flex items-center gap-2 text-fuchsia-300">✨ Unlimited AI Syllabus Uploads</li>
              <li className="flex items-center gap-2 text-fuchsia-300">✨ AI Study Flashcards</li>
              <li className="flex items-center gap-2 text-fuchsia-300">✨ Premium Profile Frames</li>
            </ul>
            <button disabled className="w-full bg-white/10 text-white/50 font-bold py-3 rounded-xl border border-white/5 cursor-not-allowed">Coming Soon</button>
          </div>
        </div>
      </motion.div>

      {/* ─── 5. FAQ SECTION ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        <h2 className="text-3xl font-extrabold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10">
          <FAQItem question="Is GradPilot really free?" answer="Yes! The core platform, including the task manager, timer, and leaderboards, is completely free for students. We will eventually release a premium tier for advanced AI features." />
          <FAQItem question="How does the AI Syllabus feature work?" answer="We securely connect to Google Gemini. You paste your syllabus text, and the AI extracts every single assignment, due date, and exam into a structured format you can add to your board with one click." />
          <FAQItem question="Can I use GradPilot on my phone?" answer="Absolutely. GradPilot is a Progressive Web App (PWA). Just open it in Safari or Chrome on your phone, and tap 'Add to Home Screen' for a native app experience." />
          <FAQItem question="Is my data private?" answer="Yes. Your data is stored securely in Supabase. You can toggle 'Incognito Mode' in the Leaderboard to hide your profile from the public campus view at any time." />
        </div>
      </motion.div>

      {/* ─── 7. FINAL CTA BLOCK ─── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[50px]"></div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Ready to pilot your education?</h2>
          <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto relative z-10">Join thousands of students who have already gamified their studies and taken control of their semester.</p>
          <Link to="/login" onClick={() => trackEvent('bottom_cta_clicked')} className="relative z-10 inline-flex items-center gap-2 bg-white text-indigo-700 font-extrabold text-[16px] px-10 py-5 rounded-2xl hover:scale-105 hover:shadow-2xl transition-all">
            Get Started for Free <span>🚀</span>
          </Link>
        </div>
      </motion.div>

      {/* ─── 6. THE MEGA FOOTER ─── */}
      <footer className="border-t border-white/10 bg-[#0a0a10] pt-16 pb-8 relative z-10 mt-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/GradPilot.png" alt="GradPilot Logo" className="h-6 w-auto" loading="lazy" />
              <span className="text-lg font-extrabold text-white">GradPilot</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed mb-6">
              The AI-powered command center designed to gamify your academic life.
            </p>
            
            {/* ─── SOCIAL MEDIA ICONS ─── */}
            <div className="flex items-center gap-4">
              {[
                { id: 'twitter', icon: Icons.twitter, link: 'https://twitter.com/gradpilot' },
                { id: 'instagram', icon: Icons.instagram, link: 'https://instagram.com/gradpilot' },
                { id: 'linkedin', icon: Icons.linkedin, link: 'https://linkedin.com/company/gradpilot' },
                { id: 'discord', icon: Icons.discord, link: 'https://discord.gg/gradpilot' }
              ].map((social) => (
                <a 
                  key={social.id}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_clicked', { platform: social.id })}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300"
                  aria-label={`Follow us on ${social.id}`}
                >
                  <Icon d={social.icon} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Product</h4>
            <ul className="space-y-3 text-[13px] text-white/50">
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Global Leaderboard</Link></li>
            </ul>
          </div>

          {/* Support Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Support</h4>
            <ul className="space-y-3 text-[13px] text-white/50">
              {/* Idea: Link to a public Notion page you can easily edit without deploying code! */}
              <li><a href="https://notion.so/" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              
              {/* Idea: Opens their default email app pre-filled with the subject line! */}
              <li><a href="mailto:support@gradpilot.com?subject=Contact Us" className="hover:text-indigo-400 transition-colors">Contact Us</a></li>
              
              {/* Idea: Send feedback to a different email (or link to a free Google Form/Typeform) */}
              <li><a href="mailto:feedback@gradpilot.com?subject=Product Feedback" className="hover:text-indigo-400 transition-colors">Submit Feedback</a></li>
            </ul>
          </div>

          {/* Newsletter / Waitlist Col */}
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Join the Newsletter</h4>
            <p className="text-[12px] text-white/40 mb-3">Get study tips and product updates.</p>
            
            <form className="flex flex-col gap-2" onSubmit={handleNewsletterSubmit}>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="student@university.edu" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  className="bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-[12px] outline-none text-white w-full focus:border-indigo-500 disabled:opacity-50" 
                />
                <button 
                  type="submit" 
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  className="bg-indigo-500 text-white font-bold px-3 py-2 rounded-r-lg text-[12px] hover:bg-indigo-400 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                >
                  {newsletterStatus === "loading" ? "..." : newsletterStatus === "success" ? "✓" : "Join"}
                </button>
              </div>
              
              {/* Status Messages */}
              {newsletterStatus === "success" && <span className="text-[10px] text-emerald-400 font-bold animate-[fadeIn_0.2s_ease-out]">Welcome to the squad! 🚀</span>}
              {newsletterStatus === "error" && <span className="text-[10px] text-red-400 font-bold animate-[fadeIn_0.2s_ease-out]">Something went wrong. Try again.</span>}
            </form>
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
            
            <div className="relative w-8 h-5 rounded-[2px] overflow-hidden shadow-lg border border-white/5 flex flex-col group hover:scale-110 transition-transform duration-500" aria-label="Indian Flag">
              <div className="flex-1 bg-[#FF9933]"></div> 
              <div className="flex-1 bg-white flex items-center justify-center relative">
                <svg viewBox="0 0 24 24" className="w-2 h-2 text-[#000080] animate-[spin_4s_linear_infinite] opacity-80" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  {[...Array(12)].map((_, i) => (
                    <line key={i} x1="12" y1="12" x2={12 + 10 * Math.cos((i * 30 * Math.PI) / 180)} y2={12 + 10 * Math.sin((i * 30 * Math.PI) / 180)} />
                  ))}
                </svg>
              </div>
              <div className="flex-1 bg-[#138808]"></div> 
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 🎬 CINEMATIC YOUTUBE MODAL ─── */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-w-5xl bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-[slideUp_0.4s_ease-out]">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsVideoOpen(false)} 
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 border border-white/10 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              ✕
            </button>

            {/* 16:9 Aspect Ratio Container for YouTube */}
            <div className="relative w-full pb-[56.25%] h-0">
              <iframe 
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/5mmWjrhfQ14?autoplay=1&rel=0&showinfo=0&modestbranding=1" 
                title="GradPilot Product Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}