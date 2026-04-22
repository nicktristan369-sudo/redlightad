const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, country, city, premium_tier')
    .eq('status', 'active')
    .or('premium_tier.in.(vip,featured,basic)')
    .limit(20);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Premium listings:');
  data.forEach(l => {
    console.log(`- ${l.title}: country="${l.country}", city="${l.city}", tier=${l.premium_tier}`);
  });
}

check();
