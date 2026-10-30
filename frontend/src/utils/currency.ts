/**
 * Utilitários Canônicos de Formatação Financeira
 * Garante aderência estrita às regras do domínio (BRL, 2 casas decimais, tratamento seguro de nulos)
 */

export function formatCurrency(amount: number | null | undefined): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  // Remove símbolos, espaços e converte pontuação pt-BR para padrão decimal
  const cleaned = value
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Divide valor parcelado garantindo que o resíduo indivisível fique na primeira parcela
 * (Regra Financeira Canônica de Integridade)
 */
export function calculateInstallments(totalAmount: number, installmentsCount: number): number[] {
  if (installmentsCount <= 0) return [];
  if (installmentsCount === 1) return [Math.round(totalAmount * 100) / 100];

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installmentsCount);
  const remainderCents = totalCents % installmentsCount;

  const result: number[] = [];
  for (let i = 0; i < installmentsCount; i++) {
    // Adiciona o resíduo à primeira parcela
    const cents = i === 0 ? baseCents + remainderCents : baseCents;
    result.push(cents / 100);
  }

  return result;
}
