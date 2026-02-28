-- Reset interview usage for user
-- Run this in your database console (Neon, etc.)

UPDATE "User"
SET "monthlyUsage" = jsonb_set(
    COALESCE("monthlyUsage", '{}'::jsonb),
    '{interview}',
    '0'
)
WHERE id = '5f171aca-921a-499b-aee3-e85c77782c39';

-- Verify the update
SELECT id, email, plan, "monthlyUsage"
FROM "User"
WHERE id = '5f171aca-921a-499b-aee3-e85c77782c39';
