#!/usr/bin/env node
/**
 * Migration script: Push Points system
 * Uses Supabase service role via @supabase/supabase-js
 */
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://kkkqvhfgjofppimwxtub.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtra3F2aGZnam9mcHBpbXd4dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMzNzEzMCwiZXhwIjoyMDg4OTEzMTMwfQ.P3LPxmU4KOaeZxaIaFYW8i7zbYdXsmyfu0sHeBrIMf8'
)

async function migrate() {
  // Test: try to read wallets table push_points column
  const { data, error } = await supabase
    .from('wallets')
    .select('push_points')
    .limit(1)
  
  if (error && error.code === 'PGRST116') {
    console.log('push_points column not found — need direct SQL migration')
  } else if (error) {
    console.log('wallets query error:', error.message)
  } else {
    console.log('push_points column EXISTS:', JSON.stringify(data))
  }

  // Test push_point_purchases table
  const { error: e2 } = await supabase.from('push_point_purchases').select('id').limit(1)
  if (e2) {
    console.log('push_point_purchases:', e2.message)
  } else {
    console.log('push_point_purchases table EXISTS')
  }

  // Test push_history table
  const { error: e3 } = await supabase.from('push_history').select('id').limit(1)
  if (e3) {
    console.log('push_history:', e3.message)
  } else {
    console.log('push_history table EXISTS')
  }
}

migrate()
