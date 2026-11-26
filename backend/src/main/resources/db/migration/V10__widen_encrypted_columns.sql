-- V10__widen_encrypted_columns.sql
-- Ampliação das colunas description para tipo TEXT para suportar payload cifrado com AES-256-GCM (Base64) sem risco de estouro de limite.

ALTER TABLE transactions ALTER COLUMN description TYPE TEXT;
ALTER TABLE recurring_bills ALTER COLUMN description TYPE TEXT;

