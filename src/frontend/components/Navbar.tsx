"use client";

import Link from "next/link";
import { ShieldCheck, Cpu, GitPullRequest, Zap, Activity } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Autonomous Review Squad
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                .NET 8 & Ollama Live
              </span>
              <span>•</span>
              <span>Fan-Out Pipeline</span>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-indigo-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900/60"
          >
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
            <span>PR Paneli</span>
          </Link>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Roslyn AST Pruning</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>MassTransit EventBus</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
