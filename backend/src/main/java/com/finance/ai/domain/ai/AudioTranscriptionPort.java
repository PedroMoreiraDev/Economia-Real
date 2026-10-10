package com.finance.ai.domain.ai;

/**
 * Porta de domínio para transcrição de áudio em linguagem natural.
 */
public interface AudioTranscriptionPort {

    /**
     * Converte um stream ou array de bytes de áudio de voz em texto.
     *
     * @param audioBytes Conteúdo binário do áudio
     * @param contentType Tipo MIME do áudio (ex: audio/webm, audio/mp3, audio/wav, audio/ogg)
     * @return Texto transcrito da fala
     */
    String transcribeAudio(byte[] audioBytes, String contentType);
}
