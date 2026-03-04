"use client"; // This MUST be the very first line!

import { ReactNode } from "react";
import { motion } from "framer-motion"; // Importing our animation engine

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  index?: number; // We added this so we can tell each card when to start moving
}

export default function StatCard({ title, value, icon, trend, index = 0 }: StatCardProps) {
  return (
    // We changed <div> to <motion.div> to unlock animation powers!
    <motion.div 
      initial={{ opacity: 0, y: 20 }} // Start completely invisible and pushed down 20 pixels
      animate={{ opacity: 1, y: 0 }}  // End fully visible and at its normal position
      transition={{ 
        delay: index * 0.15, // Stagger the animation: Card 0 delays 0s, Card 1 delays 0.15s, etc.
        duration: 0.4, 
        ease: "easeOut" 
      }}
      className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-zinc-400 font-medium">{title}</h3>
        <div className="text-zinc-500 bg-zinc-800/50 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <p className="text-emerald-500 text-sm mt-1 font-medium">{trend}</p>
        )}
      </div>
    </motion.div>
  );
}