-- Phase 6: store rejection explanation alongside document records
ALTER TABLE document_records ADD COLUMN IF NOT EXISTS rejection_explanation JSONB;
