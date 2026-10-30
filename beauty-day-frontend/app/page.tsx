'use client';

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/services/api';
import { Agenda } from '@/components/Agenda';
import { Equipe } from '@/components/Equipe';
import { Servicos } from '@/components/Servicos';
import { Dashboard } from '@/components/Dashboard';

type AbaAtiva = 'agenda' | 'equipe' | 'servicos' | 'dashboard';

const ABAS = [
  {
    id: 'agenda',
    label: 'Agenda',
    descricao: 'Agendamentos',
    emoji: '📅',
  },
  {
    id: 'equipe',
    label: 'Equipe',
    descricao: 'Profissionais',
    emoji: '👥',
  },
  {
    id: 'servicos',
    label: 'Serviços',
    descricao: 'Catálogo',
    emoji: '✂️',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    descricao: 'Visão geral',
    emoji: '📊',
  },
] as const;

function PainelExecutivo() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('agenda');

  const {
    data: agendamentosBrutos = [],
    isLoading: carregandoAgendamentos,
  } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () =>
      (api as any).getAgendamentos?.() ??
      (api as any).buscarAgendamentos?.() ??
      Promise.resolve([]),
  });

  const {
    data: profissionaisBrutos = [],
    isLoading: carregandoProfissionais,
  } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () =>
      (api as any).getProfissionais?.() ??
      (api as any).buscarProfissionais?.() ??
      Promise.resolve([]),
  });

  const {
    data: servicosBrutos = [],
    isLoading: carregandoServicos,
  } = useQuery({
    queryKey: ['servicos'],
    queryFn: () =>
      (api as any).getServicos?.() ??
      (api as any).buscarServicos?.() ??
      Promise.resolve([]),
  });

  const agendamentos = Array.isArray(agendamentosBrutos)
    ? agendamentosBrutos
    : (agendamentosBrutos as any)?.data ??
      (agendamentosBrutos as any)?.agendamentos ??
      [];

  const profissionais = Array.isArray(profissionaisBrutos)
    ? profissionaisBrutos
    : (profissionaisBrutos as any)?.data ??
      (profissionaisBrutos as any)?.profissionais ??
      [];

  const servicos = Array.isArray(servicosBrutos)
    ? servicosBrutos
    : (servicosBrutos as any)?.data ??
      (servicosBrutos as any)?.servicos ??
      [];

  const carregandoGeral =
    carregandoAgendamentos ||
    carregandoProfissionais ||
    carregandoServicos;

  const abaSelecionada = ABAS.find(
    (aba) => aba.id === abaAtiva,
  );

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#33272d] antialiased">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-50 border-b border-[#eee4e6] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          {/* Marca */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b76e79] to-[#865064] text-xl text-white shadow-lg shadow-[#b76e79]/20">
              ✦
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-[#33272d] sm:text-xl">
                Beauty <span className="text-[#b76e79]">Day</span>
              </h1>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99858d] sm:text-[11px]">
                Gestão de beleza
              </p>
            </div>
          </div>

          {/* Identificação */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#493840]">
                André Waldige
              </p>

              <p className="mt-1 text-xs text-[#9a858d]">
                Painel administrativo
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7dc] bg-[#f7e9ed] text-sm font-bold text-[#965b6d]">
              AW
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px] flex-col lg:flex-row">
        {/* Navegação lateral desktop */}
        <aside className="hidden w-[250px] shrink-0 border-r border-[#eee4e6] bg-white px-5 py-8 lg:block">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a18c94]">
            Menu principal
          </p>

          <nav className="space-y-2">
            {ABAS.map((aba) => {
              const ativo = abaAtiva === aba.id;

              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaAtiva(aba.id)}
                  aria-current={ativo ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3.5 text-left transition-all duration-200 ${
                    ativo
                      ? 'border-[#f0dce2] bg-[#fbf0f3] text-[#98586b] shadow-sm'
                      : 'border-transparent text-[#77666d] hover:border-[#f0e6e8] hover:bg-[#fcf8f9] hover:text-[#98586b]'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-colors ${
                      ativo
                        ? 'bg-white shadow-sm'
                        : 'bg-[#faf6f7] group-hover:bg-white'
                    }`}
                  >
                    {aba.emoji}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {aba.label}
                    </span>

                    <span
                      className={`mt-1 block text-xs ${
                        ativo ? 'text-[#b47b8a]' : 'text-[#aa999f]'
                      }`}
                    >
                      {aba.descricao}
                    </span>
                  </span>

                  {ativo && (
                    <span className="h-2 w-2 rounded-full bg-[#b76e79]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-[#f0e3e6] bg-gradient-to-br from-[#fcf5f6] to-[#f8edef] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
              ✨
            </div>

            <p className="text-sm font-semibold text-[#694955]">
              Beauty Day
            </p>

            <p className="mt-2 text-xs leading-5 text-[#9a7e89]">
              Organização e cuidado em cada detalhe do seu negócio.
            </p>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {/* Título da página */}
          <section className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b76e79]">
                Beauty Day / Gestão
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-[#382a31] sm:text-3xl">
                {abaSelecionada?.label}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#8d7b82]">
                {abaAtiva === 'agenda' &&
                  'Organize os horários e acompanhe os agendamentos.'}

                {abaAtiva === 'equipe' &&
                  'Gerencie os profissionais e organize sua equipe.'}

                {abaAtiva === 'servicos' &&
                  'Consulte e gerencie os serviços oferecidos.'}

                {abaAtiva === 'dashboard' &&
                  'Acompanhe os indicadores e a visão geral do negócio.'}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dcece2] bg-white px-3.5 py-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>

              <span className="text-xs font-medium text-[#537c62]">
                Painel ativo
              </span>
            </div>
          </section>

          {/* Navegação mobile e tablet */}
          <nav className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
            {ABAS.map((aba) => {
              const ativo = abaAtiva === aba.id;

              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaAtiva(aba.id)}
                  aria-current={ativo ? 'page' : undefined}
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
                    ativo
                      ? 'border-[#e9cbd3] bg-[#fbecf0] text-[#98586b] shadow-sm'
                      : 'border-[#eee4e6] bg-white text-[#85727a] hover:border-[#e9cbd3]'
                  }`}
                >
                  <span className="text-lg">{aba.emoji}</span>

                  <span className="text-xs font-semibold">
                    {aba.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Área de conteúdo */}
          <section className="min-w-0 rounded-2xl border border-[#eee4e6] bg-white p-4 shadow-[0_8px_30px_rgba(76,45,57,0.035)] sm:rounded-3xl sm:p-6 lg:p-8">
            {carregandoGeral ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#f0dce2] border-t-[#b76e79]" />

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a17b88]">
                  Carregando informações
                </p>

                <p className="text-sm text-[#a18c94]">
                  Aguarde enquanto buscamos os dados.
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                {abaAtiva === 'agenda' && (
                  <Agenda
                    agendamentos={agendamentos}
                    profissionais={profissionais}
                    servicos={servicos}
                  />
                )}

                {abaAtiva === 'equipe' && (
                  <Equipe profissionais={profissionais} />
                )}

                {abaAtiva === 'servicos' && (
                  <Servicos servicos={servicos} />
                )}

               {abaAtiva === 'dashboard' && (
               <Dashboard
               agendamentos={agendamentos}
               servicos={servicos}
              />
              )}
              </div>
            )}
          </section>

          {/* Rodapé */}
          <footer className="mt-8 flex flex-col gap-2 border-t border-[#eee4e6] pt-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-[#a18c94]">
              © {new Date().getFullYear()} Beauty Day
            </p>

            <p className="text-xs text-[#a18c94]">
              Desenvolvido por{' '}
              <span className="font-semibold text-[#98586b]">
                AW TECHNOLOGY
              </span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PainelExecutivo />
    </QueryClientProvider>
  );
}