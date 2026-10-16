package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ListTransactionsUseCase {

    private final TransactionRepository transactionRepository;

    public ListTransactionsUseCase(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<Transaction> execute(UUID userId, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return transactionRepository.findAllByUserIdAndPeriod(userId, startDate, endDate);
        }
        return transactionRepository.findAllByUserId(userId);
    }

    public record RecurringProgress(int current, int total, int remaining) {}

    private static final java.util.regex.Pattern NOTES_FRACTION_PATTERN = java.util.regex.Pattern.compile("\\((\\d+)/(\\d+)\\)");
    private final com.finance.ai.domain.financial.importer.InstallmentDetector installmentDetector = new com.finance.ai.domain.financial.importer.InstallmentDetector();

    @Transactional(readOnly = true)
    public java.util.Map<UUID, RecurringProgress> getRecurringProgressMap(UUID userId, List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return java.util.Map.of();
        }

        java.util.Map<UUID, RecurringProgress> result = new java.util.HashMap<>();
        java.util.Set<String> uniquePrefixes = new java.util.HashSet<>();

        for (Transaction t : transactions) {
            // 1. Detecção direta na descrição (ex: "Parcela 5/6", "5/6", "Havan 3/5")
            var matchOpt = installmentDetector.detect(t.getDescription());
            if (matchOpt.isPresent()) {
                var m = matchOpt.get();
                if (m.total() > 1) {
                    int current = m.current();
                    int total = m.total();
                    int remaining = Math.max(0, total - current);
                    result.put(t.getId(), new RecurringProgress(current, total, remaining));
                    continue;
                }
            }

            // 2. Detecção nas notas se contiver fração "(X/Y)"
            if (t.getNotes() != null) {
                var notesMatcher = NOTES_FRACTION_PATTERN.matcher(t.getNotes());
                if (notesMatcher.find()) {
                    try {
                        int current = Integer.parseInt(notesMatcher.group(1));
                        int total = Integer.parseInt(notesMatcher.group(2));
                        if (total > 1) {
                            int remaining = Math.max(0, total - current);
                            result.put(t.getId(), new RecurringProgress(current, total, remaining));
                            continue;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }

            // 3. Coleta prefixo para cálculo determinístico por grupo
            String prefix = UpdateTransactionUseCase.extractRecurringPrefix(t.getNotes());
            if (prefix != null) {
                uniquePrefixes.add(prefix);
            }
        }

        // 4. Agrupamento para transações recorrentes sem numeração explícita
        for (String prefix : uniquePrefixes) {
            List<Transaction> groupTxs = transactionRepository.findAllByUserIdAndNotesStartingWith(userId, prefix);
            if (groupTxs != null && groupTxs.size() > 1) {
                List<Transaction> sorted = groupTxs.stream()
                        .sorted(java.util.Comparator.comparing(Transaction::getAccrualDate)
                                .thenComparing(Transaction::getCreatedAt))
                        .toList();

                int total = sorted.size();
                for (int i = 0; i < total; i++) {
                    Transaction t = sorted.get(i);
                    if (!result.containsKey(t.getId())) {
                        int current = i + 1;
                        int remaining = total - current;
                        result.put(t.getId(), new RecurringProgress(current, total, remaining));
                    }
                }
            }
        }

        return result;
    }
}
