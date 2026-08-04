'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Profissional, CargoProfissional } from '@/types';
import { api } from '@/services/api';
import { ConfirmModal } from '@/components/ConfirmModal';

interface EquipeProps {
  profissionais: Profissional[];
}

// Mapeamento visual rico para cada cargo/especialidade
const CONFIG_CARGOS: Record<string, { label: string; emoji: string; classe: string; iconeBg: string }> = {
  cabeleireiro: {
    label: 'Cabeleireiro(a)',
    emoji: '✂️',
    classe: 'bg-violet-500/10 text-violet-700 border-violet-300/80',
    iconeBg: 'from-violet-600 to-indigo-600',
  },
  manicure: {
    label: 'Manicure / Pedicure',
    emoji: '💅',
    classe: 'bg-pink-500/10 text-pink-700 border-pink-300/80',
    iconeBg: 'from-pink-500 to-rose-500',
  },
  barbeiro: {
    label: 'Barbeiro',
    emoji: '💈',
    classe: 'bg-blue-500/10 text-blue-700 border-blue-300/80',
    iconeBg: 'from-blue-600 to-cyan-600',
  },
  esteticista: {
    label: 'Esteticista',
    emoji: '🌿',
    classe: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/80',
    iconeBg: 'from-emerald-500 to-teal-600',
  },
};

const obterConfigCargo = (cargo: string) => {
  const chave = String(cargo || '').toLowerCase();
  return CONFIG_CARGOS[chave] || {
    label: cargo || 'Especialista',
    emoji: '✨',
    classe: 'bg-violet-500/10 text-violet-700 border-violet-300/80',
    iconeBg: 'from-violet-600 to-fuchsia-600',
  };
};

