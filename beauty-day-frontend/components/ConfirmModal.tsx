'use client';

import { useEffect, useState } from 'react';
import { createPortal as reactCreatePortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  
  /* Novas funcionalidades opcionais */
  requireReason?: boolean;           // Exibe caixa de texto para motivo
  reasonPlaceholder?: string;
  confirmTextToType?: string;        // Exige digitar ex: "CONFIRMAR" para liberar o botão
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  requireReason = false,
  reasonPlaceholder = 'Digite o motivo (opcional)...',
  confirmTextToType,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Limpa os estados ao fechar/abrir o modal
  useEffect(() => {
    if (!isOpen) {
      setTypedText('');
      setReason('');
    }
  }, [isOpen]);

  // Tecla ESC para fechar o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !mounted) return null;

  // Validações para habilitar o botão de confirmação
  const isTypeValid = confirmTextToType 
    ? typedText.trim().toLowerCase() === confirmTextToType.trim().toLowerCase()
    : true;

  const isReasonValid = requireReason ? reason.trim().length > 0 : true;

  const isConfirmDisabled = isLoading || !isTypeValid || !isReasonValid;

  const variantStyles = {
    danger: {
      bgIcon: 'bg-rose-100 text-rose-600 border border-rose-200',
      btnConfirm: 'bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 text-white shadow-md shadow-rose-600/20',
      icon: '⚠️'
    },
    warning: {
      bgIcon: 'bg-amber-100 text-amber-600 border border-amber-200',
      btnConfirm: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white shadow-md shadow-amber-600/20',
      icon: '🚨'
    },
    info: {
      bgIcon: 'bg-violet-100 text-violet-600 border border-violet-200',
      btnConfirm: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-violet-600/20',
      icon: 'ℹ️'
    }
  };

  const currentVariant = variantStyles[variant];

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={!isLoading ? onCancel : undefined}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Card do Modal */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '1.5rem',
        }}
        className="space-y-5"
      >
        {/* Cabeçalho */}
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-2xl ${currentVariant.bgIcon} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
            {currentVariant.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1a0933]">
              {title}
            </h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Entrada opcional de texto para motivo */}
        {requireReason && (
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Motivo do cancelamento / observação
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              disabled={isLoading}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Confirmação por digitação */}
        {confirmTextToType && (
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-slate-600">
              Digite <span className="font-black text-rose-600">{confirmTextToType}</span> para confirmar:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={confirmTextToType}
              disabled={isLoading}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-bold text-slate-800"
            />
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 px-5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={isConfirmDisabled}
            className={`h-11 px-6 text-xs font-black rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider flex items-center gap-2 cursor-pointer ${currentVariant.btnConfirm} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return reactCreatePortal(modalContent, document.body);
}