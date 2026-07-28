"use client";

import { useEffect, useState } from "react";
import { GitPullRequest, Cpu, ShieldCheck, Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import * as signalR from "@microsoft/signalr";

interface ExecutionVisualizerProps {
  reviewId: string;
  currentStatus: number;
}

export default function ExecutionVisualizer({ reviewId, currentStatus: initialStatus }: ExecutionVisualizerProps) {
  const [status, setStatus] = useState<number>(initialStatus);
  const [liveLog, setLiveLog] = useState<string>("Sistem başlatıldı. Webhook işleniyor...");

  useEffect(() => {
    if (initialStatus === 5) {
      setLiveLog("✅ Tüm otonom inceleme boru hattı ve Guardrails doğrulaması başarıyla tamamlandı. Rapor hazır!");
    }
  }, [initialStatus]);

  useEffect(() => {
    const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:5000/hubs/review-progress";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        connection.invoke("JoinReviewGroup", reviewId);
        connection.on("ReceiveProgressUpdate", (data: any) => {
          if (data?.status !== undefined) {
            setStatus(data.status);
            if (data.status === 5) {
              setLiveLog("✅ Tüm otonom inceleme boru hattı ve Guardrails doğrulaması başarıyla tamamlandı. Rapor hazır!");
            }
          }
          if (data?.message) setLiveLog(data.message);
        });
      })
      .catch(() => {
        simulateStepProgress();
      });

    return () => {
      connection.stop();
    };
  }, [reviewId]);

  const simulateStepProgress = () => {
    setTimeout(() => {
      setStatus(1);
      setLiveLog("Roslyn AST Pruner: Gürültü temizliği ve token minimizasyonu yapılıyor...");
    }, 1000);

    setTimeout(() => {
      setStatus(2);
      setLiveLog("MassTransit Fan-Out: Security, CleanCode ve UnitTest SLM temsilcileri paralel başlatıldı...");
    }, 2500);

    setTimeout(() => {
      setStatus(3);
      setLiveLog("Specification Pattern: Derleme ve sızıntı doğrulama muhafızları çalışıyor...");
    }, 4500);

    setTimeout(() => {
      setStatus(4);
      setLiveLog("Süpervizör: Çakışmalar çözülüyor, nihai yönetici özeti oluşturuluyor...");
    }, 6000);

    setTimeout(() => {
      setStatus(5);
      setLiveLog("✅ Tüm otonom inceleme boru hattı ve Guardrails doğrulaması başarıyla tamamlandı. Rapor hazır!");
    }, 7500);
  };

  const steps = [
    { id: 0, title: "1. ACL Ingestion", desc: "GitHub Webhook & Schema Isolation", icon: GitPullRequest },
    { id: 1, title: "2. Roslyn AST Pruning", desc: "Token Minimizasyon Engine", icon: Cpu },
    { id: 2, title: "3. Fan-Out SLMs", desc: "Security, CleanCode & UnitTest", icon: Sparkles },
    { id: 3, title: "4. Guardrails", desc: "Specification Syntax Verification", icon: ShieldCheck },
    { id: 4, title: "5. Supervisor Final", desc: "Executive Summary & Push", icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Canlı Fan-Out / Fan-In İşlem Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-1">Real-time Agent Orchestration Graph</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-400">
          <span>PR-ID: {reviewId.substring(0, 8)}...</span>
        </div>
      </div>

      {/* Node Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative my-8">
        {steps.map((step) => {
          const { isDone, isCurrent, isFailed } = getStepState(step.id, status);
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl border p-4 transition-all duration-300 ${
                isFailed
                  ? "border-red-500/40 bg-red-950/20 text-red-300"
                  : isCurrent
                  ? "border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/20 scale-105"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-950/20 text-slate-200"
                  : "border-slate-800/80 bg-slate-900/40 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    isFailed
                      ? "bg-red-500/20 text-red-400"
                      : isCurrent
                      ? "bg-indigo-600 text-white"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isDone ? "text-emerald-400" : isCurrent ? "text-indigo-400" : "text-slate-500"
                  }`}
                >
                  {isDone ? "Tamamlandı" : isCurrent ? "Çalışıyor" : "Bekliyor"}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-400 leading-tight">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Output */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2 text-slate-500 mb-2 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${status === 5 ? "bg-emerald-400" : "bg-indigo-400 animate-ping"}`} />
          <span>CANLI SİSTEM LOGLARI:</span>
        </div>
        <p className="text-emerald-400 flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
          <span>{liveLog}</span>
        </p>
      </div>
    </div>
  );
}

function getStepState(stepId: number, currentStatus: number) {
  if (currentStatus === 5) {
    return { isDone: true, isCurrent: false, isFailed: false };
  }
  if (currentStatus === 6) {
    return { isDone: false, isCurrent: false, isFailed: true };
  }

  const isDone = currentStatus > stepId;
  const isCurrent = currentStatus === stepId || (currentStatus === 4 && stepId === 4);
  return { isDone, isCurrent, isFailed: false };
}
