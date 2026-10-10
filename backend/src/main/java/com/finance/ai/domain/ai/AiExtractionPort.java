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

    /**
     * Classifica o nome da categoria mais adequada para um estabelecimento ou lançamento de extrato via IA.
     *
     * @param rawDescription Descrição bruta da transação ou nome do estabelecimento
     * @param availableCategories Categorias válidas disponíveis no perfil do usuário
     * @return Nome da categoria selecionada ou null se desconhecido/duvidoso
     */
    default String classifyMerchant(String rawDescription, List<String> availableCategories) {
        return null;
    }
}
