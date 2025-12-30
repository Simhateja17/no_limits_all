---
title: REST Admin API reference
description: >-
  The Admin API lets you build apps and integrations that extend and enhance the
  Shopify admin. Learn how to get started with REST endpoints.
api_version: 2025-10
api_name: admin-rest
source_url:
  html: 'https://shopify.dev/docs/api/admin-rest'
  md: 'https://shopify.dev/docs/api/admin-rest.md'
---

The REST Admin API is a legacy API as of October 1, 2024. Starting April 1, 2025, all new public apps must be built exclusively with the [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql). For details and migration steps, visit our [migration guide](https://shopify.dev/docs/apps/build/graphql/migrate).

# REST Admin API reference

The Admin API lets you build apps and integrations that extend and enhance the Shopify admin.

Some newer platform features may only be available in [GraphQL](https://shopify.dev/docs/api/admin-graphql).

## Client libraries

Use Shopify’s officially supported libraries to build fast, reliable apps with the programming languages and frameworks you already know.

##### cURL

Use the [curl utility](https://curl.se/) to make API queries directly from the command line.

##### Remix

The official package for Remix applications, with full TypeScript support.

* [Docs](https://shopify.dev/docs/api/shopify-app-remix)
* [npm package](https://www.npmjs.com/package/@shopify/shopify-app-remix)
* [GitHub repo](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-app-remix#readme)

##### Node.js

The official client library for Node.js applications, with full TypeScript support. It has no framework dependencies, so it can be used by any Node.js app.

* [Docs](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api#readme)
* [npm package](https://www.npmjs.com/package/@shopify/shopify-api)
* [GitHub repo](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api)

##### Ruby

The official client library for Ruby apps.

* [Docs](https://shopify.github.io/shopify-api-ruby/)

* [Ruby gem](https://rubygems.org/gems/shopify_api)

* [GitHub repo](https://github.com/Shopify/shopify-api-ruby)

##### Other

Need a different language? Check the list of [community-supported libraries](https://shopify.dev/apps/tools/api-libraries#third-party-admin-api-libraries).

##### cURL

```bash
# cURL is often available by default on macOS and Linux.
#
# See http://curl.se/docs/install.html for more details.
```

##### Remix

```ts
npm install --save @shopify/shopify-app-remix
# or
yarn add @shopify/shopify-app-remix
```

##### Node.js

```ts
npm install --save @shopify/shopify-api
# or
yarn add @shopify/shopify-api
```

##### Ruby

```ruby
bundle add shopify_api
```

***

## Authentication

All REST Admin API queries require a valid Shopify access token.

Public and custom apps created in the Dev Dashboard generate tokens using [OAuth](https://shopify.dev/apps/auth/oauth), and custom apps made in the Shopify admin are [authenticated in the Shopify admin](https://shopify.dev/apps/auth/admin-app-access-tokens). To simplify the authentication process, use one of the recommended Shopify client libraries.

Include your token as a `X-Shopify-Access-Token` header on all API queries. Using Shopify’s supported [client libraries](https://shopify.dev/apps/tools/api-libraries) can simplify this process.

To keep the platform secure, apps need to request specific [access scopes](https://shopify.dev/api/usage/access-scopes) during the install process. Only request as much data access as your app needs to work.

Learn more about [getting started with authentication](https://shopify.dev/apps/auth) and [building apps](https://shopify.dev/apps/getting-started).

##### cURL

```bash
curl -X GET \ https://{shop}.myshopify.com/admin/api/2025-10/shop.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {password}'
```

##### Remix

```ts
const { admin } = await authenticate.admin(request);
const response = admin.rest.get({path: 'shop'});
```

##### Node.js

```ts
const client = new shopify.clients.Rest({session});
const response = client.get({path: 'shop'});
```

##### Ruby

```ruby
session = ShopifyAPI::Auth::Session.new(
  shop: 'your-development-store.myshopify.com',
  access_token: access_token,
)

ShopifyAPI::Context.setup(
  api_key: 'client_id',
  api_secret_key: 'client_secret',
  api_version: 'api_version', # Example: '2025-10'
  scope: 'read_products',
  is_private: false, # Set to true if you are using a private app
  is_embedded: true # Set to true if you are using an embedded app
)

ShopifyAPI::Context.activate_session(session)

client = ShopifyAPI::Clients::Rest::Admin.new(
  session: session
)
response = client.get(path: 'shop')
```

***

## Endpoints and requests

Admin REST API endpoints are organized by resource type. You’ll need to use different endpoints depending on your app’s requirements.

All Admin REST API endpoints follow this pattern:

`https://{store_name}.myshopify.com/admin/api/2025-10/{resource}.json`

##### POSTExample POST request

Create a new product.

This example illustrates how to create a new product using the Product resource and the `/admin/api/2025-10/products.json` endpoint. Replace `{store_name}` with your store’s domain and `{access_token}` with the access token you generated in the Authentication section.

##### GETExample GET request

Retrieve a single product.

This example illustrates how to retrieve information for a single product using the Product resource and the `admin/api/2025-10/products/{product_id}.json` endpoint. Replace `{store_name}` with your store’s domain and `{access_token}` with the access token you generated in the Authentication section.

##### PUTExample PUT request

Update a product.

This example illustrates how to update a product using the Product resource and the `admin/api/2025-10/products/{product_id}.json` endpoint. Replace `{store_name}` with your store’s domain and `{access_token}` with the access token you generated in the Authentication section.

##### DELExample DELETE request

Delete a product.

This example illustrates how to delete a product using the Product resource and the `admin/api/2025-10/products/{product_id}.json` endpoint. Replace `{store_name}` with your store’s domain and `{access_token}` with the access token you generated in the Authentication section.

POST

## /admin/api/2025-10/products.json

##### cURL

```bash
# Create a new product record
curl -X POST \
  https://{store_name}.myshopify.com/admin/api/2025-10/products.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {access_token}' \
  -d '
  {
    "product": {
      "title": "Hiking backpack"
    }
  }
  '
```

##### Node.js

```ts
const body = {
  product: {
    title: "Hiking backpack"
  }
};
// `session` is built as part of the OAuth process
const client = new shopify.clients.Rest({session});
await client.post({
  path: 'products',
  data: body,
  type: DataType.JSON,
});
```

##### Ruby

```ruby
body = {
  product: {
    title: "Hiking backpack"
  }
}
# `session` is built as part of the OAuth process
client = ShopifyAPI::Clients::Rest::Admin.new(
  session: session
)
response = client.post(
  path: "products",
  body: body
)
```

## {} Response

```json
HTTP/1.1 200 OK
{
  "product": {
    "id": 11235813213455,
    "title": "Hiking backpack",
    "body_html": null,
    "vendor": "",
    "product_type": "",
    "created_at": "<NOW>",
    "handle": "hiking-backpack",
    "updated_at": "<NOW>",
    "published_at": "<NOW>",
    "template_suffix": null,
    "status": "active",
    "published_scope": "web",
    "tags": "",
    "admin_graphql_api_id": "gid://shopify/Product/11235813213455",
    "variants": [
      {
        "id": 16180339887498,
        "product_id": 11235813213455,
        "title": "Default Title",
        "price": "0.00",
        "sku": "",
        "position": 1,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Default Title",
        "option2": null,
        "option3": null,
        "created_at": "<NOW>",
        "updated_at": "<NOW>",
        "taxable": true,
        "barcode": null,
        "grams": 0,
        "image_id": null,
        "weight": 0,
        "weight_unit": "kg",
        "inventory_item_id": 2233311419,
        "inventory_quantity": 0,
        "old_inventory_quantity": 0,
        "requires_shipping": true,
        "admin_graphql_api_id": "gid://shopify/ProductVariant/16180339887498"
      }
    ],
    "options": [
      {
        "id": 46910141521222530,
        "product_id": 11235813213455,
        "name": "Title",
        "position": 1,
        "values": [
          "Default Title"
        ]
      }
    ],
    "images": [],
    "image": null
  }
}
```

GET

## /admin/api/2025-10/products/(product\_id).json

##### cURL

```bash
curl -X GET \
  https://{store_name}.myshopify.com/admin/api/2025-10/products/11235813213455.json?fields=id,title \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {access_token}'
```

##### Remix

```ts
const productId = "11235813213455";

const { admin } = await authenticate.admin(request);
const product = await admin.rest.get({
  path: `products/${productId}`,
  query: {id: 1, title: "title"}
});
```

##### Node.js

```ts
const productId = "11235813213455";
// `session` is built as part of the OAuth process
const client = new shopify.clients.Rest({session});
const product = await client.get({
  path: `products/${productId}`,
  query: {id: 1, title: "title"}
});
```

##### Ruby

```ruby
product_id = "11235813213455"
# `session` is built as part of the OAuth process
client = ShopifyAPI::Clients::Rest::Admin.new(
  session: session
)
response = client.get(
  path: "products/#{product_id}",
  query: ["id" => 1, "title" => "title"]
)
```

## {} Response

```json
HTTP/1.1 200 OK
{
  "product": {
    "id": 11235813213455,
    "title": "Hiking backpack"
  }
}
```

PUT

## /admin/api/2025-10/products/(product\_id).json

##### cURL

```bash
curl -X PUT \
  https://{store_name}.myshopify.com/admin/api/2025-10/products/11235813213455.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {access_token}' \
	-d '
	{
		"product": {
			"title": "Mountaineering backpack"
		}
	}
	'
```

##### Node.js

```ts
const productId = 11235813213455;
const body = {
  product: {
    title: "Mountaineering backpack"
  }
};
// `session` is built as part of the OAuth process
const client = new shopify.clients.Rest({session});
const response = await client.put({
  path: `products/${productId}`,
  data: body,
});
```

##### Ruby

```ruby
product_id = "11235813213455"
body = {
  product: {
      title: "Mountaineering backpack"
  }
}
# `session` is built as part of the OAuth process
client = ShopifyAPI::Clients::Rest::Admin.new(
  session: session
)
response = client.put(
  path: "products/#{product_id}",
  body: body
)
```

## {} Response

```json
HTTP/1.1 200 OK
{
  "product": {
    "id": 11235813213455,
    "title": "Mountaineering backpack",
    "body_html": null,
    "vendor": "",
    "product_type": "",
    "created_at": "<NOW>",
    "handle": "hiking-backpack",
    "updated_at": "<NOW>",
    "published_at": "<NOW>",
    "template_suffix": null,
    "status": "active",
    "published_scope": "web",
    "tags": "",
    "admin_graphql_api_id": "gid://shopify/Product/11235813213455",
    "variants": [
      {
        "id": 16180339887498,
        "product_id": 11235813213455,
        "title": "Default Title",
        "price": "0.00",
        "sku": "",
        "position": 1,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "manual",
        "inventory_management": null,
        "option1": "Default Title",
        "option2": null,
        "option3": null,
        "created_at": "<NOW>",
        "updated_at": "<NOW>",
        "taxable": true,
        "barcode": null,
        "grams": 0,
        "image_id": null,
        "weight": 0,
        "weight_unit": "kg",
        "inventory_item_id": 2233311419,
        "inventory_quantity": 0,
        "old_inventory_quantity": 0,
        "requires_shipping": true,
        "admin_graphql_api_id": "gid://shopify/ProductVariant/16180339887498"
      }
    ],
    "options": [
      {
        "id": 46910141521222530,
        "product_id": 11235813213455,
        "name": "Title",
        "position": 1,
        "values": [
          "Default Title"
        ]
      }
    ],
    "images": [],
    "image": null
  }
}
```

## DEL/admin/api/2025-07/products/(product\_id).json

##### cURL

```bash
curl -X DELETE \
  https://{store_name}.myshopify.com/admin/api/2025-10/products/11235813213455.json \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Access-Token: {access_token}'
```

##### Node.js

```ts
const productId = "11235813213455";
// `session` is built as part of the OAuth process
const client = new shopify.clients.Rest({session});
const product = await client.delete({
  path: `products/${productId}`
});
```

##### Ruby

```ruby
product_id = "11235813213455"
# `session` is built as part of the OAuth process
client = ShopifyAPI::Clients::Rest::Admin.new(
  session: session
)
response = client.delete(path: "products/#{product_id}")
```

## {} Response

```json
HTTP/1.1 200 OK
{}
```

The Admin API is versioned, with new releases four times per year. To keep your app stable, make sure you specify a supported version in the URL. Learn more about [API versioning](https://shopify.dev/api/usage/versioning).

All REST endpoints support [cursor-based pagination](https://shopify.dev/api/usage/pagination-rest). All requests produce HTTP [response status codes](https://shopify.dev/api/usage/response-codes).

Learn more about [API usage](https://shopify.dev/api/usage).

***

## Rate limits

The REST Admin API supports a limit of 40 requests per app per store per minute. This allotment replenishes at a rate of 2 requests per second. The rate limit is increased by a factor of 10 for Shopify Plus stores.

### Usage limitations

REST Admin API supports a limit of **40 requests per app per store per minute**.

Past the limit, the API will return a `429 Too Many Requests` error.

All REST API responses include the `X-Shopify-Shop-Api-Call-Limit` header, which shows how many requests the client has made, and the total number allowed per minute.

A `429` response will also include a `Retry-After` header with the number of seconds to wait until retrying your query.

Learn more about [rate limits](https://shopify.dev/api/usage/limits#rest-admin-api-rate-limits).

## {} Header

X-Shopify-Shop-Api-Call-Limit: 40/40

Retry-After: 2.0

## {} Response

```json
HTTP/1.1 429 Too Many Requests
{
  "customers": [
    {
      "id": 207119551,
      "email": "bob.norman@hostmail.com",
      "accepts_marketing": false,
      "created_at": "2021-02-12T13:48:32-05:00",
      "updated_at": "2021-02-12T13:48:32-05:00",
      "first_name": "Bob",
      "last_name": "Norman",
      "orders_count": 1,
      "state": "disabled",
      "total_spent": "199.65",
      "last_order_id": 450789469,
      "note": null,
      "verified_email": true,
      "multipass_identifier": null,
      "tax_exempt": false,
      "phone": "+16136120707",
      "tags": "",
      "last_order_name": "#1001",
      "currency": "USD",
      "addresses": [
        {
          "id": 207119551,
          "customer_id": 207119551,
          "first_name": null,
          "last_name": null,
          "company": null,
          "address1": "Chestnut Street 92",
          "address2": "",
          "city": "Louisville",
          "province": "Kentucky",
          "country": "United States",
          "zip": "40202",
          "phone": "+1(800)-555-2181",
          "name": "",
          "province_code": "KY",
          "country_code": "US",
          "country_name": "United States",
          "default": true
        }
      ],
    },
  ],
  "accepts_marketing_updated_at": "2005-06-12T11:57:11-04:00",
  "marketing_opt_in_level": null,
  "tax_exemptions": [],
  "admin_graphql_api_id": "gid://shopify/Customer/207119551",
  "default_address": {
    "id": 207119551,
    "customer_id": 207119551,
    "first_name": null,
    "last_name": null,
    "company": null,
    "address1": "Chestnut Street 92",
    "address2": "",
    "city": "Louisville",
    "province": "Kentucky",
    "country": "United States",
    "zip": "40202",
    "phone": "+1(800)-555-2181",
    "name": "",
    "province_code": "KY",
    "country_code": "US",
    "country_name": "United States",
    "default": true
  }
}
```

***

## Status and error codes

All API queries return HTTP status codes that can tell you more about the response.

***

#### 401 Unauthorized

The client doesn’t have correct [authentication](#authentication) credentials.

***

#### 402 Payment Required

The shop is frozen. The shop owner will need to pay the outstanding balance to [unfreeze](https://help.shopify.com/en/manual/your-account/pause-close-store#unfreeze-your-shopify-store) the shop.

***

#### 403 Forbidden

The server is refusing to respond. This is typically caused by incorrect [access scopes](https://shopify.dev/api/usage/access-scopes).

***

#### 404 Not Found

The requested resource was not found but could be available again in the future.

***

#### 422 Unprocessable Entity

The request body contains semantic errors. This is typically caused by incorrect formatting, omitting required fields, or logical errors such as initiating a checkout for an out-of-stock product.

***

#### 429 Too Many Requests

The client has exceeded the [rate limit](#rate-limits).

***

#### 5xx Errors

An internal error occurred in Shopify. Check out the [Shopify status page](https://www.shopifystatus.com) for more information.

***

Didn’t find the status code you’re looking for?

View the complete list of [API status response and error codes](https://shopify.dev/api/usage/response-codes).

## {} Sample error codes

##### 401

```
HTTP/1.1 401 Unauthorized
{
  "errors": "[API] Invalid API key or access token (unrecognized login or wrong password)"
}
```

##### 402

```
HTTP/1.1 402 Payment Required
{
  "errors": "This shop's plan does not have access to this feature"
}
```

##### 403

```
HTTP/1.1 403 Access Denied
{
  "errors": "User does not have access"
}}
```

##### 404

```
HTTP/1.1 404 Not Found
{
  "errors": "Not Found"
}
```

##### 422

```
HTTP/1.1 422 Unprocessable Entity
{
  "errors": [
    "The fulfillment order is not in an open state."
  ]
}
```

##### 429

```
HTTP/1.1 429 Too Many Requests
{
  "errors": "Exceeded 2 calls per second for api client. Reduce request rates to resume uninterrupted service."
}
```

##### 500

```
HTTP/1.1 500 Internal Server Error
{
  "errors": "An unexpected error occurred"
}
```

***