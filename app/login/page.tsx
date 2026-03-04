"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Loader2, GraduationCap } from "lucide-react"; // NEW: Added User icon
import { motion } from "framer-motion";
import { useToast } from "@/components/ToastContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(""); // NEW: Added state for Name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if fields are empty (including Name if they are signing up)
    if (!email || !password || (!isLogin && !name)) {
      addToast("Please fill in all fields.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // SIGN IN LOGIC
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        addToast("Welcome back to GradPilot!", "success");
        router.push("/"); 

      } else {
        // SIGN UP LOGIC
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name, // NEW: Saves the user's name securely to the database!
            }
          }
        });

        if (error) throw error;

        addToast(`Welcome, ${name}!`, "success");
        router.push("/"); 
      }
    } catch (error: any) {
      addToast(error.message || "An error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // FIX: Added "w-full" here to stretch it across the flex container and center it
    <main className="w-full min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Image 
              src="/logo-full.png" 
              alt="GradPilot" 
              width={200} 
              height={60}
              className="w-auto h-14 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 text-center">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-zinc-400 text-sm text-center">
            {isLogin ? "Enter your details to access your dashboard." : "Start taking control of your academics."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* NEW: Conditional Name Input (Only shows when signing up) */}
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative mb-2">
            <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setName(""); // Clear the name field when switching modes
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}