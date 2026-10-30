import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, CreditCard, Calendar } from 'lucide-react';
import { Account } from '../types/financial';
import { ImportStatementResult } from '../types/import';
import { uploadStatementApi } from '../services/importApi';
import { useAuth } from '../context/AuthContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onImportCompleted: (importedMonth?: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onImportCompleted,
}) => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportStatementResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const lower = selected.name.toLowerCase();
      if (!lower.endsWith('.ofx') && !lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        setError('Por favor, selecione apenas arquivos bancários com extensão .ofx, .csv, .xlsx ou .xls.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
      setResult(null);

      // Auto-detecção de fatura de cartão de crédito pelo nome do arquivo
      const isCardFile = lower.includes('fatura')
        || lower.includes('cartao')
        || lower.includes('cartão')
        || lower.includes('card')
        || lower.includes('nubank')
        || lower.includes('credito')
        || lower.includes('crédito')
        || lower.includes('invoice');

      setIsCreditCard(isCardFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) return;

    setError(null);
    setLoading(true);

    try {
      const targetAccId = accounts.length > 0 ? accounts[0].id : undefined;
      const res = await uploadStatementApi(token, targetAccId, file, isCreditCard);
      setResult(res);
      setFile(null);
      onImportCompleted(res.referenceMonth);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha no upload do arquivo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setIsCreditCard(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800/80 text-[#026CD6] dark:text-blue-400 flex items-center justify-center shadow-[0_3px_0_0_#BFDBFE] dark:shadow-none">
            <UploadCloud className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">Importar Extrato</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400">Extratos OFX, CSV e planilhas Excel com conciliação automática</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:!bg-rose-950/50 border-2 border-[#FF4B4B] dark:!border-rose-800 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#EA2B2B] dark:!text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4 py-2 animate-fade-in">
            <div className="p-4 rounded-2xl bg-blue-50 dark:!bg-blue-950/40 border-2 border-blue-200 dark:!border-blue-800/80 text-blue-900 dark:text-blue-200 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-black text-[#026CD6] dark:text-blue-400">
                <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                <span>Importação Concluída com Sucesso!</span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{result.message}</p>

              {result.referenceMonthDisplay && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:!bg-[#0F172A] border-2 border-blue-200 dark:!border-blue-800 text-xs font-black text-[#026CD6] dark:text-blue-300 shadow-sm">
                    <Calendar className="h-4 w-4 text-[#026CD6] dark:text-blue-400 stroke-[2.5]" />
                    <span>Mês dos registros importados: <strong className="text-slate-900 dark:text-white underline decoration-blue-400 decoration-2">{result.referenceMonthDisplay}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Novos Lançamentos</span>
                <p className="text-2xl font-black text-[#026CD6] dark:text-blue-400 mt-1">{result.importedCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:!bg-[#0F172A] border-2 border-slate-200 dark:!border-slate-800 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Duplicados Ignorados</span>
                <p className="text-2xl font-black text-[#FF9600] dark:text-amber-400 mt-1">{result.skippedCount}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="btn-duo btn-duo-white px-5 py-2.5 text-xs sm:text-sm font-black"
              >
                Importar Outro Extrato
              </button>
              <button
                type="button"
                onClick={() => {
                  if (result?.referenceMonth) {
                    onImportCompleted(result.referenceMonth);
                  }
                  onClose();
                }}
                className="btn-duo btn-duo-green px-5 py-2.5 text-xs sm:text-sm font-black"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Arquivo do Extrato (.OFX, .CSV ou Excel)</label>
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-700/60 hover:border-[#026CD6] dark:hover:border-blue-500 rounded-3xl p-6 text-center cursor-pointer transition-colors relative bg-blue-50/40 dark:bg-blue-950/20">
                <input
                  type="file"
                  required
                  accept=".ofx,.csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#026CD6] dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800/80">
                    <FileText className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-xs sm:text-sm font-black text-[#46A302] dark:text-emerald-400">{file.name}</p>
                      <p className="text-[11px] font-bold text-slate-400">{(file.size / 1024).toFixed(1)} KB • Pronto para upload</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">Arraste ou clique para selecionar</p>
                      <p className="text-xs font-bold text-slate-400">Formatos aceitos: extrato bancário .ofx ou planilhas .csv, .xlsx, .xls</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opção de Fatura de Cartão de Crédito */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isCreditCard
                  ? 'bg-blue-50 dark:!bg-[#0f172a] border-[#026CD6] dark:!border-blue-500 shadow-sm'
                  : 'bg-slate-50 dark:!bg-[#1e293b]/70 border-slate-200 dark:!border-slate-700 hover:border-slate-300 dark:hover:!border-slate-600'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCreditCard}
                  onChange={(e) => setIsCreditCard(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#026CD6] focus:ring-[#026CD6]"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CreditCard
                      className={`h-4 w-4 shrink-0 ${
                        isCreditCard
                          ? 'text-[#026CD6] dark:!text-blue-400'
                          : 'text-slate-500 dark:!text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isCreditCard
                          ? 'text-slate-900 dark:!text-white'
                          : 'text-slate-800 dark:!text-slate-200'
                      }`}
                    >
                      É uma fatura de cartão de crédito
                    </span>
                    {isCreditCard && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-blue-100 dark:!bg-blue-900/60 text-[#026CD6] dark:!text-blue-300 border border-blue-200 dark:!border-blue-700/60 font-black">
                        Compras como Despesa
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] sm:text-xs leading-relaxed ${
                      isCreditCard
                        ? 'text-slate-700 dark:!text-slate-300 font-bold'
                        : 'text-slate-500 dark:!text-slate-400 font-bold'
                    }`}
                  >
                    Faturas de cartão costumam listar compras com valor positivo. Ao ativar esta opção, as compras entrarão corretamente como{' '}
                    <strong
                      className={
                        isCreditCard
                          ? 'text-slate-900 dark:!text-white font-black'
                          : 'text-slate-700 dark:!text-slate-200 font-black'
                      }
                    >
                      despesas (saídas)
                    </strong>{' '}
                    no seu fluxo, evitando saldo positivo indevido.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-duo btn-duo-white px-5 py-2.5 text-xs sm:text-sm font-black"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="btn-duo btn-duo-green px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
              >
                {loading ? 'Conciliando...' : 'Iniciar Importação'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
