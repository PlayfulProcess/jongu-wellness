#!/usr/bin/env node

/**
 * Star Count Diagnostic and Fix Script
 * 
 * This script checks for star count inconsistencies and fixes them
 * by recalculating star counts from actual user_documents records.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from multiple possible files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isVerbose = process.argv.includes('--verbose');

  console.log('🔍 Star Count Diagnostic Script');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('=====================================\n');

  try {
    // 1. Get all tools with their current star counts
    console.log('📊 Fetching all tools...');
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, slug, tool_data')
      .eq('tool_data->>is_active', 'true');

    if (toolsError) throw toolsError;
    console.log(`Found ${tools?.length || 0} active tools\n`);

    // 2. Get all star interactions
    console.log('⭐ Fetching all star interactions...');
    const { data: stars, error: starsError } = await supabase
      .from('user_documents')
      .select('user_id, document_data, created_at')
      .eq('document_type', 'interaction')
      .eq('document_data->>interaction_type', 'star');

    if (starsError) throw starsError;
    console.log(`Found ${stars?.length || 0} star records\n`);

    const issues = [];
    const fixes = [];

    // 3. Check each tool for star count accuracy
    console.log('🔍 Analyzing star counts...\n');
    
    for (const tool of tools || []) {
      const toolId = tool.id;
      const currentStarCount = parseInt(tool.tool_data?.stats?.stars || '0');
      
      // Count actual stars for this tool
      const actualStars = (stars || []).filter(star => 
        star.document_data?.target_id === toolId
      );
      
      const actualStarCount = actualStars.length;
      
      // Check for duplicates (same user starring multiple times)
      const uniqueUsers = new Set();
      const duplicates = [];
      
      actualStars.forEach(star => {
        if (uniqueUsers.has(star.user_id)) {
          duplicates.push(star);
        } else {
          uniqueUsers.add(star.user_id);
        }
      });
      
      const uniqueStarCount = uniqueUsers.size;
      
      if (isVerbose || currentStarCount !== uniqueStarCount || duplicates.length > 0) {
        console.log(`🛠️  Tool: ${tool.slug || tool.id}`);
        console.log(`   Stored count: ${currentStarCount}`);
        console.log(`   Actual count: ${actualStarCount}`);
        console.log(`   Unique count: ${uniqueStarCount}`);
        console.log(`   Duplicates: ${duplicates.length}`);
        
        if (currentStarCount !== uniqueStarCount) {
          console.log(`   ❌ MISMATCH: Stored=${currentStarCount}, Unique=${uniqueStarCount}`);
          issues.push({
            toolId,
            slug: tool.slug,
            stored: currentStarCount,
            actual: uniqueStarCount
          });
          
          fixes.push({
            toolId,
            slug: tool.slug,
            newStarCount: uniqueStarCount,
            toolData: {
              ...tool.tool_data,
              stats: {
                ...tool.tool_data?.stats,
                stars: uniqueStarCount.toString()
              }
            }
          });
        }
        
        if (duplicates.length > 0) {
          console.log(`   🔄 Found ${duplicates.length} duplicate stars to remove`);
        }
        
        console.log('');
      }
    }

    // 4. Summary
    console.log('📋 Summary:');
    console.log(`Total tools: ${tools?.length || 0}`);
    console.log(`Total star records: ${stars?.length || 0}`);
    console.log(`Tools with star count issues: ${issues.length}`);
    console.log('');

    if (issues.length === 0) {
      console.log('✅ All star counts are accurate!');
      return;
    }

    // 5. Show issues
    console.log('❌ Issues found:');
    issues.forEach(issue => {
      console.log(`   ${issue.slug}: stored=${issue.stored}, actual=${issue.actual}`);
    });
    console.log('');

    // 6. Apply fixes (if not dry run)
    if (isDryRun) {
      console.log('🔍 DRY RUN: No changes made. Run without --dry-run to apply fixes.');
    } else {
      console.log('🔧 Applying fixes...');
      
      for (const fix of fixes) {
        try {
          const { error } = await supabase
            .from('tools')
            .update({ tool_data: fix.toolData })
            .eq('id', fix.toolId);
          
          if (error) throw error;
          console.log(`   ✅ Fixed ${fix.slug}: ${fix.newStarCount} stars`);
        } catch (error) {
          console.error(`   ❌ Failed to fix ${fix.slug}:`, error.message);
        }
      }
      
      console.log('\n✅ Star count fixes applied!');
      console.log('🔄 You may need to refresh your frontend to see the changes.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };