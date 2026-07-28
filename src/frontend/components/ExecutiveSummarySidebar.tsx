"use client";

import { ShieldCheck, FileText, CheckCircle, AlertTriangle, X } from "lucide-react";

interface ExecutiveSummarySidebarProps {
  summary?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExecutiveSummarySidebar({
  summary,
  isOpen,
  onClose,
}: ExecutiveSummarySidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-50 p-6 overflow-y-auto transition-transform duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Süpervizör Yönetici Özeti</h3>
            <p className="text-xs text-slate-400">Conflict-Resolved Executive Summary</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 space-y-4 font-sans text-sm leading-relaxed text-slate-300">
        {summary ? (
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap font-sans text-sm">
            {summary}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p>Yönetici özeti henüz oluşturulmadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
