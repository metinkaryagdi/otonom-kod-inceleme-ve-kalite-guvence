"use client";

import { useState } from "react";
import { ShieldAlert, Sparkles, CheckCircle2, Copy, Check, ChevronDown, ChevronUp, AlertOctagon } from "lucide-react";
import { AgentComment } from "@/lib/api";

interface CodeDiffViewerProps {
  filePath: string;
  originalContent: string;
  comments: AgentComment[];
  tokenSavings: number;
}

export default function CodeDiffViewer({
  filePath,
  originalContent,
  comments,
  tokenSavings,
}: CodeDiffViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const lines = originalContent ? originalContent.split("\n") : [];

  const getCommentsForLine = (lineNum: number) => {
    return comments.filter((c) => c.lineNumber === lineNum);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* File Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            C# / Roslyn
          </span>
          <span className="text-sm font-semibold text-slate-200 font-mono">{filePath}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AST Token Tasarrufu: %{tokenSavings.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {comments.filter((c) => c.agent === 0).length} Güvenlik
            </span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {comments.filter((c) => c.agent === 1).length} CleanCode
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {comments.filter((c) => c.agent === 2).length} Test
            </span>
          </div>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="overflow-x-auto font-mono text-xs leading-relaxed">
        {lines.map((lineText, idx) => {
          const lineNum = idx + 1;
          const lineComments = getCommentsForLine(lineNum);
          const hasComments = lineComments.length > 0;

          return (
            <div key={lineNum} className="group">
              {/* Code Line Row */}
              <div
                className={`flex items-start transition-colors ${
                  hasComments ? "bg-slate-900/80 hover:bg-slate-900" : "hover:bg-slate-900/40"
                }`}
              >
                <div className="w-14 select-none text-right pr-4 py-1 text-slate-600 border-r border-slate-800/60 bg-slate-950 font-mono font-medium text-[11px]">
                  {lineNum}
                </div>
                <div className="flex-1 px-4 py-1 text-slate-300 whitespace-pre overflow-x-auto">
                  {lineText}
                </div>
              </div>

              {/* Inline AI Badges & Comments */}
              {hasComments && (
                <div className="my-2 mx-14 space-y-2.5">
                  {lineComments.map((comment) => {
                    const isSecurity = comment.agent === 0;
                    const isCleanCode = comment.agent === 1;
                    const isUnitTest = comment.agent === 2;

                    const badgeColor = isSecurity
                      ? "border-red-500/40 bg-red-950/30 text-red-200"
                      : isCleanCode
                      ? "border-blue-500/40 bg-blue-950/30 text-blue-200"
                      : "border-emerald-500/40 bg-emerald-950/30 text-emerald-200";

                    const icon = isSecurity ? (
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    ) : isCleanCode ? (
                      <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    );

                    const agentTitle = isSecurity
                      ? "🔴 SECURITY SLM VULNERABILITY"
                      : isCleanCode
                      ? "🔵 CLEAN CODE REFRACTOR"
                      : "🟢 GENERATED UNIT TEST";

                    return (
                      <div
                        key={comment.id}
                        className={`rounded-xl border ${badgeColor} p-4 backdrop-blur-md shadow-xl`}
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(comment.id)}>
                          <div className="flex items-center gap-2.5">
                            {icon}
                            <span className="text-[11px] font-bold uppercase tracking-wider">
                              {agentTitle}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-white">{comment.title}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {comment.passedGuardrails ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Roslyn Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" /> Guardrail Blocked
                              </span>
                            )}
                            {expandedComments[comment.id] ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        <p className="text-slate-300 mt-2 text-xs leading-relaxed font-sans">
                          {comment.message}
                        </p>

                        {/* Code Snippet & Suggested Fix */}
                        {comment.suggestedFix && (
                          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 relative">
                            <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
                              <span>Önerilen Düzeltme / Test Kodu:</span>
                              <button
                                onClick={() => handleCopy(comment.id, comment.suggestedFix!)}
                                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
                              >
                                {copiedId === comment.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Kopyalandı!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Kodu Kopyala</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre">
                              {comment.suggestedFix}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
