export type CargoProfissional = 'cabeleireiro' | 'manicure' | 'barbeiro' | 'esteticista';

export interface Profissional {
  id: string;
  nome: string;
  cargo: CargoProfissional;
  ativo: boolean;
}

export interface Servico {
  id: string;
  nome: string;
  preco_base?: number;
  preco?: number;
  duracao_estimada?: number;
  duracao_minutos?: number;
}

// 🎯 Atualizado para incluir o status 'concluido'
export type StatusAgendamento = 'confirmado' | 'pendente' | 'cancelado' | 'concluido';

export interface Agendamento {
  id: string;
  profissional_id: string;
  profissional_nome?: string;
  servico_id: string;
  servico_nome?: string;
  data_hora_inicio: string;
  valor_cobrado: number;
  status: StatusAgendamento;
  updated_at?: string;
}

export type CriarAgendamentoDTO = Omit<Agendamento, 'id' | 'profissional_nome' | 'servico_nome'>;
export type CriarProfissionalDTO = Omit<Profissional, 'id' | 'ativo'>;
export type CriarServicoDTO = Omit<Servico, 'id'>;