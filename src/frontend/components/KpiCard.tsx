import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  gradient: string;
}

export default function KpiCard({ title, value, subtitle, icon, gradient }: KpiCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-slate-700`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-15 blur-2xl -mr-10 -mt-10 rounded-full`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-500/10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
