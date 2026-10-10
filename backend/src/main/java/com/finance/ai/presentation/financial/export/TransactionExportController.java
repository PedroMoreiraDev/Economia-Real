package com.finance.ai.presentation.financial.export;

import com.finance.ai.application.financial.export.ExportTransactionsCsvUseCase;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions/export")
@Tag(name = "Exportação de Transações", description = "Exportação de relatórios e extratos contábeis em formato CSV")
@SecurityRequirement(name = "bearerAuth")
public class TransactionExportController {

    private final ExportTransactionsCsvUseCase exportTransactionsCsvUseCase;

    public TransactionExportController(ExportTransactionsCsvUseCase exportTransactionsCsvUseCase) {
        this.exportTransactionsCsvUseCase = exportTransactionsCsvUseCase;
    }

    @GetMapping("/csv")
    @Operation(summary = "Exporta o extrato de transações em formato CSV (compatível com Excel)")
    public ResponseEntity<byte[]> exportCsv(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        byte[] csvBytes = exportTransactionsCsvUseCase.execute(user.userId(), startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "extrato-transacoes.csv");
        headers.setContentLength(csvBytes.length);

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
}
