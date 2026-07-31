require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkCount() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("No Supabase credentials found in .env");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching products:", error.message);
  } else {
    console.log("Total products in Supabase:", count);
  }
}

checkCount();
