
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Agendamento } from '@/types';

interface Servico {
  id: string;
  nome: string;
}

interface DashboardProps {
  agendamentos: Agendamento[];
  servicos?: Servico[];
}

interface DesempenhoServico {
  nome: string;
  reservas: number;
  concluidos: number;
  faturamento: number;
}

type Periodo = 'hoje' | '7dias' | 'mes' | 'mensal' | 'todo';

const SENHA_MASTER = '1234';
const CHAVE_SESSAO = 'beautyday_admin_auth';

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: '7dias', label: 'Últimos 7 dias' },
  { valor: 'mes', label: 'Este mês' },
  { valor: 'mensal', label: 'Mês a mês' },
  { valor: 'todo', label: 'Todo o período' },
];

function normalizarStatus(status: string | undefined): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

function ehConcluido(agendamento: Agendamento): boolean {
  const status = normalizarStatus(agendamento.status);

  return status === 'concluido' || status === 'concluído';
}

function ehCancelado(agendamento: Agendamento): boolean {
  return normalizarStatus(agendamento.status) === 'cancelado';
}

function formatarMoeda(valor: number): string {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function inicioDoDia(data: Date): Date {
  const resultado = new Date(data);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function fimDoDia(data: Date): Date {
  const resultado = new Date(data);
  resultado.setHours(23, 59, 59, 999);
  return resultado;
}

function chaveData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarDataCurta(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatarDataCompleta(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function obterNomeServico(
  agendamento: Agendamento,
  servicos: Servico[],
): string {
  if (agendamento.servico_nome?.trim()) {
    return agendamento.servico_nome;
  }

  const servico = servicos.find(
    (item) => String(item.id) === String(agendamento.servico_id),
  );

  return servico?.nome ?? 'Serviço não identificado';
}

function obterLimitesPeriodo(
  periodo: Periodo,
  hoje: Date,
  mesSelecionado: string,
) {
  const inicioHoje = inicioDoDia(hoje);
  const fimHoje = fimDoDia(hoje);

  if (periodo === 'hoje') {
    return {
      inicio: inicioHoje,
      fim: fimHoje,
    };
  }

  if (periodo === '7dias') {
    const inicio = new Date(inicioHoje);
    inicio.setDate(inicio.getDate() - 6);

    return {
      inicio,
      fim: fimHoje,
    };
  }

  if (periodo === 'mes') {
    return {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fim: new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    };
  }

  if (periodo === 'mensal') {
    const [ano, mes] = mesSelecionado.split('-').map(Number);

    if (!ano || !mes || mes < 1 || mes > 12) {
      return null;
    }

    return {
      inicio: new Date(ano, mes - 1, 1),
      fim: new Date(ano, mes, 0, 23, 59, 59, 999),
    };
  }

  return null;
}

function formatarMesSelecionado(mesSelecionado: string): string {
  const [ano, mes] = mesSelecionado.split('-').map(Number);

  if (!ano || !mes || mes < 1 || mes > 12) {
    return '';
  }

  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

export function Dashboard({
  agendamentos,
  servicos,
}: DashboardProps) {
  // =========================================================
  // AUTENTICAÇÃO ADMINISTRATIVA
  // =========================================================

  const [autenticado, setAutenticado] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    try {
      setAutenticado(
        sessionStorage.getItem(CHAVE_SESSAO) === 'true',
      );
    } catch {
      setAutenticado(false);
    } finally {
      setVerificandoSessao(false);
    }
  }, []);

  function validarPin() {
    if (pin === SENHA_MASTER) {
      try {
        sessionStorage.setItem(CHAVE_SESSAO, 'true');
      } catch {
        // O acesso continua disponível durante esta montagem.
      }

      setAutenticado(true);
      setErro('');
      setPin('');
      return;
    }

    setErro('Senha incorreta. Tente novamente.');
    setPin('');
  }

  function sair() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // A interface também será bloqueada pelo estado local.
    }

    setAutenticado(false);
    setPin('');
    setErro('');
  }

  // =========================================================
  // FILTROS
  // =========================================================

  const [periodo, setPeriodo] = useState<Periodo>('todo');

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');

    return `${ano}-${mes}`;
  });

  const listaAgendamentos = Array.isArray(agendamentos)
    ? agendamentos
    : [];

  const listaServicos = Array.isArray(servicos)
    ? servicos
    : [];

  const hoje = useMemo(() => new Date(), []);

  const limitesPeriodo = useMemo(
    () => obterLimitesPeriodo(periodo, new Date(), mesSelecionado),
    [periodo, mesSelecionado],
  );

  const agendamentosFiltrados = useMemo(() => {
    if (!limitesPeriodo) {
      return listaAgendamentos;
    }

    return listaAgendamentos.filter((agendamento) => {
      const data = new Date(agendamento.data_hora_inicio);

      if (Number.isNaN(data.getTime())) {
        return false;
      }

      return (
        data >= limitesPeriodo.inicio &&
        data <= limitesPeriodo.fim
      );
    });
  }, [listaAgendamentos, limitesPeriodo]);

  // =========================================================
  // INDICADORES FINANCEIROS E OPERACIONAIS
  // =========================================================

  const concluidos = agendamentosFiltrados.filter(ehConcluido).length;

  const confirmados = agendamentosFiltrados.filter(
    (agendamento) =>
      normalizarStatus(agendamento.status) === 'confirmado',
  ).length;

  const pendentes = agendamentosFiltrados.filter(
    (agendamento) =>
      normalizarStatus(agendamento.status) === 'pendente',
  ).length;

  const cancelados = agendamentosFiltrados.filter(ehCancelado).length;

  const totalAtendimentos = agendamentosFiltrados.length;

  const totalFaturamento = agendamentosFiltrados
    .filter(ehConcluido)
    .reduce(
      (total, agendamento) =>
        total + Number(agendamento.valor_cobrado || 0),
      0,
    );

  const agendamentosNaoCancelados = agendamentosFiltrados.filter(
    (agendamento) => !ehCancelado(agendamento),
  ).length;

  const totalNaoCancelados = agendamentosNaoCancelados;

  const taxaConclusao =
    totalNaoCancelados > 0
      ? (concluidos / totalNaoCancelados) * 100
      : 0;

  const taxaCancelamento =
    totalAtendimentos > 0
      ? (cancelados / totalAtendimentos) * 100
      : 0;

  // =========================================================
  // DESEMPENHO DOS SERVIÇOS
  // =========================================================

  const mapaServicos = useMemo(() => {
    const mapa = new Map<string, DesempenhoServico>();

    agendamentosFiltrados.forEach((agendamento) => {
      if (ehCancelado(agendamento)) {
        return;
      }

      const nome = obterNomeServico(agendamento, listaServicos);

      if (!mapa.has(nome)) {
        mapa.set(nome, {
          nome,
          reservas: 0,
          concluidos: 0,
          faturamento: 0,
        });
      }

      const desempenho = mapa.get(nome)!;

      desempenho.reservas += 1;

      if (ehConcluido(agendamento)) {
        desempenho.concluidos += 1;
        desempenho.faturamento += Number(
          agendamento.valor_cobrado || 0,
        );
      }
    });

    return mapa;
  }, [agendamentosFiltrados, listaServicos]);

  const rankingServicos = useMemo(
    () =>
      Array.from(mapaServicos.values())
        .sort(
          (a, b) =>
            b.reservas - a.reservas ||
            b.concluidos - a.concluidos ||
            b.faturamento - a.faturamento ||
            a.nome.localeCompare(b.nome, 'pt-BR'),
        )
        .slice(0, 5),
    [mapaServicos],
  );

  const servicoMaisProcurado = rankingServicos[0] ?? null;

  // Mantém a contagem do catálogo independente do período.
  const totalServicosCadastrados = listaServicos.length;

  // =========================================================
  // GRÁFICO DE EVOLUÇÃO DO FATURAMENTO
  // =========================================================

  const dadosGrafico = useMemo(() => {
    const faturamentoPorData = new Map<string, number>();

    agendamentosFiltrados
      .filter(ehConcluido)
      .forEach((agendamento) => {
        const data = new Date(agendamento.data_hora_inicio);

        if (Number.isNaN(data.getTime())) {
          return;
        }

        const chave = chaveData(data);

        faturamentoPorData.set(
          chave,
          (faturamentoPorData.get(chave) ?? 0) +
            Number(agendamento.valor_cobrado || 0),
        );
      });

    const datas: Date[] = [];

    if (periodo === 'hoje') {
      datas.push(inicioDoDia(new Date()));
    } else if (periodo === '7dias') {
      const inicio = inicioDoDia(new Date());
      inicio.setDate(inicio.getDate() - 6);

      for (let i = 0; i < 7; i += 1) {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + i);
        datas.push(data);
      }
    } else if (periodo === 'mes') {
      const agora = new Date();

      const primeiroDia = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1,
      );

      const quantidadeDias = new Date(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0,
      ).getDate();

      for (let dia = 1; dia <= quantidadeDias; dia += 1) {
        datas.push(
          new Date(
            primeiroDia.getFullYear(),
            primeiroDia.getMonth(),
            dia,
          ),
        );
      }
    } else if (periodo === 'mensal') {
      const [ano, mes] = mesSelecionado.split('-').map(Number);

      const primeiroDia = new Date(ano, mes - 1, 1);

      const quantidadeDias = new Date(
        ano,
        mes,
        0,
      ).getDate();

      for (let dia = 1; dia <= quantidadeDias; dia += 1) {
        datas.push(
          new Date(
            primeiroDia.getFullYear(),
            primeiroDia.getMonth(),
            dia,
          ),
        );
      }
    } else {
      const chavesExistentes = Array.from(
        faturamentoPorData.keys(),
      ).sort();

      chavesExistentes.forEach((chave) => {
        const [ano, mes, dia] = chave.split('-').map(Number);
        datas.push(new Date(ano, mes - 1, dia));
      });
    }

    return datas.map((data) => ({
      chave: chaveData(data),
      data,
      valor: faturamentoPorData.get(chaveData(data)) ?? 0,
    }));
  }, [agendamentosFiltrados, periodo, mesSelecionado]);

  const maiorValorGrafico = Math.max(
    ...dadosGrafico.map((item) => item.valor),
    0,
  );

  // =========================================================
  // TELA DE CARREGAMENTO E ACESSO
  // =========================================================

  if (verificandoSessao) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="text-sm font-semibold text-violet-800">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-violet-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-3xl text-white shadow-lg">
              🔐
            </div>

            <h1 className="text-2xl font-black text-violet-950">
              Acesso administrativo
            </h1>

            <p className="mt-2 text-sm text-violet-700">
              Informe a senha master para acessar o painel.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              validarPin();
            }}
            className="space-y-4"
          >
            <label
              htmlFor="pin-master"
              className="block text-sm font-bold text-violet-950"
            >
              Senha de acesso
            </label>

            <input
              id="pin-master"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErro('');
              }}
              placeholder="Digite a senha"
              className="w-full rounded-xl border border-violet-200 px-4 py-3 text-center text-lg tracking-[0.4em] text-violet-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              required
            />

            {erro && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.99]"
            >
              Entrar no painel
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-violet-500">
            Beauty Day · Área administrativa
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAINEL PRINCIPAL
  // =========================================================

  return (
    <div className="space-y-8 pb-10">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-violet-800 via-violet-700 to-fuchsia-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            Beauty Day
          </p>

          <h1 className="text-2xl font-black md:text-3xl">
            Painel Financeiro &amp; Operacional
          </h1>

          <p className="mt-2 text-sm text-violet-100">
            Acompanhe os resultados e o desempenho dos serviços.
          </p>
        </div>

        <button
          type="button"
          onClick={sair}
          className="shrink-0 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
        >
          Encerrar Sessão Master
        </button>
      </header>

      {/* Filtros de período */}
      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-black text-violet-950">
            Período de análise
          </h2>

          <p className="mt-1 text-sm text-violet-600">
            Selecione o intervalo para atualizar os indicadores e o ranking.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((item) => {
            const selecionado = periodo === item.valor;

            return (
              <button
                key={item.valor}
                type="button"
                onClick={() => setPeriodo(item.valor)}
                aria-pressed={selecionado}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  selecionado
                    ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                    : 'border-violet-200 bg-white text-violet-800 hover:border-violet-400 hover:bg-violet-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {periodo === 'mensal' && (
          <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <label
              htmlFor="mes-analise"
              className="mb-2 block text-sm font-bold text-violet-950"
            >
              Selecione o mês e o ano
            </label>

            <input
              id="mes-analise"
              type="month"
              value={mesSelecionado}
              onChange={(e) => {
                if (e.target.value) {
                  setMesSelecionado(e.target.value);
                }
              }}
              max={`${new Date().getFullYear()}-${String(
                new Date().getMonth() + 1,
              ).padStart(2, '0')}`}
              className="w-full max-w-xs rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />

            <p className="mt-2 text-xs text-violet-600">
              Escolha um mês para consultar o faturamento e os indicadores daquele período.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-violet-500">
          {periodo === 'hoje' &&
            `Data: ${formatarDataCompleta(hoje)}`}

          {periodo === '7dias' &&
            'Exibindo hoje e os seis dias anteriores.'}

          {periodo === 'mes' &&
            'Exibindo os agendamentos do mês atual.'}

          {periodo === 'mensal' &&
            `Exibindo os resultados de ${formatarMesSelecionado(mesSelecionado)}.`}

          {periodo === 'todo' &&
            'Exibindo todo o histórico disponível.'}
        </p>
      </section>

      {/* Indicadores principais */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-violet-950">
            Visão geral
          </h2>

          <p className="mt-1 text-sm text-violet-600">
            Indicadores do período selecionado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800">
                Faturamento
              </span>
              <span className="text-2xl">💰</span>
            </div>

            <p className="mt-4 break-words text-2xl font-black text-emerald-700">
              {formatarMoeda(totalFaturamento)}
            </p>

            <p className="mt-2 text-xs text-emerald-700/70">
              Apenas atendimentos concluídos
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-violet-800">
                Total de agendamentos
              </span>
              <span className="text-2xl">📅</span>
            </div>

            <p className="mt-4 text-3xl font-black text-violet-950">
              {totalAtendimentos}
            </p>

            <p className="mt-2 text-xs text-violet-600">
              Registros no período
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-800">
                Taxa de conclusão
              </span>
              <span className="text-2xl">✅</span>
            </div>

            <p className="mt-4 text-3xl font-black text-sky-700">
              {taxaConclusao.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}
              %
            </p>

            <p className="mt-2 text-xs text-sky-700/70">
              Sobre os não cancelados
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-800">
                Cancelamentos
              </span>
              <span className="text-2xl">❌</span>
            </div>

            <p className="mt-4 text-3xl font-black text-rose-700">
              {cancelados}
            </p>

            <p className="mt-2 text-xs text-rose-700/70">
              {taxaCancelamento.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}
              % dos agendamentos
            </p>
          </div>
        </div>
      </section>

      {/* Status dos agendamentos */}
      <section>
        <h2 className="mb-4 text-xl font-black text-violet-950">
          Situação dos atendimentos
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-800">
              Concluídos
            </p>
            <p className="mt-2 text-3xl font-black text-sky-900">
              {concluidos}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Confirmados
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {confirmados}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Pendentes
            </p>
            <p className="mt-2 text-3xl font-black text-amber-900">
              {pendentes}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">
              Cancelados
            </p>
            <p className="mt-2 text-3xl font-black text-rose-900">
              {cancelados}
            </p>
          </div>
        </div>
      </section>

      {/* Resumo operacional */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-violet-700">
            Agendamentos não cancelados
          </p>
          <p className="mt-3 text-3xl font-black text-violet-950">
            {agendamentosNaoCancelados}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            Receita realizada
          </p>
          <p className="mt-3 break-words text-2xl font-black text-emerald-700">
            {formatarMoeda(totalFaturamento)}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-sky-700">
            Atendimentos concluídos
          </p>
          <p className="mt-3 text-3xl font-black text-sky-800">
            {concluidos}
          </p>
        </div>
      </section>

      {/* Gráfico de faturamento */}
      <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-violet-950">
              Evolução do faturamento
            </h2>

            <p className="mt-1 text-sm text-violet-600">
              Receita de atendimentos concluídos por dia.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-2">
            <p className="text-xs font-semibold text-emerald-700">
              Total no período
            </p>
            <p className="mt-1 font-black text-emerald-800">
              {formatarMoeda(totalFaturamento)}
            </p>
          </div>
        </div>

        {dadosGrafico.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-5 py-12 text-center">
            <p className="text-3xl">📊</p>
            <p className="mt-3 font-bold text-violet-900">
              Ainda não há faturamento registrado.
            </p>
            <p className="mt-1 text-sm text-violet-600">
              Quando houver atendimentos concluídos, a evolução aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-3">
            <div
              className="flex min-h-64 items-end gap-3 border-b border-violet-100 px-2 pt-8"
              style={{
                minWidth: `${Math.max(dadosGrafico.length * 54, 320)}px`,
              }}
            >
              {dadosGrafico.map((item) => {
                const altura =
                  maiorValorGrafico > 0
                    ? Math.max(
                        (item.valor / maiorValorGrafico) * 180,
                        item.valor > 0 ? 8 : 0,
                      )
                    : 0;

                return (
                  <div
                    key={item.chave}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end"
                    title={`${formatarDataCompleta(item.data)}: ${formatarMoeda(item.valor)}`}
                  >
                    <span className="mb-2 whitespace-nowrap text-[10px] font-bold text-violet-800 sm:text-xs">
                      {item.valor > 0 ? formatarMoeda(item.valor) : '—'}
                    </span>

                    <div
                      className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-violet-700 to-fuchsia-500 transition-all duration-300"
                      style={{
                        height: `${altura}px`,
                        minHeight: item.valor > 0 ? '8px' : '2px',
                        opacity: item.valor > 0 ? 1 : 0.15,
                      }}
                    />

                    <span className="mt-3 whitespace-nowrap pb-2 text-[10px] font-semibold text-violet-600 sm:text-xs">
                      {formatarDataCurta(item.data)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-violet-500">
          O gráfico considera somente os valores dos atendimentos concluídos.
          Em “Todo o período”, são exibidos os dias com faturamento registrado.
        </p>
      </section>

      {/* Desempenho dos serviços */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-violet-950">
              Desempenho dos Serviços
            </h2>

            <p className="mt-1 text-sm text-violet-600">
              Ranking conforme os agendamentos do período selecionado.
            </p>
          </div>

          <div className="rounded-xl border border-violet-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-violet-600">
              Serviços cadastrados
            </p>

            <p className="mt-1 text-2xl font-black text-violet-950">
              {totalServicosCadastrados}
            </p>
          </div>
        </div>

        {servicoMaisProcurado && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-800 to-fuchsia-700 p-6 text-white shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-200">
              Serviço em destaque
            </p>

            <h3 className="mt-3 text-2xl font-black">
              {servicoMaisProcurado.nome}
            </h3>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-violet-100">
              <span>
                {servicoMaisProcurado.reservas}{' '}
                {servicoMaisProcurado.reservas === 1
                  ? 'reserva'
                  : 'reservas'}
              </span>

              <span>
                {servicoMaisProcurado.concluidos} concluídos
              </span>

              <span>
                {formatarMoeda(servicoMaisProcurado.faturamento)}
              </span>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          {rankingServicos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl">💇</p>

              <p className="mt-3 font-bold text-violet-900">
                Nenhum serviço encontrado neste período.
              </p>

              <p className="mt-1 text-sm text-violet-600">
                Experimente selecionar outro período.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="bg-violet-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wide text-violet-800">
                      Serviço
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wide text-violet-800">
                      Reservas
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wide text-violet-800">
                      Concluídos
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-violet-800">
                      Faturamento
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-violet-100">
                  {rankingServicos.map((servico, index) => (
                    <tr
                      key={servico.nome}
                      className="transition hover:bg-violet-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-black text-violet-800">
                            {index + 1}
                          </span>

                          <span className="font-bold text-violet-950">
                            {servico.nome}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-violet-800">
                        {servico.reservas}
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-sky-700">
                        {servico.concluidos}
                      </td>

                      <td className="px-5 py-4 text-right font-black text-emerald-700">
                        {formatarMoeda(servico.faturamento)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
