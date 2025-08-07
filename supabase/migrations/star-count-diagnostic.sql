-- =====================================================
-- STAR COUNTING DIAGNOSTIC AND FIX SCRIPT
-- =====================================================
-- This script helps diagnose and fix star counting issues
-- in the Jongu Wellness project where star counts might be
-- inconsistent between tools.tool_data.stats.stars and 
-- actual stars recorded in user_documents
-- =====================================================

-- 1. DIAGNOSTIC QUERIES
-- =====================================================

-- Check current star counts in tools table
SELECT 
    id,
    slug,
    tool_data->>'name' as tool_name,
    tool_data->'stats'->>'stars' as stored_star_count,
    CASE 
        WHEN tool_data->'stats'->>'stars' IS NULL THEN 'NULL'
        WHEN tool_data->'stats'->>'stars' = '' THEN 'EMPTY STRING'
        WHEN tool_data->'stats'->>'stars' ~ '^[0-9]+$' THEN 'VALID NUMBER'
        ELSE 'INVALID FORMAT: ' || tool_data->'stats'->>'stars'
    END as star_count_status,
    created_at
FROM tools 
WHERE tool_data->>'is_active' = 'true'
ORDER BY tool_data->'stats'->>'stars' DESC NULLS LAST;

-- Count actual stars in user_documents for each tool
WITH actual_stars AS (
    SELECT 
        document_data->>'target_id' as tool_id,
        COUNT(*) as actual_star_count
    FROM user_documents 
    WHERE document_type = 'interaction'
    AND document_data->>'interaction_type' = 'star'
    AND document_data->>'target_type' = 'tool'
    GROUP BY document_data->>'target_id'
),
tool_info AS (
    SELECT 
        t.id,
        t.slug,
        t.tool_data->>'name' as tool_name,
        COALESCE(t.tool_data->'stats'->>'stars', '0') as stored_star_count
    FROM tools t
    WHERE t.tool_data->>'is_active' = 'true'
)
SELECT 
    ti.id,
    ti.slug,
    ti.tool_name,
    ti.stored_star_count,
    COALESCE(ast.actual_star_count, 0) as actual_star_count,
    CASE 
        WHEN ti.stored_star_count::int = COALESCE(ast.actual_star_count, 0) THEN '✓ MATCH'
        ELSE '✗ MISMATCH (diff: ' || (ti.stored_star_count::int - COALESCE(ast.actual_star_count, 0)) || ')'
    END as status
FROM tool_info ti
LEFT JOIN actual_stars ast ON ti.id = ast.tool_id
ORDER BY COALESCE(ast.actual_star_count, 0) DESC;

-- Check for duplicate stars (same user starring same tool multiple times)
SELECT 
    document_data->>'target_id' as tool_id,
    user_id,
    COUNT(*) as star_count,
    CASE 
        WHEN COUNT(*) > 1 THEN '✗ DUPLICATE STARS'
        ELSE '✓ OK'
    END as status,
    array_agg(id) as document_ids
FROM user_documents 
WHERE document_type = 'interaction'
AND document_data->>'interaction_type' = 'star'
AND document_data->>'target_type' = 'tool'
GROUP BY document_data->>'target_id', user_id
HAVING COUNT(*) > 1
ORDER BY star_count DESC;

-- Check data types and formats in star counts
SELECT 
    'Data Type Analysis' as analysis,
    COUNT(*) as total_tools,
    COUNT(CASE WHEN tool_data->'stats'->>'stars' IS NULL THEN 1 END) as null_counts,
    COUNT(CASE WHEN tool_data->'stats'->>'stars' = '' THEN 1 END) as empty_string_counts,
    COUNT(CASE WHEN tool_data->'stats'->>'stars' ~ '^[0-9]+$' THEN 1 END) as valid_number_counts,
    COUNT(CASE WHEN tool_data->'stats'->>'stars' !~ '^[0-9]+$' AND tool_data->'stats'->>'stars' IS NOT NULL AND tool_data->'stats'->>'stars' != '' THEN 1 END) as invalid_format_counts
FROM tools 
WHERE tool_data->>'is_active' = 'true';

-- 2. SAMPLE PROBLEMATIC RECORDS
-- =====================================================

-- Show tools with the most stars to investigate
SELECT 
    t.id,
    t.slug,
    t.tool_data->>'name' as tool_name,
    t.tool_data->'stats'->>'stars' as stored_stars,
    COUNT(ud.id) as actual_stars,
    array_agg(DISTINCT ud.user_id) as starring_users
FROM tools t
LEFT JOIN user_documents ud ON ud.document_data->>'target_id' = t.id 
    AND ud.document_type = 'interaction'
    AND ud.document_data->>'interaction_type' = 'star'
WHERE t.tool_data->>'is_active' = 'true'
GROUP BY t.id, t.slug, t.tool_data->>'name', t.tool_data->'stats'->>'stars'
HAVING COUNT(ud.id) > 0
ORDER BY COUNT(ud.id) DESC
LIMIT 10;

-- Show recent star activities
SELECT 
    ud.created_at,
    ud.user_id,
    ud.document_data->>'target_id' as tool_id,
    t.tool_data->>'name' as tool_name,
    ud.document_data
FROM user_documents ud
JOIN tools t ON t.id = ud.document_data->>'target_id'
WHERE ud.document_type = 'interaction'
AND ud.document_data->>'interaction_type' = 'star'
ORDER BY ud.created_at DESC
LIMIT 20;

