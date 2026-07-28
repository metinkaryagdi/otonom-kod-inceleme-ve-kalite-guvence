"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, ShieldCheck, ArrowUpRight } from "lucide-react";
import ExecutionVisualizer from "@/components/ExecutionVisualizer";
import { fetchReviewById, PullRequestReview } from "@/lib/api";

export default function PRLivePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reviewId = resolvedParams.id;

  const [review, setReview] = useState<PullRequestReview | null>(null);
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
        <p className="text-sm font-medium">Canlı Akış Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
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
              PR #{review?.pullRequestId || 101}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Canlı Temsilci Boru Hattı Akış İzleyici
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            MassTransit RabbitMQ EventBus & SignalR WebSockets aracılığıyla anlık durum güncellemeleri.
          </p>
        </div>

        <Link
          href={`/pr/${reviewId}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
        >
          <span>Kod İncelemeye Git</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Interactive Visualizer Component */}
      <ExecutionVisualizer reviewId={reviewId} currentStatus={review?.status || 0} />
    </div>
  );
}
