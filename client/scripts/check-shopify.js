require('dotenv').config({ path: './.env' });

async function checkShopifyProducts() {
  const storeDomain = process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "house-of-shirts-ng.myshopify.com"; 
  // wait I need the access token, which is usually stored in supabase secrets or env
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("No Shopify access token found in .env");
    return;
  }

  let url = `https://${storeDomain}/admin/api/2026-07/products/count.json?status=any`;
  try {
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      }
    });
    const data = await res.json();
    console.log("Total products count from Shopify API:", data);
  } catch (e) {
    console.error(e);
  }
}

checkShopifyProducts();
