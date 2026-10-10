package com.finance.ai.application.financial.export;

import com.finance.ai.domain.financial.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExportTransactionsCsvUseCase {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ExportTransactionsCsvUseCase(TransactionRepository transactionRepository,
                                        CategoryRepository categoryRepository,
                                        AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public byte[] execute(UUID authenticatedUserId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions;
        if (startDate != null && endDate != null) {
            transactions = transactionRepository.findAllByUserIdAndPeriod(authenticatedUserId, startDate, endDate);
        } else {
            transactions = transactionRepository.findAllByUserId(authenticatedUserId);
        }

        Map<UUID, String> categories = categoryRepository.findAllByUserIdOrSystemDefault(authenticatedUserId).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        Map<UUID, String> accounts = accountRepository.findAllByUserId(authenticatedUserId).stream()
                .collect(Collectors.toMap(Account::getId, Account::getName, (a, b) -> a));

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM para garantir compatibilidade com Microsoft Excel no Windows
        sb.append('\uFEFF');

        // Cabeçalho CSV
        sb.append("Data;Tipo;Descrição;Valor;Categoria;Conta;Status;Notas\n");

        for (var t : transactions) {
            String date = t.getAccrualDate().format(DATE_FORMATTER);
            String type = formatType(t.getType());
            String desc = escapeCsv(t.getDescription());
            String amount = t.getAmount().toString().replace('.', ',');
            String cat = t.getCategoryId() != null ? escapeCsv(categories.getOrDefault(t.getCategoryId(), "")) : "";
            String acc = t.getAccountId() != null ? escapeCsv(accounts.getOrDefault(t.getAccountId(), "")) : "";
            String status = t.getStatus() != null ? t.getStatus().name() : "";
            String notes = t.getNotes() != null ? escapeCsv(t.getNotes()) : "";

            sb.append(date).append(';')
              .append(type).append(';')
              .append(desc).append(';')
              .append(amount).append(';')
              .append(cat).append(';')
              .append(acc).append(';')
              .append(status).append(';')
              .append(notes).append('\n');
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String formatType(TransactionType type) {
        if (type == null) return "";
        return switch (type) {
            case INCOME -> "Receita";
            case EXPENSE -> "Despesa";
            case TRANSFER -> "Transferência";
            case INVOICE_PAYMENT -> "Pagamento de Fatura";
        };
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        String s = val.replace("\"", "\"\"");
        if (s.contains(";") || s.contains("\n") || s.contains("\"")) {
            return "\"" + s + "\"";
        }
        return s;
    }
}
