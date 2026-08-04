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
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/50 p-4.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/40 shadow-sm group active:scale-[0.98] sm:hover:scale-[1.02] transition-all duration-300 touch-manipulation">
        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block truncate">
          {titulo}
        </span>
        
        <div className="flex items-baseline gap-1 mt-2.5 sm:mt-3">
          {prefixo && (
            <span className="text-xs sm:text-sm font-black text-emerald-700 shrink-0">
              {prefixo}
            </span>
          )}
          <span className="text-2xl sm:text-4xl font-black tracking-tight text-[#1a0933] break-all leading-none">
            {valor}
          </span>
        </div>
        
        {auxiliar && (
          <div className="mt-3 sm:mt-4 text-[11px] sm:text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            {auxiliar}
          </div>
        )}
      </div>
    );
  }

  // Cards normais (Total Atendimentos, Taxa de Conclusão, Cancelamentos)
  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm p-4.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-violet-200/80 shadow-sm group active:scale-[0.98] sm:hover:scale-[1.02] sm:hover:border-violet-400 transition-all duration-300 touch-manipulation">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0 sm:group-hover:via-fuchsia-500 transition-all duration-500" />
      
      <span className="text-[10px] font-black text-violet-800/80 uppercase tracking-widest block truncate">
        {titulo}
      </span>
      
      <div className="flex items-baseline gap-1 mt-2.5 sm:mt-3">
        {prefixo && (
          <span className="text-xs sm:text-sm font-extrabold text-violet-500 shrink-0">
            {prefixo}
          </span>
        )}
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1a0933] break-all leading-none">
          {valor}
        </span>
      </div>
      
      {auxiliar && (
        <div className="mt-3 sm:mt-4 text-[11px] sm:text-xs font-bold text-violet-700 flex items-center gap-1.5">
          {auxiliar}
        </div>
      )}
    </div>
  );
}
