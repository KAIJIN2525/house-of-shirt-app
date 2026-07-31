# Shopify Sync Backend Contract

This mobile app is ready to talk to a secure backend layer instead of calling Shopify Admin APIs directly.

## Environment

Add these values to your Expo env setup:

```env
EXPO_PUBLIC_SHOPIFY_SYNC_API_URL=https://your-backend.example.com/api
EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN=house-of-shirts.myshopify.com
```

The mobile app should only talk to your backend. Keep Shopify Admin tokens on the server.

## Required Endpoints

### `GET /shopify/sync/status`

Response:

```json
{
  "syncState": {
    "storeDomain": "house-of-shirts.myshopify.com",
    "warningActive": true,
    "warningTitle": "WARNING | LATENCY DETECTED",
    "warningMessage": "Collection webhooks are delayed by 4h.",
    "syncingInRealtime": true,
    "lastSuccessfulSync": "Today, 14:22:04",
    "lastForceSync": "Apr 12, 2026 - 14:22",
    "syncedOrders": 1240,
    "syncedCustomers": 3870,
    "syncedProducts": 248,
    "collectionDelayHours": 4,
    "webhooks": [
      {
        "id": "shopify-wh-1",
        "topic": "orders/create",
        "successRate": 99.7,
        "latencyMs": 142,
        "status": "Healthy"
      }
    ]
  },
  "logs": []
}
```

### `POST /shopify/sync/run`

Response:

```json
{
  "syncState": {},
  "log": {},
  "customers": [
    {
      "name": "Amina Rhodes",
      "email": "amina@example.com",
      "phone": "+2348035550184",
      "city": "Lagos",
      "country": "Nigeria",
      "tag": "VIP"
    }
  ],
  "orders": [
    {
      "id": "HS-90012",
      "customerName": "Amina Rhodes",
      "customerPhone": "+2348035550184",
      "title": "Poplin Atelier Shirt",
      "subtitle": "SIZE 14.5 | WHITE COTTON",
      "total": 265000,
      "image": "https://...",
      "placedOn": "Apr 12, 2026",
      "paymentMethod": "Pay on Delivery"
    }
  ],
  "products": [
    {
      "id": "shopify-101",
      "name": "The Essential White Poplin",
      "image": "https://...",
      "images": ["https://..."],
      "price": 145000,
      "category": "Shirts",
      "brand": "House of Shirts",
      "rating": 4.8,
      "description": "Signature poplin shirt.",
      "sizes": ["15.5", "16", "16.5"],
      "colors": ["White"]
    }
  ]
}
```

## Notes

- `products` should be the normalized storefront-ready catalog data.
- `orders` and `customers` should be deduplicated server-side when possible.
- Webhook receivers should update your backend store first, then this mobile client can read the normalized sync state.
