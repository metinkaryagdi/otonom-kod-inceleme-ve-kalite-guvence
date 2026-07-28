"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  FileCode,
  Sparkles,
  GitPullRequest,
  CheckCircle,
  AlertTriangle,
  Sidebar,
  Code2,
} from "lucide-react";
import CodeDiffViewer from "@/components/CodeDiffViewer";
import ExecutiveSummarySidebar from "@/components/ExecutiveSummarySidebar";
import { fetchReviewById, PullRequestReview } from "@/lib/api";

export default function PRWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reviewId = resolvedParams.id;

  const [review, setReview] = useState<PullRequestReview | null>(null);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewById(reviewId).then((data) => {
      setReview(data);
      setLoading(false);
    });
  }, [reviewId]);

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500">
        <span className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin inline-block mb-4" />
        <p className="text-sm font-medium">PR İnceleme Detayları Yükleniyor...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p>İnceleme bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Panelle Dön
        </Link>
      </div>
    );
  }

  const activeFile = review.fileReviews[activeFileIdx] || review.fileReviews[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Panelle Dön</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              PR #{review.pullRequestId}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{review.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
            <span>Depo: <strong className="text-slate-200 font-mono">{review.repositoryName}</strong></span>
            <span>•</span>
            <span>Yazar: <strong className="text-slate-200">@{review.author}</strong></span>
            <span>•</span>
            <span>Dallar: <strong className="text-slate-200 font-mono">{review.sourceBranch} ➔ {review.targetBranch}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <Sidebar className="w-4 h-4" />
            <span>Yönetici Özeti Göster</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: File Navigator */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Değişen Dosyalar ({review.fileReviews.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {review.fileReviews.map((file, idx) => {
              const isSelected = idx === activeFileIdx;
              const securityCount = file.comments.filter((c) => c.agent === 0).length;

              return (
                <button
                  key={file.id}
                  onClick={() => setActiveFileIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-950/40 text-white shadow-md font-semibold"
                      : "border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="truncate">{file.filePath}</span>
                  {securityCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold shrink-0">
                      {securityCount} Security
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Interactive Diff Code Viewer */}
        <div className="lg:col-span-3">
          {activeFile ? (
            <CodeDiffViewer
              filePath={activeFile.filePath}
              originalContent={activeFile.originalContent}
              comments={activeFile.comments}
              tokenSavings={activeFile.tokenSavingsPercentage}
            />
          ) : (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Dosya seçilmedi.
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary Drawer */}
      <ExecutiveSummarySidebar
        summary={review.executiveSummary}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
