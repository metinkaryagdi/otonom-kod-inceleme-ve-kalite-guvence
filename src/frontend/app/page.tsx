"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GitPullRequest,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Sparkles,
  ArrowUpRight,
  Play,
  Clock,
  User,
  Activity,
  Layers,
  FileCode,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import { fetchAllReviews, fetchDashboardStats, triggerSimulatedPR, submitCustomCode, PullRequestReview, DashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PullRequestReview[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    criticalBlocked: 0,
    unitTestsGenerated: 0,
    avgTokenSavingsPct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Custom Code Submission Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customFilePath, setCustomFilePath] = useState("Services/AccountService.cs");
  const [customTitle, setCustomTitle] = useState("Feature: Account Security Refactor");
  const [customCode, setCustomCode] = useState(`using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Enterprise.Services
{
    public class AccountService
    {
        private readonly DbContext _context;
        public AccountService(DbContext context) { _context = context; }

        public async Task<object> FindAccountByToken(string token)
        {
            // Vulnerable raw SQL query
            string sql = "SELECT * FROM Accounts WHERE Token = '" + token + "'";
            return await _context.Set<object>().FromSqlRaw(sql).FirstOrDefaultAsync();
        }

        public object GetAccountSync(int id)
        {
            // Sync-over-async deadlock risk
            return FetchAccountAsync(id).Result;
        }

        private async Task<object> FetchAccountAsync(int id)
        {
            return await Task.FromResult(new { Id = id });
        }
    }
}`);
  const [submittingCustom, setSubmittingCustom] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [revData, statData] = await Promise.all([fetchAllReviews(), fetchDashboardStats()]);
    setReviews(revData);
    setStats(statData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;
    setSubmittingCustom(true);
    try {
      const res = await submitCustomCode(customFilePath, customCode, customTitle);
      setIsCustomModalOpen(false);
      if (res?.reviewId) {
        router.push(`/pr/${res.reviewId}/live`);
      } else {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCustom(false);
    }
  };

  const handleSimulatePR = async () => {
    setSimulating(true);
    try {
      const res = await triggerSimulatedPR();
      if (res?.reviewId) {
        router.push(`/pr/${res.reviewId}/live`);
      } else {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MassTransit & Ollama Fan-Out Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Autonomous Code Review Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
              Git Pull Request web hook'larını yakalayan, Roslyn AST budaması ile gürültüyü temizleyen ve 3 paralel SLM (Güvenlik, Clean Code, Birim Test) ile kod inceleyen otonom sistem.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Özel Kod İncelet</span>
            </button>

            <button
              onClick={handleSimulatePR}
              disabled={simulating}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {simulating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  PR İşleniyor...
                </span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Demo PR Başlat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="İncelenen Toplam PR"
          value={stats.totalReviews}
          subtitle="Otonom Boru Hattı"
          icon={<GitPullRequest className="w-6 h-6" />}
          gradient="from-indigo-600 to-blue-600"
        />
        <KpiCard
          title="Kritik Açık Engellendi"
          value={stats.criticalBlocked}
          subtitle="Specification Guardrails"
          icon={<ShieldAlert className="w-6 h-6" />}
          gradient="from-red-600 to-rose-600"
        />
        <KpiCard
          title="Üretilen Testler"
          value={stats.unitTestsGenerated}
          subtitle="Roslyn Derleme Onaylı"
          icon={<CheckCircle2 className="w-6 h-6" />}
          gradient="from-emerald-600 to-teal-600"
        />
        <KpiCard
          title="Ort. AST Token Tasarrufu"
          value={`%${stats.avgTokenSavingsPct.toFixed(1)}`}
          subtitle="Context Minimization"
          icon={<Cpu className="w-6 h-6" />}
          gradient="from-purple-600 to-pink-600"
        />
      </div>

      {/* Recent PR Reviews Table Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Son Pull Request İncelemeleri</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Gerçek zamanlı SignalR güncellemeleri ile canlı durum akışı</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SignalR WebSocket Active</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <span className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin inline-block mb-3" />
            <p>PR verileri yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <FileCode className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p>Henüz incelenmiş bir Pull Request bulunmuyor.</p>
            <button
              onClick={handleSimulatePR}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold transition-colors"
            >
              Demo PR Başlat
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">PR # / Başlık</th>
                  <th className="px-5 py-4">Depo</th>
                  <th className="px-5 py-4">Yazar / Dallar</th>
                  <th className="px-5 py-4">AST Token Tasarrufu</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4 text-right">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          #{rev.pullRequestId}
                        </span>
                        <div>
                          <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {rev.title}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(rev.createdAt).toLocaleTimeString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs font-medium text-slate-300">
                      {rev.repositoryName}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          @{rev.author}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                          {rev.sourceBranch} ➔ {rev.targetBranch}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>%{rev.averageTokenSavingsPercentage.toFixed(1)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={rev.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pr/${rev.id}/live`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold hover:text-white transition-colors flex items-center gap-1"
                        >
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Canlı İzle</span>
                        </Link>
                        <Link
                          href={`/pr/${rev.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1"
                        >
                          <span>İnceleme</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Code Submission Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Özel Kod İncelemesi Başlat</h3>
                  <p className="text-xs text-slate-400">Kendi C# kodunuzu yapıştırarak 3 paralel SLM ajanına inceletin</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dosya Yolu (FilePath)</label>
                  <input
                    type="text"
                    value={customFilePath}
                    onChange={(e) => setCustomFilePath(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Services/MyService.cs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PR / İnceleme Başlığı</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Refactor: Add Security Audit"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">C# İçerik / Kod Bloğu</label>
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  placeholder="// C# Kodlarınızı buraya yapıştırın..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingCustom}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingCustom ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Ajanlara Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Otonom İncelemeyi Başlat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const configs: Record<number, { label: string; bg: string }> = {
    0: { label: "Alındı (ACL)", bg: "bg-slate-800 text-slate-300 border-slate-700" },
    1: { label: "AST Budaması", bg: "bg-purple-950/50 text-purple-300 border-purple-800" },
    2: { label: "Temsilciler Paralel", bg: "bg-blue-950/50 text-blue-300 border-blue-800" },
    3: { label: "Guardrails", bg: "bg-amber-950/50 text-amber-300 border-amber-800" },
    4: { label: "Süpervizör Sentez", bg: "bg-indigo-950/50 text-indigo-300 border-indigo-800" },
    5: { label: "Tamamlandı", bg: "bg-emerald-950/50 text-emerald-300 border-emerald-800" },
    6: { label: "Hata", bg: "bg-red-950/50 text-red-300 border-red-800" },
  };

  const cfg = configs[status] || configs[0];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
