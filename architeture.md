                      ┌───────────────────────┐
                      │   Shopify / WooCommerce│
                      │ (Client's Online Shops)│
                      └──────────┬────────────┘
                                 │ Webhooks + API Sync
                                 ▼
                      ┌───────────────────────┐
                      │     No-Limits SaaS     │
                      │ (Your Core Platform)   │
                      ├────────────────────────┤
                      │ DB + Business Logic    │
                      │ Order/Article/Returns  │
                      │ Multi-Tenancy          │
                      └──────────┬────────────┘
                                 │ FFN Merchant API Push
                                 ▼
                      ┌───────────────────────┐
                      │  JTL-FFN Merchant API │
                      │ (Tenant owned by client)
                      └──────────┬────────────┘
                                 │ Order Routing & Stock
                                 ▼
                      ┌───────────────────────┐
                      │   Warehouse Execution  │
                      │ (JTL WMS internally)   │
                      └───────────────────────┘