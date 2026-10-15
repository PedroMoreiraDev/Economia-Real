-- =============================================================================
-- V6__allow_excel_import.sql: Suporte a Importação de Planilhas Excel (.xlsx e .xls)
-- =============================================================================

-- 1. Atualiza restrição de tipo de arquivo em import_batches para suportar 'EXCEL'
ALTER TABLE import_batches DROP CONSTRAINT IF EXISTS import_batches_file_type_check;
ALTER TABLE import_batches ADD CONSTRAINT import_batches_file_type_check CHECK (file_type IN ('CSV', 'OFX', 'EXCEL'));

-- 2. Atualiza restrição de origem em transactions para suportar 'EXCEL_IMPORT'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_origin_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_origin_check CHECK (origin IN ('MANUAL', 'CSV_IMPORT', 'OFX_IMPORT', 'EXCEL_IMPORT', 'AI_TEXT', 'AI_AUDIO'));