-- 3. FIX SCRIPT
-- =====================================================
-- This will correct the star counts to match actual stars in user_documents

-- First, let's create a backup of current star counts
CREATE TABLE IF NOT EXISTS star_count_backup AS 
SELECT 
    id,
    slug,
    tool_data->>'name' as tool_name,
    tool_data->'stats'->>'stars' as original_star_count,
    NOW() as backup_created_at
FROM tools 
WHERE tool_data->>'is_active' = 'true';

-- Now fix the star counts
WITH correct_star_counts AS (
    SELECT 
        t.id as tool_id,
        COUNT(ud.id) as correct_count
    FROM tools t
    LEFT JOIN user_documents ud ON ud.document_data->>'target_id' = t.id::text
        AND ud.document_type = 'interaction'
        AND ud.document_data->>'interaction_type' = 'star'
        AND ud.document_data->>'target_type' = 'tool'
    WHERE t.tool_data->>'is_active' = 'true'
    GROUP BY t.id
)
UPDATE tools 
SET tool_data = jsonb_set(
    jsonb_set(
        COALESCE(tool_data, '{}'::jsonb),
        '{stats}',
        COALESCE(tool_data->'stats', '{}'::jsonb)
    ),
    '{stats,stars}',
    to_jsonb(csc.correct_count::text)
)
FROM correct_star_counts csc
WHERE tools.id = csc.tool_id;

-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify the fix worked
WITH actual_stars AS (
    SELECT 
        document_data->>'target_id' as tool_id,
        COUNT(*) as actual_star_count
    FROM user_documents 
    WHERE document_type = 'interaction'
    AND document_data->>'interaction_type' = 'star'
    AND document_data->>'target_type' = 'tool'
    GROUP BY document_data->>'target_id'
),
tool_info AS (
    SELECT 
        t.id,
        t.slug,
        t.tool_data->>'name' as tool_name,
        COALESCE(t.tool_data->'stats'->>'stars', '0') as stored_star_count
    FROM tools t
    WHERE t.tool_data->>'is_active' = 'true'
)
SELECT 
    'POST-FIX VERIFICATION' as status,
    COUNT(*) as total_tools,
    COUNT(CASE WHEN ti.stored_star_count::int = COALESCE(ast.actual_star_count, 0) THEN 1 END) as matching_counts,
    COUNT(CASE WHEN ti.stored_star_count::int != COALESCE(ast.actual_star_count, 0) THEN 1 END) as mismatched_counts
FROM tool_info ti
LEFT JOIN actual_stars ast ON ti.id = ast.tool_id;

-- Show final star counts after fix
SELECT 
    ti.id,
    ti.slug,
    ti.tool_name,
    ti.stored_star_count,
    COALESCE(ast.actual_star_count, 0) as actual_star_count,
    CASE 
        WHEN ti.stored_star_count::int = COALESCE(ast.actual_star_count, 0) THEN '✓ FIXED'
        ELSE '✗ STILL MISMATCH'
    END as status
FROM (
    SELECT 
        t.id,
        t.slug,
        t.tool_data->>'name' as tool_name,
        COALESCE(t.tool_data->'stats'->>'stars', '0') as stored_star_count
    FROM tools t
    WHERE t.tool_data->>'is_active' = 'true'
) ti
LEFT JOIN (
    SELECT 
        document_data->>'target_id' as tool_id,
        COUNT(*) as actual_star_count
    FROM user_documents 
    WHERE document_type = 'interaction'
    AND document_data->>'interaction_type' = 'star'
    AND document_data->>'target_type' = 'tool'
    GROUP BY document_data->>'target_id'
) ast ON ti.id = ast.tool_id
ORDER BY COALESCE(ast.actual_star_count, 0) DESC;

-- 5. CLEANUP DUPLICATE STARS (if any found)
-- =====================================================

-- Remove duplicate stars (keeping the oldest one for each user+tool combination)
WITH duplicate_stars AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, document_data->>'target_id' 
            ORDER BY created_at ASC
        ) as rn
    FROM user_documents 
    WHERE document_type = 'interaction'
    AND document_data->>'interaction_type' = 'star'
    AND document_data->>'target_type' = 'tool'
)
DELETE FROM user_documents 
WHERE id IN (
    SELECT id FROM duplicate_stars WHERE rn > 1
);

-- Re-run the fix after cleaning duplicates (if any were found)
WITH correct_star_counts AS (
    SELECT 
        t.id as tool_id,
        COUNT(ud.id) as correct_count
    FROM tools t
    LEFT JOIN user_documents ud ON ud.document_data->>'target_id' = t.id::text
        AND ud.document_type = 'interaction'
        AND ud.document_data->>'interaction_type' = 'star'
        AND ud.document_data->>'target_type' = 'tool'
    WHERE t.tool_data->>'is_active' = 'true'
    GROUP BY t.id
)
UPDATE tools 
SET tool_data = jsonb_set(
    jsonb_set(
        COALESCE(tool_data, '{}'::jsonb),
        '{stats}',
        COALESCE(tool_data->'stats', '{}'::jsonb)
    ),
    '{stats,stars}',
    to_jsonb(csc.correct_count::text)
)
FROM correct_star_counts csc
WHERE tools.id = csc.tool_id;

-- Final verification message
SELECT 
    'STAR COUNT FIX COMPLETED' as message,
    'Check the verification queries above to confirm all counts are now correct' as instruction,
    'Backup of original counts saved in star_count_backup table' as backup_info;