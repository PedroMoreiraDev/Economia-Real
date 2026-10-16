package com.finance.ai.presentation.financial.importer;

import com.finance.ai.application.financial.importer.ImportBankStatementUseCase;
import com.finance.ai.application.financial.importer.ImportStatementResult;
import com.finance.ai.application.financial.importer.ListImportBatchesUseCase;
import com.finance.ai.domain.financial.importer.ImportBatch;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/imports")
@Tag(name = "Importação de Extratos", description = "Upload e conciliação de arquivos OFX, CSV e planilhas Excel (XLSX/XLS) bancários")
@SecurityRequirement(name = "bearerAuth")
public class ImportStatementController {

    private final ImportBankStatementUseCase importUseCase;
    private final ListImportBatchesUseCase listBatchesUseCase;

    public ImportStatementController(ImportBankStatementUseCase importUseCase,
                                     ListImportBatchesUseCase listBatchesUseCase) {
        this.importUseCase = importUseCase;
        this.listBatchesUseCase = listBatchesUseCase;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Faz upload de extrato OFX, CSV ou Excel (.xlsx, .xls) e importa lançamentos com deduplicação")
    public ResponseEntity<ImportStatementResult> upload(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "accountId", required = false) UUID accountId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isCreditCard", required = false) Boolean isCreditCard) throws IOException {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de extrato está vazio.");
        }

        // Validação de limite máximo de 10MB para mitigar ataques de negação de serviço (DoS/OOM)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("O arquivo de extrato excede o limite máximo permitido de 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) originalFilename = "extrato.csv";

        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".ofx") && !lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
            throw new IllegalArgumentException("Formato não suportado. Envie apenas arquivos .ofx, .csv, .xlsx ou .xls.");
        }

        byte[] fileBytes = file.getBytes();
        validateFileIntegrity(originalFilename, fileBytes);

        var result = (isCreditCard != null)
                ? importUseCase.execute(user.userId(), accountId, originalFilename, fileBytes, isCreditCard)
                : importUseCase.execute(user.userId(), accountId, originalFilename, fileBytes);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    @Operation(summary = "Lista o histórico de lotes de importação do usuário")
    public ResponseEntity<List<BatchResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var batches = listBatchesUseCase.execute(user.userId());
        var response = batches.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    private BatchResponse toResponse(ImportBatch b) {
        return new BatchResponse(
                b.getId().toString(),
                b.getAccountId().toString(),
                b.getFileName(),
                b.getFileType(),
                b.getImportedCount(),
                b.getSkippedCount(),
                b.getStatus(),
                b.getCreatedAt().toString()
        );
    }

    public record BatchResponse(
            String id,
            String accountId,
            String fileName,
            String fileType,
            int importedCount,
            int skippedCount,
            String status,
            String createdAt
    ) {}

    private void validateFileIntegrity(String filename, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("O arquivo de extrato está vazio.");
        }

        // Bloqueio imediato de executáveis comuns (Windows PE/MZ, Linux ELF, Java Bytecode)
        if (bytes.length >= 2 && bytes[0] == 0x4D && bytes[1] == 0x5A) { // MZ
            throw new IllegalArgumentException("Arquivo inválido: binários executáveis não são permitidos.");
        }
        if (bytes.length >= 4 && bytes[0] == 0x7F && bytes[1] == 0x45 && bytes[2] == 0x4C && bytes[3] == 0x46) { // ELF
            throw new IllegalArgumentException("Arquivo inválido: binários executáveis não são permitidos.");
        }
        if (bytes.length >= 4 && (bytes[0] & 0xFF) == 0xCA && (bytes[1] & 0xFF) == 0xFE && (bytes[2] & 0xFF) == 0xBA && (bytes[3] & 0xFF) == 0xBE) { // CAFEBABE
            throw new IllegalArgumentException("Arquivo inválido: binários compilados não são permitidos.");
        }

        String lower = filename.toLowerCase();
        if (lower.endsWith(".xlsx")) {
            // XLSX é um container ZIP (PK\x03\x04 ou PK\x05\x06)
            if (bytes.length < 4 || !(bytes[0] == 0x50 && bytes[1] == 0x4B && (bytes[2] == 0x03 || bytes[2] == 0x05))) {
                throw new IllegalArgumentException("O arquivo informado não possui a estrutura válida de uma planilha XLSX.");
            }
        } else if (lower.endsWith(".xls")) {
            // XLS legado é OLE2 Compound Document (D0 CF 11 E0)
            if (bytes.length < 4 || !((bytes[0] & 0xFF) == 0xD0 && (bytes[1] & 0xFF) == 0xCF && (bytes[2] & 0xFF) == 0x11 && (bytes[3] & 0xFF) == 0xE0)) {
                throw new IllegalArgumentException("O arquivo informado não possui a estrutura válida de uma planilha XLS legada.");
            }
        } else if (lower.endsWith(".ofx") || lower.endsWith(".csv")) {
            // Arquivos de texto não devem conter caracteres nulos binários nos primeiros 512 bytes
            int checkLen = Math.min(bytes.length, 512);
            for (int i = 0; i < checkLen; i++) {
                if (bytes[i] == 0) {
                    throw new IllegalArgumentException("O arquivo de extrato contém dados binários corrompidos ou inválidos.");
                }
            }
        }
    }
}
