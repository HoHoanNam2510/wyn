-- Normalize all existing word terms: first letter uppercase, rest lowercase
UPDATE "Word"
SET "term" = UPPER(SUBSTRING("term", 1, 1)) || LOWER(SUBSTRING("term", 2))
WHERE "term" IS NOT NULL AND LENGTH("term") > 0;
