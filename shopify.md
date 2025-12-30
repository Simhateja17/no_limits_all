---
title: About session tokens
description: >-
  Learn about session tokens and how they fit into the authentication flow for
  an embedded Shopify app.
source_url:
  html: >-
    https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
  md: >-
    https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md
---

ExpandOn this page

* [How session tokens work](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#how-session-tokens-work)
* [Anatomy of a session token](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#anatomy-of-a-session-token)
* [Limitations](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#limitations)
* [Sample apps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#sample-apps)
* [Next steps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#next-steps)

# About session tokens

A session token is a mechanism that lets your embedded app authenticate the requests that it makes between the client side and your app's backend.

Note

All embedded apps need to use session tokens because third-party cookies won't work with browsers that restrict cross-domain data access. If your embedded app still uses cookies and could pose a risk to users, then as part of our [app audit process](https://shopify.dev/docs/apps/launch/app-store-review/app-audits) you might be contacted and requested to migrate your app to use session tokens. This request will require immediate action.

The following video provides a short introduction to session tokens:

***

## How session tokens work

This section describes the authentication and request flows associated with session tokens, and the lifetime of a session token. It also provides information about implementing both OAuth and session token authentication for embedded apps.

### Authentication flow using a session token

When your embedded app first loads, it's unauthenticated and serves up the frontend code for your app. Your app renders a user interface skeleton or loading screen to the user.

After the frontend code has loaded, your app calls a [Shopify App Bridge action](https://shopify.dev/docs/api/app-bridge/previous-versions/actions) to get the session token. Your app includes the session token in an authorization header when it makes any HTTPS requests to its backend.

![](https://shopify.dev/assets/assets/images/partners/jwt-auth-flow-DC23sv78.png)

### Request flow using a session token

The session token is signed using the shared secret between your app and Shopify so that your backend can verify if the request is valid.

![](https://shopify.dev/assets/assets/images/apps/auth/jwt-request-flow-DDQ5Q8bW.png)

### Lifetime of a session token

The lifetime of a session token is one minute. Session tokens must be fetched using Shopify App Bridge on each request to make sure that stale tokens aren't used.

### OAuth and session tokens

Tip

You can use [Shopify CLI](https://shopify.dev/docs/apps/build/cli-for-apps) to generate a starter app with boilerplate code that handles authentication and authorization. The starter app includes code for an embedded app that uses [session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens) and [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

Session tokens are for authentication, and aren't a replacement for [authorization](https://shopify.dev/docs/apps/build/authentication-authorization#authorization). Learn more about the [difference between authentication and authorization](https://shopify.dev/docs/apps/build/authentication-authorization#authentication-vs-authorization).

Unlike API access tokens, session tokens can't be used to make authenticated requests to Shopify APIs. An API access token is what you use to send requests from your app's backend to Shopify so that you can fetch specific data from the user's shop.

For example, to [make authenticated requests](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange#step-3-make-authenticated-requests) to the [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql), your app must store the access token it receives during the OAuth flow. To contrast, session tokens are used by your app's backend to verify the embedded request coming from your app's frontend.

The following diagram shows the authentication process using session tokens and API access tokens:

![Diagram showing authentication process using sessions tokens and API access tokens](https://shopify.dev/assets/assets/images/partners/auth-mechanisms-4HBrY0T6.png)

***

## Anatomy of a session token

Session tokens use the [JSON Web Token (JWT)](https://jwt.io) format and contain information about the merchant that's currently using your embedded app.

A session token consists of a header, payload, and signature. For an interactive example, refer to [JWT.io](https://jwt.io/), where you can experiment with setting different values for each section. Shopify recommends that you use your test app's credentials when testing on JWT.io.

For the most part, you shouldn't have to manage the anatomical details of session tokens. In most scenarios, you'll use a library, such as `authenticated_fetch` from [app-bridge](https://www.npmjs.com/package/@shopify/app-bridge), which generates and includes the session token in your requests. On the backend, you can use middleware similar to `validateAuthenticatedSession` in [@shopify/shopify-app-express](https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-app-express/docs/reference/validateAuthenticatedSession.md).

After a Shopify session token is decoded, it has the following fields:

### Header

The values in the header are constant and never change.

```json
{
"alg": "HS256",
"typ": "JWT"
}
```

* `alg`: The algorithm used to encode the JWT.
* `typ`: The [(type) header parameter](https://tools.ietf.org/html/rfc7519#section-5.1) used by session token to declare the media type.

### Payload

```json
{
"iss": "<shop-name.myshopify.com/admin>",
"dest": "<shop-name.myshopify.com>",
"aud": "<client ID>",
"sub": "<user ID>",
"exp": "<time in seconds>",
"nbf": "<time in seconds>",
"iat": "<time in seconds>",
"jti": "<random UUID>",
"sid": "<session ID>"
"sig": "<signature>"
}
```

* `iss`: The shop's admin domain.
* `dest`: The shop's domain.
* `aud`: The client ID of the receiving app.
* `sub`: The [User](https://shopify.dev/docs/api/admin-rest/latest/resources/user) that the session token is intended for.
* `exp`: When the session token expires.
* `nbf`: When the session token activates.
* `iat`: When the session token was issued.
* `jti`: A secure random UUID.
* `sid`: A unique session ID per user and app.
* `sig`: Shopify signature.

### Example payload

```json
{
"iss"=>"https://exampleshop.myshopify.com/admin",
"dest"=>"https://exampleshop.myshopify.com",
"aud"=>"client-id-123",
"sub"=>"42",
"exp"=>1591765058,
"nbf"=>1591764998,
"iat"=>1591764998,
"jti"=>"f8912129-1af6-4cad-9ca3-76b0f7621087",
"sid"=>"aaea182f2732d44c23057c0fea584021a4485b2bd25d3eb7fd349313ad24c685",
"sig"=>"f07cf3740270c17fb61c700b2f0f2e7f2f4fc8cc48426221738f7a39e4c475bf",
}
```

Note

All times are in UNIX timestamp format.

***

## Limitations

[Session token authentication](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens) is only fully supported for single-page apps. You can only use session tokens for a multi-page app if you convert it to behave like a single-page app. For an example, refer to the [Turbolinks and JWT sample app](https://github.com/Shopify/turbolinks-jwt-sample-app).

Caution

In some cases, ad blockers can interfere with session tokens. If you're submitting your app to the Shopify App Store and the automated check for session tokens is hanging, then try disabling your ad blocker and interacting with your app to record the required session data.

***

## Sample apps

* [Sample single-page embedded app using Rails and React](https://github.com/Shopify/next-gen-auth-app-demo)
* [Sample server-side rendered Rails app converted using Turbolinks](https://github.com/Shopify/turbolinks-jwt-sample-app)

***

## Next steps

* Set up your embedded app to [authenticate using session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens).

***

* [How session tokens work](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#how-session-tokens-work)
* [Anatomy of a session token](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#anatomy-of-a-session-token)
* [Limitations](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#limitations)
* [Sample apps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#sample-apps)
* [Next steps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens.md#next-steps)


---
title: Set up session tokens
description: Learn how to set up session token authentication for your embedded app.
source_url:
  html: >-
    https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens
  md: >-
    https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md
---

ExpandOn this page

* [Outcomes](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#outcomes)
* [Requirements](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#requirements)
* [Recommendations](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#recommendations)
* [Step 1: Get a session token](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-1-get-a-session-token)
* [Step 2: Authenticate your requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-2-authenticate-your-requests)
* [Step 3: Decode session tokens for incoming requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-3-decode-session-tokens-for-incoming-requests)
* [Step 4: Allow authenticated requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-4-allow-authenticated-requests)
* [Step 5: Mark shop records as uninstalled using the app/uninstalled webhook](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-5-mark-shop-records-as-uninstalled-using-the-app-uninstalled-webhook)
* [Step 6: Handle the expiry of online access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-6-handle-the-expiry-of-online-access-tokens)
* [Step 7: Verify that the session token is being sent](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-7-verify-that-the-session-token-is-being-sent)
* [Next steps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#next-steps)

# Set up session tokens

This tutorial explains how to set up session token authentication for your embedded app.

Caution

The below guide only applies to App Bridge 2.0. The [current version of App Bridge](https://shopify.dev/docs/api/app-bridge) automatically adds session tokens to requests coming from your app. If you want to set up session token authentication for a multi-page server-side rendered (SSR) app, then you need to instead set your app to use Turbolinks. For an example, refer to the [Turbolinks and JWT sample app](https://github.com/Shopify/turbolinks-jwt-sample-app).

Many of the topics discussed in this tutorial are covered in the following video:

***

## Outcomes

After you've finished this tutorial, you'll know how to set up session token authentication for your app.

***

## Requirements

* You've [created an app](https://shopify.dev/docs/apps/build/scaffold-app) from the Dev Dashboard or Shopify CLI.
* The app is [embedded in the Shopify admin](https://shopify.dev/docs/api/app-bridge/previous-versions/app-bridge-from-npm/app-setup#turn-on-embedding-in-the-partner-dashboard).
* You've learned about [how session tokens work](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens).
* The app uses [App Bridge version 2.0](https://shopify.dev/docs/api/app-bridge/previous-versions/app-bridge-from-npm/app-setup).
* You've [created an App Bridge instance](https://shopify.dev/docs/api/app-home).

Tip

You can use [Shopify CLI](https://shopify.dev/docs/apps/build/cli-for-apps) to generate a starter app with boilerplate code that handles authentication and authorization. The starter app includes code for an embedded app that uses [session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens) and [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

***

## Recommendations

We recommend using the [Shopify App gem](https://github.com/Shopify/shopify_app), or [Shopify Node API library](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api) to decode and verify the authenticity of the session token.

***

## Step 1: Get a session token

The `getSessionToken` helper retrieves a session token from Shopify. It sets up a subscription on the Shopify App Bridge client to listen for the `APP::SESSION_TOKEN_RESPOND` action and then immediately dispatches the `APP::SESSION_TOKEN_REQUEST` action.

In your app, set up the Shopify App Bridge client and import `getSessionToken` using the following code:

```js
import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge/utilities";


const app = createApp({
  apiKey: "12345", // API key from the Dev Dashboard
  host: "YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvemwtMDMwNDExMjE", // host from URL search parameter
});
```

Where your app requires a session token, specify the following code:

```js
const sessionToken = await getSessionToken(app);
```

`getSessionToken` returns a `Promise`, which either resolves with the session token, or rejects with an `APP::ERROR::FAILED_AUTHENTICATION` error when the session token is `undefined`.

***

## Step 2: Authenticate your requests

The `authenticatedFetch` helper function authenticates your requests using the session token. The function gets the session token from Shopify App Bridge and passes in the `Authorization` header to your subsequent `fetch` requests.

### Parameters

* `app`: The App Bridge instance.

* `fetchOperation`: Optional. Define a custom fetch wrapper.

  The following example shows how to use `authenticatedFetch` with a custom ApolloLink:

```js
import ApolloClient from "apollo-client";
import { authenticatedFetch } from "@shopify/app-bridge/utilities";
import createApp from "@shopify/app-bridge";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";


const app = createApp({
  apiKey: "12345", // API key from the Dev Dashboard
  host: "YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvemwtMDMwNDExMjE", // host from URL search parameter
});


const client = new ApolloClient({
  link: new HttpLink({
    credentials: "same-origin",
    fetch: authenticatedFetch(app), // ensures that all requests triggered by the ApolloClient are authenticated
  }),
  cache: new InMemoryCache(),
});
```

### Use a custom fetch wrapper

If you want to add custom headers, caching, or special treatment of requests, then you can optionally pass in a custom fetch wrapper function to the `fetchOperation` parameter.

The `app-bridge` function (`authenticatedFetch`) returns your custom fetch wrapper function along with an authenticated `Authorization` header appended to the request options provided.

Any custom fetch function that you provide needs to append all the appropriate options, including headers. The following example shows how to append options:

```js
import ApolloClient from "apollo-client";
import { authenticatedFetch } from "@shopify/app-bridge/utilities";
import createApp from "@shopify/app-bridge";
import deepMerge from "@shopify/app-bridge/actions/merge";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";


// Sample custom fetch wrapper
const yourCustomFetchWrapper = (uri, options) => {
  const aggregateOptions = deepMerge(options, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return fetch(uri, aggregateOptions);
};


const app = createApp({
  apiKey: "12345", // API key from the Dev Dashboard
  host: "YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvemwtMDMwNDExMjE", // host from URL search parameter
});


const client = new ApolloClient({
  link: new HttpLink({
    credentials: "same-origin",
    fetch: authenticatedFetch(app, yourCustomFetchWrapper), // ensures that your custom fetch wrapper is authenticated
  }),
  cache: new InMemoryCache(),
});
```

***

## Step 3: Decode session tokens for incoming requests

You need to add middleware that detects requests with a session token present, verifies that the session token's signature is correct, and then builds a session based on the shop and user information included in the token.

The [Shopify App gem](https://github.com/Shopify/shopify_app) and [Shopify Node API library](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api) provide middleware and utilities for decoding session tokens.

If your app isn't built using the libraries mentioned above, then you can obtain session details and verify the session token's signature manually.

### Optional: Obtain session details and verify the session token manually

If your app isn't built using the Shopify App gem, Shopify Node API library, or another library with session tokens included, follow these steps to manually decode and verify the session token.

#### Obtain and verify session details

A session token is a JWT string with the following structure: `<header>.<payload>.<signature>`. You can obtain the session details from the payload and then verify the contents as follows:

1. Extract the `exp` value from the payload.

   Verify that the datetime value is in the future.

2. Extract the `nbf` value from the payload.

   Verify that the datetime value was in the past.

3. Extract the `iss` and `dest` fields from the payload.

   The top-level domains should match. The `dest` field specifies the shops that the request originated from. For example, `myshop.myshopify.com`.

4. Extract the `aud` value from the payload.

   Verify that the value matches the client ID of your app.

5. Extract the `sub` value from the payload.

   This is the ID of the user that made the request.

If any of the above steps fail, then discard the payload, stop processing the request, and respond with an error.

Note

Without third-party cookies, setting Cross-Site Request Forgery (CSRF) tokens in a cookie might not be possible. The session token serves as an alternative to CSRF tokens, because you can trust that the session token has been issued by Shopify to your app frontend.

#### Verify the session token's signature

To verify that the signature is correct, you need to generate a new Base64url-encoded signature using the app’s shared secret.

Session tokens are signed using the HS256 algorithm. This is a symmetric algorithm. The signing key is the shared secret for your Shopify app. A session token is a JWT string with the following structure: `<header>.<payload>.<signature>`

All three sections are base64 encoded.

Use the following steps to verify that the issued token has a valid signature. Refer to [JWT.io](https://jwt.io/) for a useful JWT decoder tool.

1. Take the `<header>.<payload>` portion of the string and hash it with SHA-256.
2. Sign the string using the HS256 algorithm by using the app’s secret as the signing key.
3. Base64url-encode the result.
4. Verify that the result is the same as the signature that was sent with the session token.

***

## Step 4: Allow authenticated requests

To allow authenticated requests, you need to update the route that serves the app so that it allows unauthenticated requests. You also need to add logic to the unauthenticated route to detect if this is the first time that the shop is loading your app.

### Update the route

If the page that's rendered by the route depends on an authenticated request to the route, then remove the protected data from the response and expose the data to the frontend using an authenticated API route.

For example, your app might be embedding protected app user information in its initial HTML response. The only app user information that should be available on unauthenticated routes is the shop domain, which is passed in as a query parameter in the app URL.

### Add logic to the unauthenticated route

If your app doesn't have a valid [online](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens) or [offline](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens) access token, then it should get a new session token from App Bridge. The session token should be passed into the app backend to exchange for an online and offline access token using [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

***

## Step 5: Mark shop records as uninstalled using the `app/uninstalled webhook`

To ensure OAuth continues to work with session tokens, your app must update its shop records when a shop uninstalls your app. An app can receive notifications of uninstall events by subscribing to the `app/uninstalled` [webhook](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook).

The following sections show a Ruby implementation that subscribes to the webhook and updates the records.

### Set up the webhook

Use the [`add_webhook` generator from the shopify\_app gem](https://github.com/Shopify/shopify_app/blob/main/docs/shopify_app/webhooks.md#manage-webhooks-using-shopifyappwebhooksmanager) to set up the `app/uninstalled` webhook for the app. The following code adds the `app/uninstalled` webhook to your app config and creates the `AppUninstalledJob` job class so that you can add uninstallation handler logic.

```text
rails g shopify_app:add_webhook -t app/uninstalled -a {your_app_url}/webhooks/app_uninstalled
```

### Mark the shop record as uninstalled

To mark the record as uninstalled, you need to update the `AppUninstalledJob` job class. In the following example, the app marks the shop as uninstalled by deleting the Shop record:

```ruby
class AppUninstalledJob < ActiveJob::Base
  def perform(args)
    shop = Shop.find_by(shopify_domain: args[:shop_domain])


    mark_shop_as_uninstalled(shop)
  end


  private


  def mark_shop_as_uninstalled(shop)
    shop.uninstall! if shop
  end
end
```

### Define a background job

You need to define a background job to ensure that shops with existing installations also have the uninstall webhook set up. In the following example, the `RegisterWebhooksForActiveShop` job is defined to iterate all shop records in the database and configure the webhooks.

```ruby
class RegisterWebhooksForActiveShops < ApplicationJob
  queue_as :default


  def perform
    register_webhooks_for_active_shops
  end


  private


  def register_webhooks_for_active_shops
    Shop.find_each do |shop|
      ShopifyApp::WebhooksManagerJob.perform_now(
        shop_domain: shop.shopify_domain,
        shop_token: shop.shopify_token,
        webhooks: ShopifyApp.configuration.webhooks
      )
    end
  end
end
```

### Enqueue the background job

Enqueue the `RegisterWebhooksForActiveShops` background job to apply the webhook registration. For details on enqueuing ActiveJobs on Rails, refer to the [Rails guides](https://edgeguides.rubyonrails.org/active_job_basics.html).

***

## Step 6: Handle the expiry of online access tokens

Apps that use [online access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens) need to keep track of whether the online access token is expired.

If the online access token is expired, your app can request a new one using [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

***

## Step 7: Verify that the session token is being sent

Your app should now work using session token authentication. When any network calls are made, you should see the session token being sent in the header:

![](https://shopify.dev/assets/assets/images/partners/jwt-authentication-XuW0f-Sq.png)

***

## Next steps

* Exchange your session token for an access token with [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

***

* [Outcomes](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#outcomes)
* [Requirements](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#requirements)
* [Recommendations](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#recommendations)
* [Step 1: Get a session token](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-1-get-a-session-token)
* [Step 2: Authenticate your requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-2-authenticate-your-requests)
* [Step 3: Decode session tokens for incoming requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-3-decode-session-tokens-for-incoming-requests)
* [Step 4: Allow authenticated requests](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-4-allow-authenticated-requests)
* [Step 5: Mark shop records as uninstalled using the app/uninstalled webhook](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-5-mark-shop-records-as-uninstalled-using-the-app-uninstalled-webhook)
* [Step 6: Handle the expiry of online access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-6-handle-the-expiry-of-online-access-tokens)
* [Step 7: Verify that the session token is being sent](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#step-7-verify-that-the-session-token-is-being-sent)
* [Next steps](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens.md#next-steps)



---
title: Authentication and authorization
description: >-
  Learn about the different methods of authenticating and authorizing apps with
  Shopify’s platform.
source_url:
  html: 'https://shopify.dev/docs/apps/build/authentication-authorization'
  md: 'https://shopify.dev/docs/apps/build/authentication-authorization.md'
---

ExpandOn this page

* [Authentication vs.​authorization](https://shopify.dev/docs/apps/build/authentication-authorization.md#authentication-vs-authorization)
* [Types of authentication and authorization methods](https://shopify.dev/docs/apps/build/authentication-authorization.md#types-of-authentication-and-authorization-methods)
* [Getting started](https://shopify.dev/docs/apps/build/authentication-authorization.md#getting-started)
* [Tools](https://shopify.dev/docs/apps/build/authentication-authorization.md#tools)

# Authentication and authorization

This guide introduces the different methods of authenticating and authorizing apps with Shopify’s platform. Make sure that you understand the differences between the types of authentication and authorization methods before you begin your development process.

You can [use Shopify CLI to generate a starter app](https://shopify.dev/docs/apps/build/scaffold-app) with boilerplate code that handles authentication and authorization. The starter app includes code for an embedded app that follows app best practices:

* Authorizing your app using [session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens) and [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).

* Installing on stores using [Shopify managed installation](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation).

  You should use this starter app unless you need to scaffold an app that is not embedded.

[Scaffold an app\
\
](https://shopify.dev/docs/apps/build/scaffold-app)

[Scaffold an app that follows all authentication and authorization best practices.](https://shopify.dev/docs/apps/build/scaffold-app)

***

## Authentication vs.​authorization

Authentication is the process of verifying the identity of the user or the app. To keep transactions on Shopify’s platform [safe and secure](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance), all apps connecting with Shopify APIs must authenticate when making API requests.

Authorization is the process of giving permissions to apps. When an app user installs a Shopify app they authorize the app, enabling the app to acquire an access token. For example, an app might be authorized to access orders and product data in a store.

***

## Types of authentication and authorization methods

The authentication and authorization methods that your app needs to use depends on the tool that you used to create your app, and the components that your app uses.

### Authentication

* Embedded apps need to authenticate their incoming requests with [session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens).
* Apps that are not embedded need to implement their own authentication method for incoming requests.

### Authorization

Authorization encompasses the installation of an app and the means to acquire an access token.

To avoid unnecessary redirects and page flickers during the app installation process, you should [configure your app's required access scopes using Shopify CLI](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration). This allows Shopify to [manage the installation process for you](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation).

If you aren't able to use Shopify CLI to configure your app, then your app will install as part of the [authorization code grant flow](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant). This provides a degraded user experience.

If you're building an app for your own organization and don't require user interaction, you can use the [client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant) to acquire access tokens.

The following table outlines the supported installation and token acquisition flows for various app configurations.

Whenever possible, you should create embedded apps that use Shopify managed installation and token exchange.

| Type of app | Supported installation flows | Supported token acquisition flows |
| - | - | - |
| Embedded app | * [Shopify managed installation (recommended)](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation)* [Installation during authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant) | * [Token exchange (recommended)](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange)* [Authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant) |
| Non-embedded app | * [Shopify managed installation (recommended)](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation)* [Installation during authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant) | * [Authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant) |
| Admin-created custom app | * Installed upon generation in the Shopify admin | * [Generate in the Shopify admin](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin) |

OAuth 2.0 is the industry-standard protocol for authorizing or giving permissions to apps. The following video illustrates how OAuth works at Shopify. Note that this video was created before [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange) was introduced, and might use the term "OAuth" interchangeably with "authorization code grant."

***

## Getting started

* Authenticate your embedded app using [session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens).
* Authorize your embedded app using a session token with [token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange).
* Authorize your app that is not embedded with [authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant).
* Authenticate your app created in the Shopify admin with [access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin).

***

## Tools

[Shopify CLI\
\
](https://shopify.dev/docs/apps/build/cli-for-apps)

[A command-line tool to help you build Shopify apps faster](https://shopify.dev/docs/apps/build/cli-for-apps)

[shopify\_api\
\
](https://github.com/Shopify/shopify-api-ruby)

[Shopify’s official Ruby gem for interacting with the Admin API](https://github.com/Shopify/shopify-api-ruby)

[@shopify/shopify-api\
\
](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api)

[Shopify’s official Node library for interacting with the Storefront and Admin APIs, handling OAuth, webhooks, and billing](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-api)

[@shopify/admin-api-client\
\
](https://github.com/Shopify/shopify-app-js/tree/main/packages/api-clients/admin-api-client)

[Shopify’s official lightweight Node library for interacting with the Admin API](https://github.com/Shopify/shopify-app-js/tree/main/packages/api-clients/admin-api-client)

***

* [Authentication vs.​authorization](https://shopify.dev/docs/apps/build/authentication-authorization.md#authentication-vs-authorization)
* [Types of authentication and authorization methods](https://shopify.dev/docs/apps/build/authentication-authorization.md#types-of-authentication-and-authorization-methods)
* [Getting started](https://shopify.dev/docs/apps/build/authentication-authorization.md#getting-started)
* [Tools](https://shopify.dev/docs/apps/build/authentication-authorization.md#tools)




