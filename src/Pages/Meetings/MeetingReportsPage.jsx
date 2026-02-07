/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/purity */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  Clock,
  Users,
  Shield,
  Cpu,
  Activity,
} from "lucide-react";

export default function MeetingReportsPage() {
  const noiseStats = [
    { name: "You", avgNoise: "Low", clarity: "98%", env: "Home Office" },
    { name: "Omar", avgNoise: "Medium", clarity: "85%", env: "Public Cafe" },
    { name: "Sarah", avgNoise: "Low", clarity: "95%", env: "Studio Room" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-purple-600 font-bold uppercase tracking-[0.3em] text-[10px]">
              Post-Meeting Insights
            </span>
            <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
              Weekly AI Standup
            </h1>
            <div className="flex items-center gap-4 mt-3 text-slate-500 text-sm">
              <span className="flex items-center gap-1.5">
                <Clock size={16} /> 45 min Duration
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={16} /> 4 Participants
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">
                HD Recorded
              </span>
            </div>
          </motion.div>
          <button className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[1.5rem] font-bold text-sm shadow-xl hover:scale-105 transition-all">
            <FileText size={18} className="text-blue-500" /> Export PDF Report
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Noise Analytics Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Activity size={24} />
                </div>
                <h2 className="text-xl font-bold">Real-time Noise Filtering</h2>
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Active Processing
              </span>
            </div>

            <div className="h-64 flex items-end gap-1 px-2 pb-6 relative">
              {/* Image of a noise history visualization graph showing noise levels over time */}
              <div className="absolute inset-0 border-b border-slate-100 dark:border-slate-800 pointer-events-none" />
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${20 + Math.random() * 80}%` }}
                  transition={{ delay: i * 0.02, duration: 1 }}
                  className="flex-1 bg-linear-to-t from-blue-600 via-cyan-400 to-emerald-400 rounded-t-sm"
                />
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-4 italic">
              MeetVerse AI filtered approximately 1.2GB of background data to
              maintain 98% vocal clarity.
            </p>
          </motion.div>

          {/* AI Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2.5rem] p-8 shadow-2xl relative"
          >
            <div className="absolute top-6 right-8 opacity-20">
              <Cpu size={40} />
            </div>
            <h2 className="text-xl font-bold mb-6">AI Meeting Summary</h2>
            <div className="space-y-6">
              {[
                "Reviewed Q1 roadmap progress & key milestones.",
                "Prioritized performance over new features this sprint.",
                "Assigned API integration tasks to the backend team.",
              ].map((task, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-blue-50 leading-relaxed">{task}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
              Share Summary
            </button>
          </motion.div>
        </div>

        {/* Detailed Participants Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] overflow-hidden shadow-xl"
        >
          <div className="p-8 border-b border-slate-100 dark:border-[#2A2E3B] flex items-center gap-3">
            <Shield className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold">Participant Audio Forensics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-8 py-4">Participant</th>
                  <th className="px-8 py-4">Noise Level</th>
                  <th className="px-8 py-4">Vocal Clarity</th>
                  <th className="px-8 py-4">Detected Env</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A2E3B]">
                {noiseStats.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-6 font-bold">{p.name}</td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.avgNoise === "Low" ? "bg-emerald-100 text-emerald-600" : "bg-yellow-100 text-yellow-600"}`}
                      >
                        {p.avgNoise}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-mono text-blue-600">
                      {p.clarity}
                    </td>
                    <td className="px-8 py-6 text-slate-500 text-sm">
                      {p.env}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
