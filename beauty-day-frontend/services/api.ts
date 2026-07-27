import {
  Agendamento,
  Profissional,
  Servico,
  CriarAgendamentoDTO,
  CriarProfissionalDTO,
  CriarServicoDTO
} from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api';

async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let detalheErro = '';

    try {
      const dadosErro = await response.json();
      detalheErro = JSON.stringify(dadosErro);
    } catch {
      try {
        detalheErro = await response.text();
      } catch {
        detalheErro = response.statusText;
      }
    }

    console.error(
      `🚨 [Erro API ${response.status}] ${endpoint}:`,
      detalheErro
    );

    throw new Error(
      `[${response.status}] ${detalheErro}`
    );
  }

  return response.json();
}

/* =========================
   AGENDAMENTOS
========================= */

export const api = {

  getAgendamentos: () => 
    fetchJson<Agendamento[]>('/agendamentos'),

  criarAgendamento: (dados: CriarAgendamentoDTO) =>
    fetchJson<Agendamento>(
      '/agendamentos',
      {
        method: 'POST',
        body: JSON.stringify(dados)
      }
    ),

  cancelarAgendamento: (id: string) =>
    fetchJson<Agendamento>(
      `/agendamentos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'cancelado'
        })
      }
    ),

  concluirAgendamento: (id: string) =>
    fetchJson<Agendamento>(
      `/agendamentos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'concluido'
        })
      }
    ),

  reagendarAtendimento: (id: string, dataHora: string) =>
    fetchJson<Agendamento>(
      `/agendamentos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          data_hora_inicio: dataHora
        })
      }
    ),

/* =========================
   PROFISSIONAIS
========================= */

  getProfissionais: () =>
    fetchJson<Profissional[]>('/profissionais'),

  criarProfissional: (dados: CriarProfissionalDTO & Record<string, any>) => {
    const uuidGerado = `user-${Date.now()}`;

    const payloadUsuario = {
      id: dados.id || uuidGerado,
      nome: dados.nome || dados.nome_profissional,
      nome_profissional: dados.nome || dados.nome_profissional,
      email:
        dados.email ||
        `${(dados.nome || 'profissional')
          .toLowerCase()
          .replace(/\s+/g, '')}@beautyday.com`,
      senha: dados.senha || '123456',
      cargo: dados.cargo || dados.cargo_profissional || 'cabeleireiro',
      cargo_profissional: dados.cargo || dados.cargo_profissional || 'cabeleireiro',
      status: dados.status || 'ativo'
    };

    return fetchJson<Profissional>(
      '/profissionais',
      {
        method: 'POST',
        body: JSON.stringify(payloadUsuario)
      }
    );
  },

  // 🟢 CORRIGIDO: Aceita atualizações parciais sem forçar status e previne o 404
  atualizarProfissional: ({ id, ...dados }: { id: string } & Record<string, any>) => {
    const nomeValido = dados.nome || dados.nome_profissional;
    const cargoValido = dados.cargo || dados.cargo_profissional;

    const payload: Record<string, any> = {
      id,
      ...(nomeValido && { nome: nomeValido, nome_profissional: nomeValido }),
      ...(cargoValido && { cargo: cargoValido, cargo_profissional: cargoValido }),
      status: dados.status || 'ativo',
    };

    // Tenta rota no formato /profissionais/:id via PUT
    return fetchJson<Profissional>(
      `/profissionais/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );
  },

  excluirProfissional: (id: string) =>
    fetchJson<{ success: boolean }>(
      `/profissionais/${id}`,
      {
        method: 'DELETE'
      }
    ),

/* =========================
   SERVIÇOS
========================= */

  getServicos: () =>
    fetchJson<Servico[]>('/servicos'),

  criarServico: (dados: CriarServicoDTO & Record<string, any>) => {
    const valorNumerico =
      dados.preco ??
      dados.preco_base ??
      dados.valor ??
      0;

    const payload = {
      nome: dados.nome,
      nome_servico: dados.nome,
      preco: valorNumerico,
      valor: valorNumerico,
      preco_base: valorNumerico,
      preco_servico: valorNumerico,
      duracao: dados.duracao ?? dados.duracao_estimada ?? 30,
      duracao_estimada: dados.duracao ?? dados.duracao_estimada ?? 30,
      status: 'ativo'
    };

    return fetchJson<Servico>(
      '/servicos',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  atualizarServico: ({ id, ...dados }: { id: number } & Record<string, any>) => {
    const valor =
      dados.preco ??
      dados.preco_base ??
      dados.valor ??
      0;

    const payload = {
      nome: dados.nome || dados.nome_servico,
      preco_base: valor,
      duracao_estimada:
        dados.duracao ??
        dados.duracao_minutos ??
        dados.duracao_estimada ??
        30
    };

    return fetchJson<Servico>(
      `/servicos/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );
  },

  excluirServico: (id: number) =>
    fetchJson<{ success: boolean }>(
      `/servicos/${id}`,
      {
        method: 'DELETE'
      }
    ),
};