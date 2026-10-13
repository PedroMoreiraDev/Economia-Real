import React, { useState, useEffect, useRef } from 'react';

/**
 * Converte um valor em centavos (inteiro) para a representação BRL formatada: "0,01", "1,76", "176,00"
 */
export function centsToFormattedBrl(cents: number): string {
  const val = cents / 100;
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte um valor numérico ou textual recebido (ex: 176, "176.00", "176,00") para centavos inteiros (ex: 17600).
 */
export function parseRawToCents(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    return Math.round(val * 100);
  }
  const str = val.toString().trim();
  if (!str) return 0;

  // Se já tem vírgula brasileira (ex: "176,50" ou "1.250,50")
  if (str.includes(',')) {
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Se for string numérica decimal com ponto ou inteira (ex: "176.50" ou "176")
  const parsed = parseFloat(str);
  if (!isNaN(parsed)) {
    return Math.round(parsed * 100);
  }

  // Fallback caso venha com símbolos ou formatação mista
  const digitsOnly = str.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  return parseInt(digitsOnly, 10) || 0;
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | undefined | null;
  onChangeValue: (numericValue: number) => void;
  prefix?: string;
  hidePrefix?: boolean;
}

/**
 * Input com máscara financeira estilo ATM / Maquininha de Cartão.
 * Os dígitos entram a partir dos centavos (da direita para a esquerda):
 * 1 -> 0,01
 * 7 -> 0,17
 * 6 -> 01,76
 * 0 -> 17,60
 * 0 -> 176,00
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChangeValue,
  prefix = 'R$',
  hidePrefix = false,
  className = '',
  disabled,
  placeholder = '0,00',
  ...restProps
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const cents = parseRawToCents(value);
    return cents > 0 ? centsToFormattedBrl(cents) : '';
  });

  // Sincroniza quando o valor externo mudar (ex: ao abrir modal de edição ou resetar formulário)
  useEffect(() => {
    const cents = parseRawToCents(value);
    const formatted = cents > 0 ? centsToFormattedBrl(cents) : '';
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extrai apenas os dígitos numéricos digitados pelo usuário
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const cents = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    const numValue = cents / 100;

    // Se o usuário apagou tudo (cents === 0), deixamos vazio ou "0,00"
    const nextDisplay = cents > 0 ? centsToFormattedBrl(cents) : '';
    setDisplayValue(nextDisplay);
    onChangeValue(numValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Posiciona o cursor sempre no final para digitação fluida da maquininha
    const len = e.target.value.length;
    e.target.setSelectionRange(len, len);
    if (restProps.onFocus) {
      restProps.onFocus(e);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {!hidePrefix && (
        <span className="absolute left-3.5 text-xs font-black text-slate-400 select-none pointer-events-none font-numeric">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`w-full font-numeric font-black text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
          !hidePrefix ? 'pl-10 pr-4' : 'px-4'
        } ${className}`}
        {...restProps}
      />
    </div>
  );
};

export interface InlineCurrencyInputProps {
  initialValue: number;
  onSave: (newValue: number) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

/**
 * Input inline compacto para edição rápida de valores monetários em tabelas e listas.
 * Utiliza o mesmo deslocamento de centavos ATM / maquininha e salva na perda de foco ou Enter.
 */
export const InlineCurrencyInput: React.FC<InlineCurrencyInputProps> = ({
  initialValue,
  onSave,
  disabled = false,
  className = '',
  title = 'Clique para editar o valor rapidamente',
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    centsToFormattedBrl(parseRawToCents(initialValue))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(centsToFormattedBrl(parseRawToCents(initialValue)));
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const cents = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    setDisplayValue(centsToFormattedBrl(cents));
  };

  const handleBlur = () => {
    const digitsOnly = displayValue.replace(/\D/g, '');
    const cents = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    const finalValue = cents / 100;

    if (finalValue > 0 && Math.abs(finalValue - initialValue) > 0.001) {
      onSave(finalValue);
    } else {
      // Reverte para o valor original se for 0 ou inalterado
      setDisplayValue(centsToFormattedBrl(parseRawToCents(initialValue)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setDisplayValue(centsToFormattedBrl(parseRawToCents(initialValue)));
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      title={title}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};
