import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyInput, calculateInstallments } from './currency';

describe('Financial Domain Utilities', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor positivo corretamente em Reais (BRL)', () => {
      const formatted = formatCurrency(1250.5);
      // Suporta caracteres com espaço não separável normal no pt-BR (\u00a0 ou \u202f)
      expect(formatted).toMatch(/R\$\s*1\.250,50/);
    });

    it('deve formatar zero e valores nulos/indefinidos com segurança', () => {
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(null)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(undefined)).toMatch(/R\$\s*0,00/);
    });

    it('deve formatar valores negativos', () => {
      const formatted = formatCurrency(-50.25);
      expect(formatted).toMatch(/-R\$\s*50,25/);
    });
  });

  describe('parseCurrencyInput', () => {
    it('deve converter strings no formato brasileiro para número flutuante limpo', () => {
      expect(parseCurrencyInput('1.250,50')).toBe(1250.5);
      expect(parseCurrencyInput('R$ 49,90')).toBe(49.9);
      expect(parseCurrencyInput('100')).toBe(100);
      expect(parseCurrencyInput('')).toBe(0);
    });
  });

  describe('calculateInstallments (Regra de Integridade Financeira)', () => {
    it('deve alocar o resíduo indivisível na primeira parcela', () => {
      // 100 dividido em 3 parcelas: 33,34 + 33,33 + 33,33 = 100,00
      const parcels = calculateInstallments(100, 3);
      expect(parcels).toHaveLength(3);
      expect(parcels[0]).toBe(33.34);
      expect(parcels[1]).toBe(33.33);
      expect(parcels[2]).toBe(33.33);

      const totalSum = parcels.reduce((acc, curr) => acc + curr, 0);
      expect(Math.round(totalSum * 100) / 100).toBe(100.0);
    });

    it('deve dividir perfeitamente quando não houver resíduo', () => {
      const parcels = calculateInstallments(120, 3);
      expect(parcels).toEqual([40, 40, 40]);
    });

    it('deve tratar 1 parcela retornando o valor exato', () => {
      const parcels = calculateInstallments(55.55, 1);
      expect(parcels).toEqual([55.55]);
    });
  });
});
