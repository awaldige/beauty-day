'use client';

import { useState, useEffect } from 'react';
import { Agendamento } from '@/types';
import { CardMetrica } from './CardMetrica';

interface DashboardProps {
  agendamentos: Agendamento[];
}

const SENHA_MASTER = '1234';

export default function Dashboard({ agendamentos = [] }: DashboardProps) {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const autorizado = sessionStorage.getItem('beautyday_admin_auth');
    if (autorizado === 'true') {
      setAutenticado(true);
    }
  }, []);

  const handleValidarSenha = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === SENHA_MASTER) {
      sessionStorage.setItem('beautyday_admin_auth', 'true');
      setAutenticado(true);
      setErro(false);
      setPin('');
    } else {
      setErro(true);
      setPin('');
    }
  };

  const handleSair = () => {
    sessionStorage.removeItem('beautyday_admin_auth');
    setAutenticado(false);
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 4) {
      const novoPin = pin + val;
      setPin(novoPin);
      setErro(false);
    }
  };

  const handleKeypadDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // 🔒 TELA DE BLOQUEIO / PIN
  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl relative overflow-hidden transition-all">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
        
        <div className="text-center space-y-2 mb-8">
          <div className="h-16 w-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg shadow-violet-500/25 ring-4 ring-white/50">
            🔐
          </div>
          <h2 className="text-xl font-black text-[#1a0933] tracking-tight">
            Acesso Restrito ao Gestor
          </h2>
          <p className="text-xs font-semibold text-violet-800/70">
            Insira o PIN de autorização para liberar o faturamento.
          </p>
        </div>

        <form onSubmit={handleValidarSenha} className="space-y-6">
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((index) => {
              const preenchido = pin.length > index;
              return (
                <div
                  key={index}
                  className={`h-4 w-4 rounded-full transition-all duration-200 border-2 ${
                    erro 
                      ? 'border-rose-500 bg-rose-500/20 scale-110' 
                      : preenchido 
                      ? 'bg-violet-600 border-violet-600 scale-110 shadow-md shadow-violet-500/40' 
                      : 'border-violet-300 bg-white/50'
                  }`}
                />
              );
            })}
          </div>

          {erro && (
            <p className="text-[11px] font-black text-rose-600 text-center animate-bounce bg-rose-50/80 py-1.5 rounded-lg border border-rose-200">
              ⚠️ PIN Incorreto. Tente novamente!
            </p>
          )}

          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-12 rounded-2xl bg-white/90 hover:bg-white text-violet-950 font-black text-lg border border-violet-200/80 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleKeypadDelete}
              className="h-12 rounded-2xl bg-violet-100/60 hover:bg-violet-100 text-violet-700 font-bold text-xs border border-violet-200/50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-2xl bg-white/90 hover:bg-white text-violet-950 font-black text-lg border border-violet-200/80 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length === 0}
              className="h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-xs shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 📊 CÁLCULOS DAS MÉTRICAS
  const listaAgendamentos = Array.isArray(agendamentos) ? agendamentos : [];
  
  // Agendamentos válidos (exclui cancelados)
  const agendamentosAtivos = listaAgendamentos.filter(a => String(a.status).toLowerCase() !== 'cancelado');
  
  const totalFaturamento = agendamentosAtivos.reduce((acc, curr: any) => {
    const val = curr.valor_cobrado ?? curr.valor ?? curr.preco ?? 0;
    return acc + Number(val || 0);
  }, 0);

  const totalAtendimentos = listaAgendamentos.length;
  
  // Contagem de Concluídos e Cancelados
  const concluidos = listaAgendamentos.filter(a => {
    const status = String(a.status).toLowerCase();
    return status === 'concluido' || status === 'concluído' || status === 'confirmado';
  }).length;
  
  const cancelados = listaAgendamentos.filter(a => String(a.status).toLowerCase() === 'cancelado').length;

  const taxaConclusao = totalAtendimentos > 0 
    ? Math.round((concluidos / totalAtendimentos) * 100) 
    : 0;

  // 📈 TELA DO DASHBOARD NO PADRÃO DE SERVIÇOS & EQUIPE
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 space-y-8 animate-fadeIn">
      
      {/* Cabeçalho Padronizado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-violet-200/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 rounded-2xl text-violet-700 text-xl font-bold">
              📊
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a0933] tracking-tight">
                Painel Financeiro & Operacional
              </h2>
              <p className="text-xs font-semibold text-violet-800/70 mt-0.5">
                Métricas consolidadas de todos os agendamentos cadastrados
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSair}
          className="text-xs font-black uppercase tracking-wider text-rose-700 hover:bg-rose-100/80 bg-rose-50 px-5 py-3 rounded-2xl border border-rose-200/80 transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95 shrink-0"
        >
          <span>🔒</span> Encerrar Sessão Master
        </button>
      </div>

      {/* Grid de Métricas Principais Padronizado */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <CardMetrica 
          titulo="Faturamento" 
          valor={totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          prefixo="R$" 
          destaque={true}
          auxiliar={
            <span className="text-emerald-800 font-bold text-[11px] block">
              • Receita Realizada
            </span>
          }
        />

        <CardMetrica 
          titulo="Total Atendimentos" 
          valor={totalAtendimentos.toString()} 
          prefixo=""
          auxiliar={
            <span className="text-violet-950 font-bold text-[11px] block">
              • Volume geral de agendamentos
            </span>
          }
        />

        <CardMetrica 
          titulo="Taxa de Conclusão" 
          valor={`${taxaConclusao}%`} 
          prefixo=""
          auxiliar={
            <span className="text-indigo-950 font-bold text-[11px] block">
              • {concluidos} de {totalAtendimentos} concluídos
            </span>
          }
        />

        <CardMetrica 
          titulo="Cancelamentos" 
          valor={cancelados.toString()} 
          prefixo=""
          auxiliar={
            <span className="text-rose-700 font-bold text-[11px] block">
              • Agendamentos cancelados
            </span>
          }
        />
      </section>

      {/* Seção Complementar: Status Operacional */}
      <div className="bg-violet-50/50 backdrop-blur-md rounded-3xl p-6 border border-violet-200/60 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h3 className="text-xs font-black text-[#1a0933] uppercase tracking-wider">
            Status Operacional das Reservas
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/90 border border-emerald-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Concluídos
              </span>
              <p className="text-3xl font-black text-[#1a0933]">{concluidos}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-rose-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                Cancelados
              </span>
              <p className="text-3xl font-black text-[#1a0933]">{cancelados}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-2xl">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}