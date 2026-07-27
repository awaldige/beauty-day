import { ReactNode } from 'react';

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  prefixo?: string;
  auxiliar?: ReactNode;
  destaque?: boolean;
}

export function CardMetrica({ titulo, valor, prefixo, auxiliar, destaque = false }: CardMetricaProps) {
  // Se for o card destacado (Faturamento)
  if (destaque) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-6 rounded-3xl border-2 border-emerald-500/40 shadow-sm group hover:scale-[1.02] transition-all duration-300">
        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block">
          {titulo}
        </span>
        
        <div className="flex items-baseline gap-1 mt-3">
          {prefixo && <span className="text-sm font-black text-emerald-700">{prefixo}</span>}
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#1a0933]">{valor}</span>
        </div>
        
        {auxiliar && <div className="mt-4 text-xs font-bold text-emerald-800">{auxiliar}</div>}
      </div>
    );
  }

  // Cards normais (Total Atendimentos, Taxa de Conclusão, Cancelamentos)
  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-violet-200/80 shadow-sm group hover:scale-[1.02] hover:border-violet-400 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0 group-hover:via-fuchsia-500 transition-all duration-500" />
      
      <span className="text-[10px] font-black text-violet-800/80 uppercase tracking-widest block">
        {titulo}
      </span>
      
      <div className="flex items-baseline gap-1 mt-3">
        {prefixo && <span className="text-sm font-extrabold text-violet-500">{prefixo}</span>}
        <span className="text-3xl font-black tracking-tight text-[#1a0933]">{valor}</span>
      </div>
      
      {auxiliar && <div className="mt-4 text-xs font-bold text-violet-700">{auxiliar}</div>}
    </div>
  );
}