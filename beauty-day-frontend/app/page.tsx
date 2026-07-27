'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Agenda } from '@/components/Agenda';
import { Equipe } from '@/components/Equipe';
import { Servicos } from '@/components/Servicos';
import Dashboard from '@/components/dashboard';

export function PainelExecutivo() {
  // 1. Estado inicial padrão focado na agenda (incluído 'dashboard')
  const [abaAtiva, setAbaAtiva] = useState<'agenda' | 'equipe' | 'servicos' | 'dashboard'>('agenda');

  // Consultas otimizadas com fallback universal de chamadas
  const { data: agendamentosBrutos = [], isLoading: carregandoAgendamentos } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => (api as any).getAgendamentos?.() ?? (api as any).buscarAgendamentos?.() ?? Promise.resolve([]),
  });

  const { data: profissionaisBrutos = [], isLoading: carregandoProfissionais } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => (api as any).getProfissionais?.() ?? (api as any).buscarProfissionais?.() ?? Promise.resolve([]),
  });

  const { data: servicosBrutos = [], isLoading: carregandoServicos } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => (api as any).getServicos?.() ?? (api as any).buscarServicos?.() ?? Promise.resolve([]),
  });

  // 🟢 TRATAMENTO UNIVERSAL DE ARRAYS
  const agendamentos = Array.isArray(agendamentosBrutos) 
    ? agendamentosBrutos 
    : agendamentosBrutos?.data || agendamentosBrutos?.agendamentos || [];

  const profissionais = Array.isArray(profissionaisBrutos) 
    ? profissionaisBrutos 
    : profissionaisBrutos?.data || profissionaisBrutos?.profissionais || [];

  const servicos = Array.isArray(servicosBrutos) 
    ? servicosBrutos 
    : servicosBrutos?.data || servicosBrutos?.servicos || [];

  const carregandoGeral = carregandoAgendamentos || carregandoProfissionais || carregandoServicos;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-violet-300 via-indigo-200 to-pink-300 text-[#1a0933] antialiased font-sans flex flex-col relative selection:bg-fuchsia-200 selection:text-fuchsia-900">
      
      {/* Luzes decorativas saturadas de fundo */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-fuchsia-400/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-400/30 blur-[120px] pointer-events-none" />

      {/* Header Premium com fundo Lavanda Intenso */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#e4dcff]/90 border-b border-violet-300/80 shadow-[0_4px_25px_rgba(109,40,217,0.12)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Premium */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-[#1a0933] tracking-tight">
                  Beauty Day
                </h1>
                <span className="text-[9px] bg-fuchsia-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Seletor de Abas Desktop */}
          <nav className="hidden md:flex bg-violet-950/10 p-1 rounded-xl border border-violet-300/60">
            {CONTAINER_ABAS.map((aba) => {
              const ativo = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`px-6 py-2 rounded-lg text-xs font-black transition-all duration-250 uppercase tracking-wider cursor-pointer ${
                    ativo
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                      : 'text-violet-900/70 hover:text-[#1a0933] hover:bg-white/30'
                  }`}
                >
                  {aba.label}
                </button>
              );
            })}
          </nav>

          {/* Identificador do Usuário Conectado */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-[#1a0933]">André Waldige</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-200/50 px-2.5 py-0.5 rounded-full border border-emerald-400 mt-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Servidor Conectado
              </span>
            </div>
          </div>
        </div>

        {/* Abas Mobile Coloridas */}
        <div className="md:hidden flex border-t border-violet-300/60 bg-[#e4dcff] overflow-x-auto divide-x divide-violet-300/30">
          {CONTAINER_ABAS.map((aba) => {
            const ativo = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                  ativo 
                    ? 'border-fuchsia-600 text-fuchsia-700 bg-white/40' 
                    : 'border-transparent text-violet-800/60'
                }`}
              >
                <span className="block text-sm mb-0.5">{aba.emoji}</span>
                {aba.label.split(' ')[1] || aba.id}
              </button>
            );
          })}
        </div>
      </header>

      {/* Área de Conteúdo Sólido */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:py-10 relative z-10">
        <div className="bg-[#efeaff] rounded-3xl border-2 border-violet-300 shadow-[0_20px_50px_rgba(109,40,217,0.18)] p-6 md:p-10">
          
          {carregandoGeral ? (
            <div className="flex flex-col items-center justify-center py-36 space-y-4">
              <div className="h-10 w-10 border-4 border-violet-300 border-t-fuchsia-600 rounded-full animate-spin"></div>
              <span className="text-xs text-violet-800 font-black tracking-widest uppercase animate-pulse">
                Sincronizando Banco de Dados...
              </span>
            </div>
          ) : (
            <div className="text-[#1a0933] font-medium">
              {abaAtiva === 'agenda' && (
                <Agenda 
                  agendamentos={agendamentos} 
                  profissionais={profissionais} 
                  servicos={servicos} 
                />
              )}
              
              {abaAtiva === 'equipe' && <Equipe profissionais={profissionais} />}
              
              {abaAtiva === 'servicos' && <Servicos servicos={servicos} />}

              {abaAtiva === 'dashboard' && <Dashboard agendamentos={agendamentos} />}
            </div>
          )}
        </div>
      </main>

      {/* Footer Executivo */}
      <footer className="border-t border-violet-300/40 py-6 bg-[#e4dcff]/60 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-violet-800 font-extrabold uppercase tracking-widest">
          <p>© 2026 Beauty Day. Workspace Premium Ativo.</p>
        </div>
      </footer>
    </div>
  );
}

// Lista limpa de abas operacionais (inclui o Dashboard)
const CONTAINER_ABAS = [
  { id: 'agenda', label: '📅 Agenda', emoji: '📅' },
  { id: 'equipe', label: '👥 Equipe', emoji: '👥' },
  { id: 'servicos', label: '✂️ Serviços', emoji: '✂️' },
  { id: 'dashboard', label: '📊 Dashboard', emoji: '📊' },
] as const;

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <PainelExecutivo />
    </QueryClientProvider>
  );
}