export function Equipe({ profissionais = [] }: EquipeProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<CargoProfissional>('cabeleireiro');
  
  const [idEditando, setIdEditando] = useState<string | null>(null);

  const [modalExcluir, setModalExcluir] = useState<{
    isOpen: boolean;
    id: string | null;
    nome: string;
  }>({
    isOpen: false,
    id: null,
    nome: '',
  });

  // Mutação para Criar Profissional
  const mutationCriar = useMutation({
    mutationFn: api.criarProfissional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      resetarFormulario();
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      alert("Não foi possível cadastrar o profissional.");
    }
  });

  // Mutação para Editar Profissional
  const mutationEditar = useMutation({
    mutationFn: ({ id, ...dados }: { id: string; [key: string]: any }) => {
      return api.atualizarProfissional({ id, ...dados });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      resetarFormulario();
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar:", error);
      alert(error.message || "Não foi possível editar as informações.");
    }
  });

  // Mutação para Excluir Profissional (Inativação Lógica)
  const mutationExcluir = useMutation({
    mutationFn: (id: string) => {
      return api.atualizarProfissional({ id, status: 'inativo' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setModalExcluir({ isOpen: false, id: null, nome: '' });
    },
    onError: (error) => {
      console.error("Erro ao excluir:", error);
      alert("Não foi possível remover o profissional.");
    }
  });

  const resetarFormulario = () => {
    setNome('');
    setCargo('cabeleireiro');
    setIdEditando(null);
  };

  const extrairIdSeguro = (objeto: any): string | null => {
    if (!objeto) return null;
    const chaves = ['id', 'id_usuario', 'usuario_id', 'profissional_id', 'id_profissional', '_id'];
    for (const c of chaves) {
      if (objeto[c] !== undefined && objeto[c] !== null && objeto[c] !== '') {
        return String(objeto[c]);
      }
    }
    return null;
  };

  const handleSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Por favor, informe o nome.");

    const payload = {
      nome: nome.trim(),
      nome_profissional: nome.trim(),
      cargo: cargo,
      cargo_profissional: cargo,
      status: 'ativo'
    };

    if (idEditando) {
      mutationEditar.mutate({ id: idEditando, ...payload });
    } else {
      mutationCriar.mutate(payload);
    }
  };

  const handleIniciarEdicao = (p: any) => {
    const idReal = extrairIdSeguro(p);
    if (!idReal) return alert("Não foi possível identificar o ID deste membro.");

    setIdEditando(idReal);
    setNome(p.nome || p.nome_profissional || '');
    setCargo((p.cargo || p.cargo_profissional || 'cabeleireiro') as CargoProfissional);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModalExclusao = (p: any) => {
    const idReal = extrairIdSeguro(p);
    const nomeReal = p.nome || p.nome_profissional || 'Este membro';

    if (!idReal) return alert("Não foi possível localizar o ID para exclusão.");

    setModalExcluir({
      isOpen: true,
      id: idReal,
      nome: nomeReal,
    });
  };

  const handleConfirmarExclusao = () => {
    if (!modalExcluir.id) return;
    if (idEditando === modalExcluir.id) resetarFormulario();
    mutationExcluir.mutate(modalExcluir.id);
  };

  // Filtragem flexível de ativos
  const dadosLista = Array.isArray(profissionais) 
    ? profissionais 
    : (profissionais as any)?.data || [];

  const listaAtivos = dadosLista.filter((p: any) => {
    const st = String(p?.status || '').toLowerCase().trim();
    return st !== 'inativo' && st !== 'disabled' && st !== '0';
  });

  const estaCarregando = mutationCriar.isPending || mutationEditar.isPending;

  return (
    <div className="space-y-6 sm:space-y-10">
      
      {/* SEÇÃO 1: FORMULÁRIO DE CADASTRO/EDIÇÃO */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-violet-200/90 shadow-[0_20px_50px_rgba(109,40,217,0.06)] transition-all">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />
        
        <div className="px-4 py-4 sm:px-8 sm:py-5 border-b border-violet-200/50 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-50/70 via-fuchsia-50/30 to-transparent">
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-[#1a0933] flex items-center gap-2">
              <span className="p-1.5 sm:p-2 bg-violet-100 rounded-lg sm:rounded-xl text-base sm:text-lg">{idEditando ? '✏️' : '👤'}</span> 
              {idEditando ? 'Editar Membro' : 'Novo Especialista'}
            </h2>
            <p className="text-[11px] sm:text-xs text-violet-800/80 font-medium mt-0.5 sm:mt-1">
              {idEditando ? 'Atualize as informações do profissional selecionado.' : 'Adicione talentos ao seu time para liberar horários na agenda.'}
            </p>
          </div>

          {idEditando && (
            <button 
              type="button"
              onClick={resetarFormulario}
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100/70 bg-rose-50 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-rose-200 transition-all cursor-pointer shadow-sm ml-auto"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmeter} className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
          <div className="space-y-1.5 sm:space-y-2 md:col-span-1">
            <label className="block text-[10px] font-black text-violet-950 uppercase tracking-widest pl-1">
              Nome do Profissional
            </label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required
              disabled={estaCarregando}
              placeholder="Ex: Amanda Silva"
              className="w-full h-12 sm:h-13 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-2 border-violet-100 rounded-xl sm:rounded-2xl bg-white/90 text-[#1a0933] placeholder-violet-300 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-[10px] font-black text-violet-950 uppercase tracking-widest pl-1">
              Especialidade / Cargo
            </label>
            <select 
              value={cargo} 
              onChange={(e) => setCargo(e.target.value as CargoProfissional)}
              disabled={estaCarregando}
              className="w-full h-12 sm:h-13 px-3.5 sm:px-4 text-xs sm:text-sm font-bold border-2 border-violet-100 rounded-xl sm:rounded-2xl bg-white/90 text-[#1a0933] focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer shadow-inner appearance-none disabled:opacity-50"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236d28d9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
            >
              <option value="cabeleireiro">✂️ Cabeleireiro(a)</option>
              <option value="manicure">💅 Manicure / Pedicure</option>
              <option value="barbeiro">💈 Barbeiro</option>
              <option value="esteticista">🌿 Esteticista</option>
            </select>
          </div>

          <div className="pt-2 md:pt-0">
            <button 
              type="submit" 
              disabled={estaCarregando}
              className="w-full h-12 sm:h-13 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 hover:scale-[1.01] text-white text-xs font-black rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {estaCarregando ? (
                <>
                  <span className="animate-spin">⏳</span> Salvando...
                </>
              ) : (
                <>
                  <span>{idEditando ? '💾' : '✨'}</span> {idEditando ? 'Atualizar Dados' : 'Cadastrar Profissional'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DIVISOR DE SEÇÃO */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md shadow-violet-500/20 uppercase tracking-widest gap-1.5 sm:gap-2">
            <span>✨</span> Equipe Ativa
          </div>
          <span className="text-[11px] sm:text-xs font-black text-violet-900 bg-white/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-violet-200/80 shadow-sm">
            {listaAtivos.length} {listaAtivos.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-violet-300/80 via-fuchsia-200/50 to-transparent flex-1 rounded-full hidden sm:block" />
      </div>

      {/* SEÇÃO 2: GRID DE CARDS */}
      {listaAtivos.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-16 text-center bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-dashed border-violet-200/80 space-y-3 sm:space-y-4 shadow-sm">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-violet-100 text-violet-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl mx-auto shadow-inner">
            💈
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-[#1a0933]">Nenhum especialista listado</h3>
            <p className="text-xs text-violet-800/70 max-w-sm mx-auto font-medium">
              Utilize o formulário acima para adicionar os profissionais e montar sua equipe.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {listaAtivos.map((p: any) => {
            const idItem = extrairIdSeguro(p);
            const nomeExibicao = p.nome || p.nome_profissional || 'Profissional';
            const cargoBruto = p.cargo || p.cargo_profissional || 'cabeleireiro';
            const configCargo = obterConfigCargo(cargoBruto);
            const isEditingThis = idEditando === idItem;

            // Extrai as duas primeiras iniciais do nome para o avatar
            const partesNome = nomeExibicao.trim().split(' ');
            const iniciais = partesNome.length > 1 
              ? `${partesNome[0][0]}${partesNome[partesNome.length - 1][0]}`
              : nomeExibicao.substring(0, 2);

            return (
              <div 
                key={idItem || Math.random().toString()} 
                className={`group relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isEditingThis 
                    ? 'border-fuchsia-500 shadow-[0_20px_40px_rgba(217,70,239,0.18)] ring-2 ring-fuchsia-400/40 bg-fuchsia-50/20' 
                    : 'border-violet-200/80 hover:border-violet-400 hover:shadow-[0_20px_45px_rgba(109,40,217,0.12)] hover:-translate-y-1'
                }`}
              >
                {/* Linha Decorativa Superior no Hover */}
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Glow de Fundo */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl group-hover:bg-fuchsia-400/20 transition-all duration-500 pointer-events-none" />

                <div className="space-y-4 sm:space-y-5 relative z-10">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar Premium */}
                      <div className="relative">
                        <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${configCargo.iconeBg} text-white flex items-center justify-center font-black text-xs sm:text-sm uppercase shadow-md shadow-violet-600/20 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                          {iniciais}
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-white animate-pulse" />
                        </span>
                      </div>

                      {/* Nome & Cargo */}
                      <div className="space-y-1">
                        <h4 className="font-black text-[#1a0933] text-sm sm:text-base tracking-tight leading-snug group-hover:text-violet-700 transition-colors line-clamp-1">
                          {nomeExibicao}
                        </h4>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-sm ${configCargo.classe}`}>
                          <span>{configCargo.emoji}</span>
                          {configCargo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé e Botões de Ação */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-violet-100/80 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 relative z-10">
                  <div className="text-[9px] sm:text-[10px] font-bold text-violet-800/60 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                    Ativo no sistema
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => handleIniciarEdicao(p)}
                      className="flex-1 xs:flex-none px-3 py-1.5 text-xs font-black text-violet-700 bg-violet-50 hover:bg-violet-100/80 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="Editar informações"
                    >
                      <span>✏️</span> Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalExclusao(p)}
                      disabled={mutationExcluir.isPending}
                      className="flex-1 xs:flex-none px-3 py-1.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100/70 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-40"
                      title="Inativar profissional"
                    >
                      <span>🗑️</span> Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Inativação de Profissional */}
      <ConfirmModal
        isOpen={modalExcluir.isOpen}
        title="Remover da Equipe"
        description={`Deseja realmente remover ${modalExcluir.nome}? Ele passará para o status inativo na base de dados.`}
        variant="danger"
        confirmText="Sim, Inativar"
        cancelText="Cancelar"
        isLoading={mutationExcluir.isPending}
        onConfirm={handleConfirmarExclusao}
        onCancel={() => setModalExcluir({ isOpen: false, id: null, nome: '' })}
      />
    </div>
  );
}
