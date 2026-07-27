'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Servico } from '@/types';
import { api } from '@/services/api';

interface ServicosProps {
  servicos: Servico[];
}

// Mapeamento dinâmico de ícones e estilos com base no nome do serviço
const obterEstiloServico = (nome: string) => {
  const n = (nome || '').toLowerCase();
  
  if (n.includes('corte') || n.includes('tesoura') || n.includes('cabelo')) {
    return { emoji: '✂️', bg: 'from-violet-600 to-indigo-600', badge: 'bg-violet-500/10 text-violet-700 border-violet-200' };
  }
  if (n.includes('unha') || n.includes('manicure') || n.includes('pedicure') || n.includes('esmalt')) {
    return { emoji: '💅', bg: 'from-pink-500 to-rose-500', badge: 'bg-pink-500/10 text-pink-700 border-pink-200' };
  }
  if (n.includes('barba') || n.includes('bigode') || n.includes('barbeiro')) {
    return { emoji: '💈', bg: 'from-blue-600 to-cyan-600', badge: 'bg-blue-500/10 text-blue-700 border-blue-200' };
  }
  if (n.includes('sobrancelha') || n.includes('cilio') || n.includes('make') || n.includes('maquiagem')) {
    return { emoji: '👁️', bg: 'from-fuchsia-600 to-pink-600', badge: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200' };
  }
  if (n.includes('massagem') || n.includes('pele') || n.includes('facial') || n.includes('estetic')) {
    return { emoji: '🌿', bg: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' };
  }
  
  return { emoji: '✨', bg: 'from-violet-600 to-fuchsia-600', badge: 'bg-violet-500/10 text-violet-700 border-violet-200' };
};

export function Servicos({ servicos }: ServicosProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');
  
  // Guardamos o ID ativo da edição como number ou string, mas convertemos ao enviar
  const [idEditando, setIdEditando] = useState<number | null>(null);

  // 1. Mutação de Cadastro (POST)
  const mutationCriar = useMutation({
    mutationFn: api.criarServico,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      resetarFormulario();
    },
    onError: (error) => {
      console.error("Erro crítico ao salvar serviço na API:", error);
      alert("Não foi possível cadastrar o serviço.");
    }
  });

  // 2. Mutação de Edição (PUT)
  const mutationEditar = useMutation({
    mutationFn: ({ id, ...dados }: { id: number; [key: string]: any }) => {
      if (!id || isNaN(id)) {
        throw new Error("ID numérico inválido interceptado antes do envio.");
      }
      return api.atualizarServico({ id, ...dados });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      resetarFormulario();
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar serviço:", error);
      alert("Não foi possível editar as informações do serviço.");
    }
  });

  // 3. Mutação de Exclusão (DELETE)
  const mutationExcluir = useMutation({
    mutationFn: (id: number) => {
      if (!id || isNaN(id)) {
        throw new Error("ID numérico inválido fornecido para exclusão.");
      }
      return api.excluirServico(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
    },
    onError: (error) => {
      console.error("Erro ao excluir serviço:", error);
      alert("Não foi possível remover o serviço.");
    }
  });

  const resetarFormulario = () => {
    setNome('');
    setPreco('');
    setDuracao('30');
    setIdEditando(null);
  };

  // Varredura profunda pelas propriedades de identificação do objeto de serviço
  const extrairIdSeguro = (objeto: any): number | null => {
    if (!objeto) return null;
    const chavesPossiveis = ['id', 'servico_id', 'servicoId', 'id_servico', '_id'];
    for (const chave of chavesPossiveis) {
      if (objeto[chave] !== undefined && objeto[chave] !== null && objeto[chave] !== '') {
        const idConvertido = Number(objeto[chave]);
        return isNaN(idConvertido) ? null : idConvertido;
      }
    }
    return null;
  };

  const handleSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !preco) return alert("Por favor, preencha os campos obrigatórios.");

    const valorNumerico = parseFloat(preco);

    const payload = {
      nome: nome.trim(),
      nome_servico: nome.trim(),
      preco: valorNumerico,
      valor: valorNumerico,
      preco_base: valorNumerico,
      preco_servico: valorNumerico,
      duracao: parseInt(duracao) || 30,
      duracao_estimada: parseInt(duracao) || 30,
      status: 'ativo'
    };

    if (idEditando !== null) {
      mutationEditar.mutate({ id: idEditando, ...payload });
    } else {
      mutationCriar.mutate(payload);
    }
  };

  const handleIniciarEdicao = (s: any) => {
    const idReal = extrairIdSeguro(s);
    
    if (idReal === null) {
      alert("Erro interno: Não foi possível mapear um ID numérico compatível.");
      return;
    }

    setIdEditando(idReal);
    setNome(s.nome || s.nome_servico || '');
    setPreco(String(s.preco ?? s.valor ?? s.preco_base ?? s.preco_servico ?? ''));
    setDuracao(String(s.duracao ?? s.duracao_estimada ?? '30'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = (s: any) => {
    const idReal = extrairIdSeguro(s);
    const nomeReal = s.nome || s.nome_servico || 'Este serviço';

    if (idReal === null) {
      alert("Erro: Não foi possível identificar o ID numérico para exclusão.");
      return;
    }

    if (confirm(`Tem certeza que deseja remover o serviço "${nomeReal}"?`)) {
      if (idEditando === idReal) {
        resetarFormulario();
      }
      mutationExcluir.mutate(idReal);
    }
  };

  const estaCarregando = mutationCriar.isPending || mutationEditar.isPending;
  const listaServicos = Array.isArray(servicos) ? servicos : [];

  return (
    <div className="space-y-10">
      
      {/* SEÇÃO 1: FORMULÁRIO DE CADASTRO/EDIÇÃO */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-violet-200/90 shadow-[0_20px_50px_rgba(109,40,217,0.06)] transition-all">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />
        
        <div className="px-8 py-5 border-b border-violet-200/50 flex items-center justify-between bg-gradient-to-r from-violet-50/70 via-fuchsia-50/30 to-transparent">
          <div>
            <h2 className="text-base font-black tracking-tight text-[#1a0933] flex items-center gap-2">
              <span className="p-2 bg-violet-100 rounded-xl text-lg">{idEditando !== null ? '✏️' : '✨'}</span> 
              {idEditando !== null ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <p className="text-xs text-violet-800/80 font-medium mt-1">
              {idEditando !== null ? 'Modifique os valores e especificações do procedimento.' : 'Adicione novos procedimentos e valores ao cardápio do estabelecimento.'}
            </p>
          </div>

          {idEditando !== null && (
            <button 
              type="button"
              onClick={resetarFormulario}
              className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100/70 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-sm"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmeter} className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Nome do Serviço */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-[10px] font-black text-violet-950 uppercase tracking-widest pl-1">
              Nome do Serviço
            </label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required
              disabled={estaCarregando}
              placeholder="Ex: Corte Degradê, Escova Progressiva..."
              className="w-full h-13 px-4 text-sm font-bold border-2 border-violet-100 rounded-2xl bg-white/90 text-[#1a0933] placeholder-violet-300 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner disabled:opacity-50"
            />
          </div>
          
          {/* Preço */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-violet-950 uppercase tracking-widest pl-1">
              Preço (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              value={preco} 
              onChange={(e) => setPreco(e.target.value)} 
              required
              disabled={estaCarregando}
              placeholder="0,00"
              className="w-full h-13 px-4 text-sm font-bold border-2 border-violet-100 rounded-2xl bg-white/90 text-[#1a0933] placeholder-violet-300 focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner disabled:opacity-50"
            />
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-violet-950 uppercase tracking-widest pl-1">
              Duração
            </label>
            <select 
              value={duracao} 
              onChange={(e) => setDuracao(e.target.value)}
              disabled={estaCarregando}
              className="w-full h-13 px-4 text-sm font-bold border-2 border-violet-100 rounded-2xl bg-white/90 text-[#1a0933] focus:outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer shadow-inner appearance-none disabled:opacity-50"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236d28d9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
            >
              <option value="15">⏱️ 15 minutos</option>
              <option value="30">⏱️ 30 minutos</option>
              <option value="45">⏱️ 45 minutos</option>
              <option value="60">⏱️ 1 hora</option>
              <option value="90">⏱️ 1h 30min</option>
              <option value="120">⏱️ 2 horas</option>
            </select>
          </div>

          {/* Botão de Envio */}
          <div className="md:col-span-4 pt-2">
            <button 
              type="submit" 
              disabled={estaCarregando}
              className="w-full h-13 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 hover:scale-[1.005] text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {estaCarregando ? (
                <>
                  <span className="animate-spin">⏳</span> Salvando...
                </>
              ) : (
                <>
                  <span>{idEditando !== null ? '💾' : '✨'}</span> {idEditando !== null ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DIVISOR DE SEÇÃO RICA */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-9 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-violet-500/20 uppercase tracking-widest gap-2">
            <span>📋</span> Serviços Ativos
          </div>
          <span className="text-xs font-black text-violet-900 bg-white/80 px-3 py-1.5 rounded-xl border border-violet-200/80 shadow-sm">
            {listaServicos.length} {listaServicos.length === 1 ? 'serviço' : 'serviços'}
          </span>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-violet-300/80 via-fuchsia-200/50 to-transparent flex-1 rounded-full hidden sm:block" />
      </div>

      {/* SEÇÃO 2: GRID DE CARDS PREMIUM */}
      {listaServicos.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-violet-200/80 space-y-4 shadow-sm">
          <div className="h-16 w-16 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            ✂️
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1a0933]">Nenhum serviço cadastrado</h3>
            <p className="text-xs text-violet-800/70 max-w-sm mx-auto font-medium">
              Utilize o formulário acima para adicionar os procedimentos oferecidos no seu espaço.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listaServicos.map(s => {
            const idItem = extrairIdSeguro(s);
            const dadosServico = s as any;
            const nomeExibicao = s.nome || dadosServico.nome_servico || 'Serviço';
            const precoExibicao = dadosServico.preco ?? dadosServico.valor ?? dadosServico.preco_base ?? dadosServico.preco_servico ?? 0;
            const duracaoExibicao = dadosServico.duracao ?? dadosServico.duracao_estimada ?? 30;
            
            const estilo = obterEstiloServico(nomeExibicao);
            const isEditingThis = idEditando === idItem;

            return (
              <div 
                key={idItem || Math.random().toString()} 
                className={`group relative p-6 rounded-3xl bg-white/80 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isEditingThis 
                    ? 'border-fuchsia-500 shadow-[0_20px_40px_rgba(217,70,239,0.18)] ring-2 ring-fuchsia-400/40 bg-fuchsia-50/20' 
                    : 'border-violet-200/80 hover:border-violet-400 hover:shadow-[0_20px_45px_rgba(109,40,217,0.12)] hover:-translate-y-1'
                }`}
              >
                {/* Linha Decorativa Luminosa Superior */}
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Glow de Fundo */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl group-hover:bg-fuchsia-400/20 transition-all duration-500 pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  {/* Cabeçalho do Card com Ícone em Gradiente */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${estilo.bg} text-white flex items-center justify-center font-black text-xl shadow-md shadow-violet-600/20 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                        {estilo.emoji}
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="font-black text-[#1a0933] text-base tracking-tight leading-snug group-hover:text-violet-700 transition-colors line-clamp-1">
                          {nomeExibicao}
                        </h3>
                        <span className="text-[10px] font-bold text-violet-800/60 uppercase tracking-widest">
                          Procedimento
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de Valor e Duração */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-700 border border-emerald-300/80 shadow-sm">
                      <span className="text-[10px]">💰</span> R$ {Number(precoExibicao).toFixed(2)}
                    </span>

                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-500/10 text-indigo-700 border border-indigo-200/80 shadow-sm">
                      <span className="text-[10px]">⏱️</span> {duracaoExibicao} min
                    </span>
                  </div>
                </div>

                {/* Rodapé e Botões de Ação */}
                <div className="mt-6 pt-4 border-t border-violet-100/80 flex items-center justify-between gap-2 relative z-10">
                  <div className="text-[10px] font-bold text-violet-800/60 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                    Disponível
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleIniciarEdicao(s)}
                      className="px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Editar serviço"
                    >
                      <span>✏️</span> Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluir(s)}
                      disabled={mutationExcluir.isPending}
                      className="px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-100/70 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40"
                      title="Excluir serviço"
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
    </div>
  );
}