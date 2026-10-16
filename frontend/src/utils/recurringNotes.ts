/**
 * Utilitário para higienização e exibição amigável de notas de transações.
 * Remove prefixos técnicos de auditoria (ex: RECURRING_BILL:uuid, RECURRING_EXPENSE:uuid, RECURRING_INCOME:uuid)
 * e descrições automáticas redundantes para o usuário final no extrato e em modais.
 */
export function cleanTransactionNotes(rawNotes?: string | null, description?: string): string {
  if (!rawNotes || !rawNotes.trim()) return '';

  let text = rawNotes.trim();

  // 1. Se contiver pipe '|', o conteúdo após o pipe geralmente é a anotação humana
  if (text.includes('|')) {
    const afterPipe = text.split('|').slice(1).join('|').trim();
    if (afterPipe) {
      text = afterPipe;
    }
  }

  // 2. Remove prefixos técnicos de UUID e identificadores de backend
  text = text
    .replace(/^RECURRING_BILL:[a-f0-9\-]+/i, '')
    .replace(/^RECURRING_EXPENSE:[a-f0-9\-]+/i, '')
    .replace(/^RECURRING_INCOME:[a-f0-9\-]+/i, '')
    .trim();

  // 3. Remove fração técnica no início (ex: "(1/12)", "(35/36)")
  text = text.replace(/^\(\d+\/\d+\)\s*/, '').trim();

  // 4. Remove traços, hífens ou pontuações que sobraram no início
  text = text.replace(/^[\s\-\|:]+/, '').trim();

  // 5. Trata geradores automáticos padrão como "Lançamento da despesa fixa: aluguel"
  const billMatch = text.match(/^lançamento d[aeo] (?:despesa fixa|custo fixo):?\s*(.*)$/i);
  if (billMatch) {
    const billDesc = billMatch[1]?.trim();
    if (!billDesc || (description && billDesc.toLowerCase() === description.toLowerCase().trim())) {
      return 'Custo fixo programado';
    }
    return `Custo fixo: ${billDesc}`;
  }

  // 6. Trata notas genéricas de despesas ou receitas recorrentes
  if (text.toLowerCase() === 'despesa recorrente programada' || text.toLowerCase() === 'despesa recorrente projetada') {
    return 'Despesa recorrente';
  }
  if (text.toLowerCase() === 'entrada recorrente projetada' || text.toLowerCase() === 'receita recorrente programada') {
    return 'Renda recorrente';
  }

  // 7. Se for estritamente igual à descrição da movimentação, omite para evitar redundância
  if (description && text.toLowerCase() === description.toLowerCase().trim()) {
    return '';
  }

  return text;
}
