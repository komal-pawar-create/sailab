-- Remove duplicate foreign key constraints that cause PGRST201 ambiguity errors
-- These tables have both original FKs and duplicate fk_* named constraints

-- Drop duplicate test_reports foreign key
ALTER TABLE test_reports DROP CONSTRAINT IF EXISTS fk_test_reports_patient;

-- Drop duplicate documents foreign key  
ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_patient;

-- Drop duplicate feedback foreign key
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS fk_feedback_patient;

-- Drop duplicate bills foreign key
ALTER TABLE bills DROP CONSTRAINT IF EXISTS fk_bills_patient;