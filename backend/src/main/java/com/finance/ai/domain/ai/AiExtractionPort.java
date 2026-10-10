package com.finance.ai.domain.ai;

import java.util.List;

/**
 * Porta de domínio para extração de entidades financeiras via IA a partir de texto natural.
 */
public interface AiExtractionPort {

    /**
     * Interpreta uma mensagem em linguagem natural e retorna uma proposta estruturada de transação.
     *
     * @param naturalText Mensagem em linguagem natural do usuário (já com PII sanitizado)
     * @param availableCategories Lista de nomes de categorias existentes do usuário para guiar a classificação
     * @return Transação extraída estruturada
     */
    ExtractedTransaction extractFromText(String naturalText, List<String> availableCategories);
}
