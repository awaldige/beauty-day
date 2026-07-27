'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Agendamento, Profissional, Servico } from '@/types';
import { api } from '@/services/api';
import { ConfirmModal } from '@/components/ConfirmModal';

interface AgendaProps {
  agendamentos: Agendamento[];
  profissionais: Profissional[];
  servicos: Servico[];
}

const MAPEAMENTO_CARGO_SERVICO: Record<string, string[]> = {
  cabeleireiro: ['corte', 'escova', 'hidratação', 'coloração', 'mechas', 'progressiva', 'cabelo', 'tintura'],
  barbeiro: ['barba', 'barber', 'combo', 'pigmentação', 'pezinho', 'masculino', 'corte'],
  manicure: ['manicure', 'pedicure', 'mão', 'pé', 'esmaltação', 'unha', 'fibra', 'gel'],
  esteticista: ['sobrancelha', 'henna', 'cílios', 'pele', 'massagem', 'drenagem', 'estética', 'limpeza']
};

export function Agenda({ agendamentos = [], profissionais = [], servicos = [] }: AgendaProps) {
  const queryClient = useQueryClient();
  
  // Estados do Formulário
  const [profissionalId, setProfissionalId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [valor, setValor] = useState('');

  // --- NOVOS FILTROS DE NAVEGAÇÃO E PESQUISA ---
  // Opções de intervalo: 'hoje' | '7dias' | 'mes' | 'todos' | 'custom'
  const [intervaloData, setIntervaloData] = useState<string>('hoje');
  const [filtroDataEspecífica, setFiltroDataEspecifica] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  // Reagendamento e Modais
  const [reagendandoId, setReagendandoId] = useState<string | null>(null);
  const [novaDataHora, setNovaDataHora] = useState('');
  const [idParaCancelar, setIdParaCancelar] = useState<string | null>(null);
  const [idParaConcluir, setIdParaConcluir] = useState<string | null>(null);

  // Data de hoje formatada (YYYY-MM-DD) para comparações
  const dataHojeISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const profissionalSelecionado = useMemo(() => {
    if (!profissionalId) return null;
    return profissionais.find(p => String(p.id) === String(profissionalId) || String((p as any).id_profissional) === String(profissionalId));
  }, [profissionais, profissionalId]);

  const servicoSelecionado = useMemo(() => {
    if (!servicoId) return null;
    return servicos.find(s => String(s.id) === String(servicoId) || String((s as any).id_servico) === String(servicoId));
  }, [servicos, servicoId]);

  const servicosFiltrados = useMemo(() => {
    if (!profissionalSelecionado) return [];
    const cargo = (profissionalSelecionado.cargo || (profissionalSelecionado as any).cargo_profissional || '').toLowerCase();
    const palavrasChave = MAPEAMENTO_CARGO_SERVICO[cargo] || [];

    if (palavrasChave.length === 0) return servicos;

    return servicos.filter(s => {
      const nomeServico = (s.nome || (s as any).nome_servico || '').toLowerCase();
      return palavrasChave.some(chave => nomeServico.includes(chave));
    });
  }, [servicos, profissionalSelecionado]);

  useEffect(() => {
    setServicoId('');
    setValor('');
  }, [profissionalId]);

  const conflitoAgendamento = useMemo(() => {
    if (!profissionalId || !dataHora) return null;

    const inicioNovo = new Date(dataHora).getTime();
    if (isNaN(inicioNovo)) return null;

    const duracaoMinutos = servicoSelecionado?.duracao_minutos 
      ?? (servicoSelecionado as any)?.duracao 
      ?? 30;

    const fimNovo = inicioNovo + duracaoMinutos * 60 * 1000;

    return agendamentos.find(agend => {
      if (agend.status === 'cancelado' || agend.status === 'concluido') return false;
      const mesmoProfissional = String(agend.profissional_id) === String(profissionalId) ||
                                String((agend as any).id_profissional) === String(profissionalId);
      if (!mesmoProfissional) return false;

      const inicioExistente = new Date(agend.data_hora_inicio).getTime();
      const duracaoExistente = (agend as any).duracao_minutos ?? 30;
      const fimExistente = (agend as any).data_hora_fim 
        ? new Date((agend as any).data_hora_fim).getTime() 
        : inicioExistente + duracaoExistente * 60 * 1000;

      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    }) || null;
  }, [profissionalId, dataHora, servicoSelecionado, agendamentos]);

  /* =====================================================
     MUTAÇÕES (CRIAR / CANCELAR / CONCLUIR / REAGENDAR)
  ===================================================== */
  const mutationCriar = useMutation({
    mutationFn: api.criarAgendamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setProfissionalId('');
      setServicoId('');
      setDataHora('');
      setValor('');
      toast.success('Agendamento realizado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar agendamento.')
  });

  const mutationCancelar = useMutation({
    mutationFn: (id: string) => api.cancelarAgendamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setIdParaCancelar(null);
      toast.warning('Agendamento cancelado com sucesso.');
    },
    onError: () => toast.error('Erro ao cancelar agendamento.')
  });

  const mutationConcluir = useMutation({
    mutationFn: (id: string) => api.concluirAgendamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setIdParaConcluir(null);
      toast.success('Atendimento concluído!');
    },
    onError: () => toast.error('Erro ao concluir atendimento.')
  });

  const mutationReagendar = useMutation({
    mutationFn: ({ id, dataHora }: { id: string; dataHora: string }) => api.reagendarAtendimento(id, dataHora),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setReagendandoId(null);
      toast.info('Atendimento reagendado!');
    },
    onError: () => toast.error('Erro ao reagendar atendimento.')
  });

  const handleServicoChange = (id: string) => {
    setServicoId(id);
    const servicoEncontrado = servicos.find(s => String(s.id) === String(id) || String((s as any).id_servico) === String(id));
    if (servicoEncontrado) {
      const precoCalculado = servicoEncontrado.preco ?? (servicoEncontrado as any).valor ?? (servicoEncontrado as any).preco_base ?? 0;
      setValor(String(precoCalculado));
    } else {
      setValor('');
    }
  };

  const handleSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflitoAgendamento) return toast.error('Horário indisponível!');
    if (!profissionalId || !servicoId || !dataHora) return toast.error('Preencha os campos obrigatórios.');

    mutationCriar.mutate({
      profissional_id: profissionalId,
      servico_id: servicoId,
      data_hora_inicio: dataHora,
      valor_cobrado: Number(valor),
      status: 'confirmado'
    });
  };

  /* =====================================================
     LÓGICA DE FILTRAGEM AVANÇADA (HOJE, ANTERIORES, POSTERIORES)
  ===================================================== */
  const agendamentosFiltrados = useMemo(() => {
    const hojeStart = new Date();
    hojeStart.setHours(0, 0, 0, 0);

    const hojeEnd = new Date();
    hojeEnd.setHours(23, 59, 59, 999);

    return agendamentos.filter(agend => {
      const dataAgend = new Date(agend.data_hora_inicio);
      const dataAgendISO = agend.data_hora_inicio.substring(0, 10);

      // 1. Filtro por Período / Intervalo Rápido
      if (filtroDataEspecífica) {
        if (dataAgendISO !== filtroDataEspecífica) return false;
      } else if (intervaloData === 'hoje') {
        if (dataAgendISO !== dataHojeISO) return false;
      } else if (intervaloData === 'proximos') {
        if (dataAgend < hojeStart) return false;
      } else if (intervaloData === 'anteriores') {
        if (dataAgend > hojeEnd) return false;
      }

      // 2. Filtro por Profissional
      if (filtroProfissional) {
        const idProfAgend = String(agend.profissional_id || (agend as any).id_profissional);
        if (idProfAgend !== filtroProfissional) return false;
      }

      // 3. Filtro por Status
      if (filtroStatus !== 'todos' && agend.status !== filtroStatus) {
        return false;
      }

      // 4. Busca por Texto (Profissional, Serviço ou Cliente)
      if (filtroPesquisa) {
        const termo = filtroPesquisa.toLowerCase();
        const prof = (agend.profissional_nome || '').toLowerCase();
        const serv = (agend.servico_nome || '').toLowerCase();
        const cliente = ((agend as any).cliente_nome || '').toLowerCase();

        if (!prof.includes(termo) && !serv.includes(termo) && !cliente.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [agendamentos, intervaloData, filtroDataEspecífica, filtroProfissional, filtroStatus, filtroPesquisa, dataHojeISO]);

  // Ordenação: mais recentes/próximos primeiro
  const agendamentosOrdenados = useMemo(() => {
    return [...agendamentosFiltrados].sort((a, b) => 
      new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
    );
  }, [agendamentosFiltrados]);

  // Paginação
  const totalPaginas = Math.ceil(agendamentosOrdenados.length / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const agendamentosPaginados = agendamentosOrdenados.slice(indiceInicial, indiceInicial + itensPorPagina);

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236d28d9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '16px'
  };

  const limparFiltros = () => {
    setIntervaloData('hoje');
    setFiltroDataEspecifica('');
    setFiltroProfissional('');
    setFiltroStatus('todos');
    setFiltroPesquisa('');
    setPaginaAtual(1);
  };

  return (
    <div className="space-y-10">
      
      {/* Formulário de Novo Agendamento */}
      <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl border border-violet-200/80 shadow-[0_20px_50px_rgba(109,40,217,0.05)]">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600" />
        
        <div className="px-8 py-6 border-b border-violet-200/50 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-fuchsia-50/30">
          <div>
            <h2 className="text-base font-black tracking-tight text-[#1a0933] flex items-center gap-2">
              <span>📅</span> Novo Atendimento
            </h2>
            <p className="text-xs text-violet-800/80 font-semibold mt-0.5">
              Selecione o profissional, serviço e horário desejados.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmeter} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-violet-900 uppercase tracking-widest pl-1">
              👥 Profissional
            </label>
            <select 
              value={profissionalId} 
              onChange={(e) => setProfissionalId(e.target.value)} 
              required
              style={selectStyle}
              className="w-full h-14 px-4 text-sm font-bold border-2 border-violet-100 rounded-2xl bg-white text-[#1a0933] focus:outline-none focus:border-violet-500 transition-all cursor-pointer shadow-inner appearance-none"
            >
              <option value="">Selecione o profissional...</option>
              {profissionais.map(p => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.nome} ({p.cargo})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-violet-900 uppercase tracking-widest pl-1">
              ✂️ Serviço Compatível
            </label>
            <select 
              value={servicoId} 
              onChange={(e) => handleServicoChange(e.target.value)} 
              required
              disabled={!profissionalId}
              style={selectStyle}
              className="w-full h-14 px-4 text-sm font-bold border-2 border-violet-100 rounded-2xl bg-white text-[#1a0933] focus:outline-none focus:border-violet-500 transition-all cursor-pointer shadow-inner appearance-none disabled:bg-gray-100/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!profissionalId ? 'Escolha o profissional primeiro...' : 'Selecione o serviço...'}
              </option>
              {servicosFiltrados.map(s => {
                const precoItem = s.preco ?? (s as any).valor ?? (s as any).preco_base ?? 0;
                return (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.nome || (s as any).nome_servico} (R$ {Number(precoItem).toFixed(2)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2 relative">
            <label className="block text-[10px] font-black text-violet-900 uppercase tracking-widest pl-1">
              ⏱️ Data & Hora
            </label>
            <input 
              type="datetime-local" 
              value={dataHora} 
              onChange={(e) => setDataHora(e.target.value)} 
              required
              className={`w-full h-14 px-4 text-sm font-bold border-2 rounded-2xl bg-white text-[#1a0933] focus:outline-none transition-all cursor-pointer shadow-inner appearance-none ${
                conflitoAgendamento 
                  ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500' 
                  : 'border-violet-100 focus:border-violet-500'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-violet-900 uppercase tracking-widest pl-1">
              💰 Valor Cobrado
            </label>
            <div className="relative flex items-center rounded-2xl border-2 border-violet-100 bg-white focus-within:border-violet-500 transition-all shadow-inner overflow-hidden">
              <div className="flex items-center justify-center bg-violet-50 text-violet-700 font-black text-xs px-5 h-14 border-r-2 border-violet-100 select-none shrink-0">
                R$
              </div>
              <input 
                type="number" 
                step="0.01" 
                value={valor} 
                onChange={(e) => setValor(e.target.value)} 
                required 
                placeholder="0,00"
                className="w-full h-14 px-4 bg-transparent text-sm font-black text-[#1a0933] focus:outline-none appearance-none antialiased"
              />
            </div>
          </div>

          <div className="pt-2 md:col-span-2 lg:col-span-1">
            <button 
              type="submit" 
              disabled={mutationCriar.isPending || !!conflitoAgendamento}
              className={`w-full h-14 text-xs font-black rounded-2xl shadow-lg transition-all active:scale-[0.99] uppercase tracking-widest flex items-center justify-center gap-2 ${
                conflitoAgendamento
                  ? 'bg-rose-500 text-white cursor-not-allowed opacity-80 shadow-rose-500/10'
                  : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 text-white shadow-indigo-600/20 disabled:opacity-60'
              }`}
            >
              {mutationCriar.isPending ? 'Agendando...' : conflitoAgendamento ? '⚠️ Conflito' : '🚀 Confirmar'}
            </button>
          </div>
        </form>

        {conflitoAgendamento && (
          <div className="px-8 pb-6 -mt-2">
            <div className="p-4 bg-rose-100/80 border border-rose-300 rounded-2xl flex items-center gap-3 text-rose-900 text-xs font-bold shadow-sm">
              <span className="text-base">🚨</span>
              <div>
                <strong>Conflito detectado:</strong> {conflitoAgendamento.profissional_nome} já possui atendimento marcado neste horário.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAINEL DE CONTROLE DE BUSCA E FILTROS */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-violet-200/70 shadow-[0_10px_30px_rgba(109,40,217,0.03)] space-y-4">
        
        {/* Linha 1: Botões de Filtro Rápido de Período */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase text-violet-900 tracking-wider mr-1">Visualização:</span>
            
            <button
              type="button"
              onClick={() => { setIntervaloData('hoje'); setFiltroDataEspecifica(''); setPaginaAtual(1); }}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                intervaloData === 'hoje' && !filtroDataEspecífica
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-violet-100/70 text-violet-800 hover:bg-violet-200/80'
              }`}
            >
              <span>📌</span> Apenas Hoje
            </button>

            <button
              type="button"
              onClick={() => { setIntervaloData('proximos'); setFiltroDataEspecifica(''); setPaginaAtual(1); }}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                intervaloData === 'proximos' && !filtroDataEspecífica
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-violet-100/70 text-violet-800 hover:bg-violet-200/80'
              }`}
            >
              <span>⏩</span> Próximos
            </button>

            <button
              type="button"
              onClick={() => { setIntervaloData('anteriores'); setFiltroDataEspecifica(''); setPaginaAtual(1); }}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                intervaloData === 'anteriores' && !filtroDataEspecífica
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-violet-100/70 text-violet-800 hover:bg-violet-200/80'
              }`}
            >
              <span>⏪</span> Histórico Antigo
            </button>

            <button
              type="button"
              onClick={() => { setIntervaloData('todos'); setFiltroDataEspecifica(''); setPaginaAtual(1); }}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                intervaloData === 'todos' && !filtroDataEspecífica
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-violet-100/70 text-violet-800 hover:bg-violet-200/80'
              }`}
            >
              <span>🌐</span> Ver Todos
            </button>
          </div>

          {/* Quantidade encontrada */}
          <div className="text-xs font-bold text-violet-900 bg-violet-100/60 px-3 py-1.5 rounded-xl">
            Total: <strong className="text-violet-950 font-black">{agendamentosFiltrados.length}</strong> agendamentos
          </div>
        </div>

        {/* Linha 2: Campos de Busca Específica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Busca por Nome/Serviço */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar profissional, serviço ou cliente..." 
              value={filtroPesquisa}
              onChange={(e) => { setFiltroPesquisa(e.target.value); setPaginaAtual(1); }}
              className="w-full h-11 px-4 pl-9 text-xs border-2 border-violet-100 rounded-xl bg-white text-[#1a0933] placeholder-violet-300 font-bold focus:outline-none focus:border-violet-400 transition-all shadow-inner"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔍</span>
          </div>

          {/* Filtro por Profissional */}
          <select
            value={filtroProfissional}
            onChange={(e) => { setFiltroProfissional(e.target.value); setPaginaAtual(1); }}
            style={selectStyle}
            className="h-11 px-4 pr-9 text-xs font-bold border-2 border-violet-100 rounded-xl bg-white text-[#1a0933] focus:outline-none focus:border-violet-400 transition-all cursor-pointer shadow-inner appearance-none"
          >
            <option value="">Todos os Profissionais</option>
            {profissionais.map(p => (
              <option key={String(p.id)} value={String(p.id)}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={filtroStatus}
            onChange={(e) => { setFiltroStatus(e.target.value); setPaginaAtual(1); }}
            style={selectStyle}
            className="h-11 px-4 pr-9 text-xs font-bold border-2 border-violet-100 rounded-xl bg-white text-[#1a0933] focus:outline-none focus:border-violet-400 transition-all cursor-pointer shadow-inner appearance-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
            <option value="cancelado">Cancelados</option>
          </select>

          {/* Data Específica */}
          <input 
            type="date"
            value={filtroDataEspecífica}
            onChange={(e) => { 
              setFiltroDataEspecifica(e.target.value); 
              setIntervaloData('custom');
              setPaginaAtual(1); 
            }}
            className="h-11 px-4 text-xs font-bold border-2 border-violet-100 rounded-xl bg-white text-[#1a0933] focus:outline-none focus:border-violet-400 transition-all cursor-pointer shadow-inner"
          />
        </div>

        {/* Botão de Limpar Filtros quando houver busca ativa */}
        {(filtroPesquisa || filtroProfissional || filtroStatus !== 'todos' || filtroDataEspecífica || intervaloData !== 'hoje') && (
          <div className="flex justify-end pt-1">
            <button 
              type="button"
              onClick={limparFiltros}
              className="text-[11px] font-black text-rose-700 hover:text-rose-800 bg-rose-100/70 hover:bg-rose-200/80 px-4 py-1.5 rounded-xl transition-all border border-rose-200 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>✨</span> Resetar para Filtro Padrão (Hoje)
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Agendamentos */}
      <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-violet-200/60 shadow-[0_20px_50px_rgba(109,40,217,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-violet-200/40 text-left text-xs text-[#1a0933]">
            <thead className="bg-[#e9e3ff]/50 text-[10px] uppercase font-black text-violet-800 tracking-widest border-b border-violet-200/40">
              <tr>
                <th className="px-6 py-5">Profissional</th>
                <th className="px-6 py-5">Serviço</th>
                <th className="px-6 py-5">Data & Horário</th>
                <th className="px-6 py-5">Valor</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 bg-white/30">
              {agendamentosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-violet-800/70 font-bold">
                    🔍 Nenhum agendamento encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                agendamentosPaginados.map((agend) => (
                  <tr 
                    key={agend.id} 
                    className={`hover:bg-violet-100/40 transition-colors group ${
                      agend.status === 'cancelado' ? 'opacity-50 bg-rose-50/5' : 
                      agend.status === 'concluido' ? 'bg-emerald-50/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4.5 font-black text-[#1a0933]">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm">
                          {agend.profissional_nome?.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{agend.profissional_nome}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4.5">
                      <span className="font-black text-xs text-[#1a0933] bg-violet-100/80 px-3 py-1.5 rounded-xl border border-violet-200/50 uppercase tracking-wide">
                        {agend.servico_nome}
                      </span>
                    </td>

                    <td className="px-6 py-4.5 font-bold text-violet-900">
                      {reagendandoId === agend.id ? (
                        <input 
                          type="datetime-local" 
                          value={novaDataHora} 
                          onChange={(e) => setNovaDataHora(e.target.value)}
                          className="h-9 px-3 text-xs text-[#1a0933] bg-white border-2 border-violet-200 rounded-xl focus:outline-none focus:border-violet-500 font-bold transition-all"
                        />
                      ) : (
                        <span className="font-mono bg-violet-50/60 px-2.5 py-1 rounded-lg border border-violet-100">
                          {new Date(agend.data_hora_inicio).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4.5 font-black text-[#1a0933] text-sm tracking-tight">
                      R$ {Number(agend.valor_cobrado || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 ${
                        agend.status === 'concluido' ? 'bg-sky-50 text-sky-800 border-sky-400/30' :
                        agend.status === 'confirmado' ? 'bg-emerald-50 text-emerald-800 border-emerald-400/20' :
                        agend.status === 'cancelado' ? 'bg-rose-50 text-rose-800 border-rose-400/20' :
                        'bg-amber-50 text-amber-800 border-amber-400/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          agend.status === 'concluido' ? 'bg-sky-500' :
                          agend.status === 'confirmado' ? 'bg-emerald-500 animate-pulse' :
                          agend.status === 'cancelado' ? 'bg-rose-500' :
                          'bg-amber-500 animate-pulse'
                        }`} />
                        {agend.status}
                      </span>
                    </td>

                    <td className="px-6 py-4.5 text-right">
                      <div className="flex justify-end gap-2">
                        {agend.status !== 'cancelado' && agend.status !== 'concluido' && (
                          reagendandoId === agend.id ? (
                            <div className="flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => mutationReagendar.mutate({ id: agend.id, dataHora: novaDataHora })}
                                disabled={mutationReagendar.isPending}
                                className="text-[10px] text-white font-black bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 rounded-xl hover:opacity-95 uppercase tracking-wider"
                              >
                                Salvar
                              </button>
                              <button 
                                type="button"
                                onClick={() => setReagendandoId(null)}
                                className="text-[10px] text-violet-800 font-black bg-violet-100 border px-3.5 py-2 rounded-xl uppercase tracking-wider"
                              >
                                Sair
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                type="button"
                                onClick={() => setIdParaConcluir(agend.id)}
                                disabled={mutationConcluir.isPending}
                                className="text-[10px] text-emerald-900 font-black bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl border border-emerald-300/40 uppercase tracking-wider"
                              >
                                ✓ Concluir
                              </button>

                              <button 
                                type="button"
                                onClick={() => { 
                                  setReagendandoId(agend.id); 
                                  setNovaDataHora(agend.data_hora_inicio ? agend.data_hora_inicio.slice(0, 16) : ''); 
                                }}
                                className="text-[10px] text-violet-900 font-black bg-violet-200/60 hover:bg-violet-200 px-3 py-2 rounded-xl border border-violet-300/40 uppercase tracking-wider"
                              >
                                Reagendar
                              </button>

                              <button 
                                type="button"
                                onClick={() => setIdParaCancelar(agend.id)}
                                disabled={mutationCancelar.isPending}
                                className="text-[10px] text-rose-800 font-black bg-rose-100 hover:bg-rose-200 px-3 py-2 rounded-xl border border-rose-300/40 uppercase tracking-wider"
                              >
                                Cancelar
                              </button>
                            </>
                          )
                        )}

                        {agend.status === 'concluido' && (
                          <span className="text-[10px] font-bold text-sky-700/80 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200/50">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="px-6 py-5 border-t border-violet-200/40 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-fuchsia-50/30">
            <span className="text-xs text-violet-800 font-bold">
              Página <strong className="text-[#1a0933]">{paginaAtual}</strong> de <strong className="text-[#1a0933]">{totalPaginas}</strong>
            </span>
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                className="px-4 py-2 text-xs font-black border-2 border-violet-100 rounded-xl bg-white text-violet-800 disabled:opacity-40"
              >
                Anterior
              </button>
              <button 
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                className="px-4 py-2 text-xs font-black border-2 border-violet-100 rounded-xl bg-white text-violet-800 disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais de Confirmação */}
      <ConfirmModal
        isOpen={Boolean(idParaCancelar)}
        title="Cancelar Agendamento"
        description="Tem certeza de que deseja cancelar este atendimento? O horário será liberado."
        confirmText="Sim, Cancelar"
        cancelText="Voltar"
        variant="danger"
        isLoading={mutationCancelar.isPending}
        onCancel={() => setIdParaCancelar(null)}
        onConfirm={() => idParaCancelar && mutationCancelar.mutate(idParaCancelar)}
      />

      <ConfirmModal
        isOpen={Boolean(idParaConcluir)}
        title="Concluir Atendimento"
        description="Deseja marcar este atendimento como concluído?"
        confirmText="Confirmar Conclusão"
        cancelText="Voltar"
        variant="info"
        isLoading={mutationConcluir.isPending}
        onCancel={() => setIdParaConcluir(null)}
        onConfirm={() => idParaConcluir && mutationConcluir.mutate(idParaConcluir)}
      />

    </div>
  );
}