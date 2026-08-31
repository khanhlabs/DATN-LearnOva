-- ReportCategory is looked up by a stable code when a learner submits a report.
-- Keep existing production categories by assigning each a unique legacy code
-- before enforcing the new non-null/unique constraints.
ALTER TABLE report_categories
    ADD COLUMN code TEXT;

UPDATE report_categories
SET code = 'LEGACY_' || category_id
WHERE code IS NULL;

ALTER TABLE report_categories
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE report_categories
    ADD CONSTRAINT uk_report_categories_code UNIQUE (code);
