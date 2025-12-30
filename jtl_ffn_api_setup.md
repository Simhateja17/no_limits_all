# OpenAPIClient-php

# Introduction

JTL-FFN is a standardized interface for fulfillment service providers and their customers. Fulfiller can offer their services to merchants and merchants can respectively choose from a wide range of service providers according to their needs.

## The ecosystem

The FFN network consists of this REST API, an online portal and third party integrations (JTL-Wawi being one of them). The REST API orchestrates the interactions between the participants and the portal website provides services by JTL (such as managing and certifying warehouses of a fulfiller and merchants searching for their service providers).

## About this API

The base url of this api is [https://ffn2.api.jtl-software.com/api](https://ffn2.api.jtl-software.com/api). 

This API (and this documentation) consists of three parts:
* Fulfiller API     - operations used when acting as a fulfiller in the network. Only users with the role `Fulfiller` can access these endpoints.
* Merchant API      - operations used when acting as a merchant in the network. Only users with the role `Merchant` can access these endpoints.
* Shared API        - operations available to all users.

Please use the navigation menu at the top to switch between the documentation for the different APIs.
 

# OAuth

The FFN-API uses [OAuth2](https://tools.ietf.org/html/rfc6749) with the [Authorization Code Grant](https://tools.ietf.org/html/rfc6749#section-4.1) for its endpoints. Users must have an active [JTL customer center](https://kundencenter.jtl-software.de) account to authorize against the OAuth2 server. Applications and services using the API must acquire client credentials from JTL.

## Application credentials

When making calls against the API, you need to do it in the context of an application. You will get the credentials for your application from JTL.

Application credentials consist of the following:
* `client_id`       - uniquely identifies your application
* `client_secret`   - secret used to authenticate your application
* `callback_uri`    - the uri the OAuth2 server redirect to on authorization requests

## Requesting authorization

When you want to authorize a user you redirect him to
`https://oauth2.api.jtl-software.com/authorize`
with the following query string parameters:
* `response_type`   - Must be set to \"code\" for the [Authorization Code Grant](https://tools.ietf.org/html/rfc6749#section-4.1).
* `redirect_uri`    - After the user accepts your authorization request this is the url that will be redirected to. It must match the `callback_uri` in your client credentials.
* `client_id`       - Your applications identifier from your application credentials.
* `scope`           - The scopes you wish to authorize (space delimited).
* `state`           - An opaque value that will be included when redirecting back after the user accepts the authorisation. This is not required, but is important for [security considerations](http://www.thread-safe.com/2014/05/the-correct-use-of-state-parameter-in.html).

After successful authorization by the user, the OAuth2 server will redirect back to your applications callback with the following query string parameters:
* `code`    - The authorization code.
* `state`   - The state parameter that was sent in the request.

## Verifying authorization

The authorization code you acquired in the last step will now be exchanged for an access token. In order to do this you need to POST a request to `https://oauth2.api.jtl-software.com/token`.

>POST <https://oauth2.api.jtl-software.com/token>
>
>Authorization: Basic `application_basic_auth`\\
>Content-Type: application/x-www-form-urlencoded
>
>grant_type=authorization_code&code=`code`&redirect_uri=`redirect_uri`

In the Authorization header [Basic HTTP authentication](https://tools.ietf.org/html/rfc7617) is used. Your application credentials `client_id` will be used as the username and your `client_secret` as the password. The header should have the value \"Basic\" plus the Base64 encoded string comprising of `client_id:client_secret`.

The body of the request consist of the form encoded parameters:
* `grant_type`   - Must be set to \"authorization_code\".
* `code`         - The authorization code received from the previous step.
* `redirect_uri` - Must match the `callback_uri` in your client credentials.

A successful verification request will return a JSON response with the properties:
* `token_type`      - is always \"Bearer\"
* `expires_in`      - the time in seconds until the access token will expire
* `access_token`    - the access token used for API requests
* `refresh_token`   - token used to get a new access_token without needing to ask the user again

Now the APIs endpoints that need authorization can be called by setting the header
>Authorization: Bearer `access_token`

## Refreshing authorization

To get a new `access_token` (for example when the old one expired) one can POST a request to `https://oauth2.api.jtl-software.com/token`.

>POST <https://oauth2.api.jtl-software.com/token>
>
>Authorization: Basic `application_basic_auth`\\
>Content-Type: application/x-www-form-urlencoded
>
>grant_type=refresh_token&refresh_token=`refresh_token`

The Basic HTTP Authorization works exactly as in the verification step.

The body of the request consist of the form encoded parameters:
* `grant_type`      - Must be set to \"refresh_token\".
* `refresh_token`   - The `refresh_token` you acquired during verification.

The response will be the same as in the verification step.

## Scopes

Scopes allow fine grained control over what actions are allowed for a given application. During login users must approve the requested scopes, so it is often feasible to limit asking for permissions your application really needs.

Global scopes for common permission scenarios are the following:
* `ffn.fulfiller.read`  - full read access for the fulfiller API
* `ffn.fulfiller.write` - full write access for the fulfiller API
* `ffn.merchant.read`   - full read access for the merchant API
* `ffn.merchant.write`  - full write access for the merchant API

More fine grained scopes can be acquired from each respective endpoints documentation.

## Example



### Prerequsites

* JTL Customer center account (https://kundencenter.jtl-software.de/)
* cUrl (https://curl.se/)
* FFN portal account (just login here: https://fulfillment.jtl-software.com)
* FFN portal sandbox account (if you want to test on sandbox: https://fulfillment-sandbox.jtl-software.com)
* Oauth Client for authorization and define scopes


Values in this example (access_token, refresh_token, code...) are expired and cannot be used verbatim.

### Step 1 - Create an OAuth client

Navigate to https://kundencenter.jtl-software.de/oauth and create a new OAuth client.
(You can´t navigate to Oauth in customer account, you should use this link, or you can change logged in  index to oauth)


!Templates define what scopes are possible for this client.

scopes with access rights:

* ffn.merchant.read - full read access for the fulfiller API
* ffn.merchant.write - full write access for the fulfiller API
* ffn.fulfiller.read  - full read access for the merchant API
* ffn.fulfiller.write - full write access for the merchant API

More fine grained scopes can be acquired from each respective endpoints documentation.

![Client Scopes](img/oauth//scopesClient1.png)

Overview: clients, scopes, client-secret and client-id

![Oauth Clients](img/oauth//ClientSecretScopes1.png)

In our example:

* client_id: 97170e65-d390-4633-ba46-d6ghef8222de
* client_secret: f364ldUw3wGJFGn3JXE2NpGdCvUSMlmK72gsYg1z
* redirect_uri: http://localhost:53972/ffn/sso

The values for this client should not be used in production and are for testing only.

### Step 2 - User login

In this step you will redirect the user to the JTL OAuth website using his default browser. Here the user will provide his username/password and accept the requested scopes. Finally the JTL Oauth website will redirect to the provided redirect_uri and provide the code.

Template: authorize specified scopes and get code answer to request the access token

```
https://oauth2.api.jtl-software.com/authorize?response_type=code&redirect_uri=[redirect_uri]&client_id=[client_id]&scope=[scopes]
```

Note: the scopes should be seperated by spaces or %20

Filled with our example values:

```
https://oauth2.api.jtl-software.com/authorize?response_type=code&redirect_uri=http://localhost:53972/ffn/sso/oauth&client_id=97170e65-d390-4633-ba46-d6ghef8222de&scope=ffn.merchant.read%20ffn.merchant.write
```



* enter password 

![Sandbox Login](img/oauth/SandboxLogin.png)


* authorize scopes 

![Authorize Scopes](img/oauth/authorizeScopes.png)

* code answer from server

![Antwort mit Code](img/oauth/answer_with_code.png)

Example of the answer from the OAuth server to our redirect_uri:

```
http://localhost:53972/ffn/sso?code=def50200f3ac7aabbb6e82a6b131874115b858549dab62e73c68ea21a03de59b5744dc0f0ee321d7607062cf9bfa57471cd0ee7572db1d7b0a15779b0dda7d0ed8f8bfdb0f69939a34678d67aee41e4849d355d8aa223733ab1f397280b205fa739c6252d77d9ff600136e1b744352115fd62ba1035d8da4cbc1b6791c61d0bb621952b0a14625dd75807113ea0746e35528c304a8ce3c06724c1e1d9e1cb3709e9f52778bc8ca5b2d8f7c055f14244b1f8fcb61554c5bf48e02b882b87b9a76a43579eecd578cec97c6f603907e282e45cfec43837c063dc36b556d4974776a942f47cee19023e130ae852bfca6d3ca9c7cb3283d2bc4971f80651b626f8e7ba0ec2d13dddc4c528e1f3e470de907af7eb304d781534dd9b071d9760c9890e5756893c7800589c407bd2da3a2ff56c3fb15a410e24aa2df7ac54e8d0f7445e38e390171b58a0b66b337057d59acd29ed5bbc4df6bee921b244f030c86f49bcae21c9ca77c05eea0094414803f30089c39d585bf83604a2d9bbcc6442fbfdcff6cca946eb84d1eac2e4f98dff31a93460c951c853f9ef7140f572be963e82a3baf72afba34572af63ee7da
```

Extract the code and note it for next steps.

### Step 3 - Get an access_token from the code

Template: get access token + refresh token

```
curl --location --request POST \"https://oauth2.api.jtl-software.com/token\"
    --header \"Content-Type: application/x-www-form-urlencoded\" 
    -u \"[client_id]:[client_secret]\"
    --data-urlencode \"grant_type=authorization_code\" 
    --data-urlencode \"redirect_uri=[redirect_uri]\"
    --data-urlencode \"code=[code]\" 
```

Filled with our example values:

```
curl --location --request POST \"https://oauth2.api.jtl-software.com/token\"
    --header \"Content-Type: application/x-www-form-urlencoded\" 
    -u \"97170e64-d390-4696-ba46-d6fcef8207de:f364ldUw3wIJFGn3JXE2NpGdAvUSMlmK72gsYg1z\"
    --data-urlencode \"grant_type=authorization_code\" 
    --data-urlencode \"redirect_uri=http://localhost:49420/oauth\"
    --data-urlencode \"code=def50200e6f3c65cfaba9419cbf6e48a7ed4324ef851b0ace493213884496b851fd825b90b4f994ee265a62f2358bbcbb0f990af5dbfd93dc63e51a7a6fa3bcfc7f722f56366b0a726fd1ed5df1cb926b16610fc7beb0f236e8858e86397422e3caa75d8094af8ba8ad6a93b938bd341bec1e4df671ad71ad1d5fa41166f5d4b2a3ac7d9172c35a8501f10ad722ec2aea88439c21b148ec2ba85e93c17acebe7d7f3d0118a50941cab145ed5ce92946426e5d388584556c0b010c567b433c577a1c4f7b1dfb2c99c25a0efadece4f64f19e54305bfc591e2b30b1a7ba1a33af3e039bcfa80b21ca365dc003f07989fca92472c2c8e2daab51151624a6a10bc511f2ed586f06544f7b98566df4667f5bbd6ba7c6707cb673c767c9eab5a74e63a8269688941c3158e8cc1cb5ebe9a8aa468faf415171a481ee1489b58bedb5fc329b23e0e34e76a4a500270fbebe4e1d20a0f17cebc96cd8ab3db383af746ca0699da34b4665afad30e9dde4f5f507a1dd14c73a692f06de8bafe3be81d7744dbcd8c5f7d3c767101ff5ce0556c244130c1c3fc3f53975a841c0cacebb70118f7552f50c2d2b1c421b8a21e\" 
```

The result will be a JSON answer with the users access_token and refresh_token as well as the expiry in seconds.

```
{
    \"token_type\":\"Bearer\",
    \"expires_in\":1800,
    \"access_token\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.       eyJhdWQiOiI5NzE3MGU2NC1kMzkwLTQ2OTYtYmE0Ni1kNmZjZWY4MjA3ZGUiLCJqdGkiOiJlOWVhN2Q0MWI1NDIzNTcyYWU0MDEzYjEzMDZiMGRkNWM3YmQ2ZTNjMDNhYTZmNjQ2M2NlMjUzNTc0ZmUyMWE3NGQyNTIyMTJhODQwMmI1ZCIsImlhdCI6MTY2MTI1MzE0OCwibmJmIjoxNjYxMjUzMTQ4LCJleHAiOjE2NjEyNTQ5NDgsInN1YiI6IjQ2MjA5Iiwic2NvcGVzIjpbImZmbi5tZXJjaGFudC5yZWFkIiwiZmZuLm1lcmNoYW50LndyaXRlIl19.eEwY021wR3BWVp-wbAVQrjfqwFbYqLlOV_ca-cb7-O3Kdpi8mkFQBxfI8rzSiV_1WpAINf4ydV9FR9Ty992SMiAqGJ3T9zDHd68oUDePeq7Xfafp-87UboI2mCfGd7518CoKVLqg5ohb4YCqgC7Dz588FofggCQyDZQSM-8raOgcM-pJ1TT7oRuYuDHsOzCOTPcX2YiGYKCc3M6kxlBy_NjrJoLa4qysLRmPkznWwj0caC7a0VJO5KubvECcMb9D7Byr3UNjI7GiGMAufa770V5qCjrWs4gOsRV-Bn7oQydvsL21qqjBKHcssQrlLZWmrcfKqgBKwfRXIx3Mu5HBCmtHjHMnuvPVEZAj6fEfIwjYSeTAHTHApEwbE7J1MPd8MU0K6X2YEUF315fXN5F3rO3ZL5FdTwcM1E-1-PKubLuMAaE6Lw-QsDtBoI4ESylomCmCCfgLV4Vj-in_oCJUmKXAX0tDSa9y9vb6oAExung_BTJCBemffCtkJ55Px7bvi9JXmwvI0pIFo3QzTUtRbFDizCMrPZvsatFx64mXX3IDoVqXr3uzvdetBIJEj2ngVdGRrKGt4Yboae5oFV2d5jdSZBL28pwGjey__ZB4zLR1DodQ0sOqDWJ3WsEjMYXU8_-IGrS8Kkw8Q0R0UqqyVLfcLr-cfH5tYqf2QLqAScY\",\"refresh_token\":\"def50200e636703f8d6372401e7b5e1163e0f46e5d593f6f8a1e9b1b2777d64684b87b7c552db62f9670bc482a3958d8aafb78083c7166c13f2f233fe4623d22873c819a560dc3213a51448a1e0763c2a0f7fb7230ceeae22a7fa84717458886584ab5a0ed1a500be5f9d3ed36b1d063d39b56c8431f3fe623055626c1f99f8c5b684853965645fe5c5bee941857aef79ae4f9b994316bec9d365119fe0fe8d035218c44d00a47c0e92b4613c1f388b9c171f3d79e45a6d2a52dfbd8d25608d6b0350420155e48cc179764a2432220cc0d1e9bfa7798050d0b36fe658e967186ea75cc1d1277cad973d43a0839c50b6885a87b5b446452855a00ac75c5f6d7f62b914496e30ab89a16b335977e4363b94dda7364bb052832a5d122696b6476fb0e1631030ea3c42d9659ca839cc44919efc9532c84f7170e634d3e189eb181d0c114ed9d8150c619f7567587e0311d89d51d1325646d2c014757ba7f2d7b02f7b56a52e093ed2ea95a8abe4a0289b24a5636dce8ad01c20e8cce8c4c51263e7f1731bb6335b0e31342e2439c77ab7cce7a147e24c9be9d61d8eba216fbfd4d5be2fba3502e69000ad6e67b7230a7f924\"
}
```

### Step 4 - Test the access_token

Using your newly aquired access_token you can test if its working (reminder: the access_token has a limited lifetime and might be expired, in which case we would need to refresh it (see Step 5)).

Template: Test communication with access token on sandbox or production (our client is for both systems)

```
curl --location --request GET \"https://ffn-sbx.api.jtl-software.com/api/v1/users/current\"
--header \"Authorization: Bearer [access_token]\"
```

If you cannot retrieve the user data using this endpoint make sure you have logged into our respective portal website (sandbox, production) at least once as this triggers user creation in the system.

### Step 5 - Refresh access_token when it expires

Template: Get a new access token + refresh token with the refresh token

```
curl --location --request POST \"https://oauth2.api.jtl-software.com/token\" 
    --header \"Content-Type: application/x-www-form-urlencoded\" 
    -u \"[client_id]:[client_secret]\"
    --data-urlencode \"grant_type=refresh_token\" 
    --data-urlencode \"refresh_token=[refresh_token]\"
```

Filled with our example values:

```
curl --location --request POST \"https://oauth2.api.jtl-software.com/token\"
    --header \"Content-Type: application/x-www-form-urlencoded\"
    -u \"97170e64-d390-4696-ba46-d6fcef8207de:f364ldUw3wIJFGn3JXE2NpGdAvUSMlmK72gsYg1z\"
    --data-urlencode \"grant_type=refresh_token\"
    --data-urlencode \"refresh_token=def50200a01c0caff50b7db271f8268e3806ab2cce8e28e25f41e5fe9167a6521b47f6ed0dd3dd2d7856e1983ae645b032cf9285e91c1ee535decb0e0ca3e52670773f2737114955267d83db0204f80233214a623fcc36de04127e1cdcda006eaf60cacfb30c80081a8c9314e20117f64639ab5e333301a10173385c1bfc660709fde0b1a3517f8030dfdba8187e53c23c9d5fe9f33c48e11a4aa41bfd9ea1291507ea1bc8c64df32bdc91c61af907c41cf0bb305cae76e68448a85ad65b0a03a23ec35a7e9cc42aadd0792b9d7d187ae028e2759a7f4a0164f94d9baca29779a702f023216631e1e777069cc2bc65fd404f4fcc5818219063beb1717afe159b8110394af9a0d245de960c227b1183d6a745819ac08d92238938da798f702f83a3faf648f07a8a6d1e694c008517fd8be2fa154aab88a3eaacb3cbb1830c4bdee018e06c7f81e68c5844213f1d02372b23a22d99ac06a860748a3db891fd71768d74470c9a5a8571058dd901c888d13cd4481d63a800322614e63d3d8e6fb109ee7e1b1e046cd086ecbc2d4d362ca662e3ac867f21168833abd7a8247b06602197b7da555361efbf07b0afed69f7a558\"
```

The result will be the same format as in step 3. Refresh_tokens are only valid for a single refresh and you will get a new refresh_token every single time that you must persist.

### My token is not working!

#### 404 NotFound

You need to log into the respective portal website (sandbox-https://fulfillment-sandbox.jtl-software.com, production-https://fulfillment.jtl-software.com) at least once to trigger user creation.

#### 403 Forbidden

You might be missing scopes in your token and don't have sufficient rights.

#### 401 Forbidden

Incorrect Oauth method. For example, we do not support the Oauth method authorisation \"client_credentials grant\".
The authorisation method \"code grant\" with user must be used.

For more information, please visit [https://jtl-software.com](https://jtl-software.com).

## Installation & Usage

### Requirements

PHP 8.1 and later.

### Composer

To install the bindings via [Composer](https://getcomposer.org/), add the following to `composer.json`:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/GIT_USER_ID/GIT_REPO_ID.git"
    }
  ],
  "require": {
    "GIT_USER_ID/GIT_REPO_ID": "*@dev"
  }
}
```

Then run `composer install`

### Manual Installation

Download the files and include `autoload.php`:

```php
<?php
require_once('/path/to/OpenAPIClient-php/vendor/autoload.php');
```

## Getting Started

Please follow the [installation procedure](#installation--usage) and then run the following:

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');




$apiInstance = new kruegge82\jtlffn\Api\AuthorizationsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);
$merchant_id = 'merchant_id_example'; // string | Merchant identifier
$warehouse_id = 'warehouse_id_example'; // string | Warehouse identifier
$shipping_method_id = 'shipping_method_id_example'; // string | Includes shipping methods that shall be deleted

try {
    $apiInstance->authorizationsDeleteShippingMethodAuthorization($merchant_id, $warehouse_id, $shipping_method_id);
} catch (Exception $e) {
    echo 'Exception when calling AuthorizationsApi->authorizationsDeleteShippingMethodAuthorization: ', $e->getMessage(), PHP_EOL;
}

```

## API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*AuthorizationsApi* | [**authorizationsDeleteShippingMethodAuthorization**](docs/Api/AuthorizationsApi.md#authorizationsdeleteshippingmethodauthorization) | **DELETE** /api/v1/fulfiller/authorizations/{merchantId}/warehouses/{warehouseId}/shippingMethods/{shippingMethodId} | Delete Shipping Method Authorization
*AuthorizationsApi* | [**authorizationsDeleteWarehouseAuthorization**](docs/Api/AuthorizationsApi.md#authorizationsdeletewarehouseauthorization) | **DELETE** /api/v1/fulfiller/authorizations/{merchantId}/warehouses/{warehouseId} | Delete Warehouse Authorization
*AuthorizationsApi* | [**authorizationsGet**](docs/Api/AuthorizationsApi.md#authorizationsget) | **GET** /api/v1/fulfiller/authorizations/{merchantId} | Get
*AuthorizationsApi* | [**authorizationsGetAll**](docs/Api/AuthorizationsApi.md#authorizationsgetall) | **GET** /api/v1/fulfiller/authorizations | Get All
*AuthorizationsApi* | [**authorizationsGetUpdates**](docs/Api/AuthorizationsApi.md#authorizationsgetupdates) | **GET** /api/v1/fulfiller/authorizations/updates | Get Updates
*AuthorizationsApi* | [**authorizationsPostShippingMethodAuthorization**](docs/Api/AuthorizationsApi.md#authorizationspostshippingmethodauthorization) | **POST** /api/v1/fulfiller/authorizations/{merchantId}/warehouses/{warehouseId}/shippingMethods | Post Shipping Method Authorization
*AuthorizationsApi* | [**authorizationsPostWarehouseAuthorization**](docs/Api/AuthorizationsApi.md#authorizationspostwarehouseauthorization) | **POST** /api/v1/fulfiller/authorizations/{merchantId}/warehouses | Post Warehouse Authorization
*InboundsApi* | [**inboundsClose**](docs/Api/InboundsApi.md#inboundsclose) | **PUT** /api/v1/fulfiller/inbounds/{inboundId}/close | Close
*InboundsApi* | [**inboundsGet**](docs/Api/InboundsApi.md#inboundsget) | **GET** /api/v1/fulfiller/inbounds/{inboundId} | Get
*InboundsApi* | [**inboundsGetAll**](docs/Api/InboundsApi.md#inboundsgetall) | **GET** /api/v1/fulfiller/inbounds | Get All
*InboundsApi* | [**inboundsGetInboundShippingNotificationUpdates**](docs/Api/InboundsApi.md#inboundsgetinboundshippingnotificationupdates) | **GET** /api/v1/fulfiller/inbounds/shipping-notifications/updates | Get Inbound Shipping Notification Updates
*InboundsApi* | [**inboundsGetShippingNotification**](docs/Api/InboundsApi.md#inboundsgetshippingnotification) | **GET** /api/v1/fulfiller/inbounds/{inboundId}/shipping-notifications/{shippingNotificationId} | Get Shipping Notification
*InboundsApi* | [**inboundsGetShippingNotifications**](docs/Api/InboundsApi.md#inboundsgetshippingnotifications) | **GET** /api/v1/fulfiller/inbounds/{inboundId}/shipping-notifications | Get Shipping Notifications
*InboundsApi* | [**inboundsGetUpdates**](docs/Api/InboundsApi.md#inboundsgetupdates) | **GET** /api/v1/fulfiller/inbounds/updates | Get Updates
*InboundsApi* | [**inboundsPostIncomingGoods**](docs/Api/InboundsApi.md#inboundspostincominggoods) | **POST** /api/v1/fulfiller/inbounds/{inboundId}/incoming-goods | Post Incoming Goods
*InboundsApi* | [**inboundsPostIncomingGoodsBulk**](docs/Api/InboundsApi.md#inboundspostincominggoodsbulk) | **POST** /api/v1/fulfiller/inbounds/{inboundId}/incoming-goods/bulk | Post Incoming Goods Bulk
*MerchantsApi* | [**merchantsGet**](docs/Api/MerchantsApi.md#merchantsget) | **GET** /api/v1/fulfiller/merchants/{merchantId} | Get
*MerchantsApi* | [**merchantsGetAll**](docs/Api/MerchantsApi.md#merchantsgetall) | **GET** /api/v1/fulfiller/merchants | Get All
*MerchantsApi* | [**merchantsGetUpdates**](docs/Api/MerchantsApi.md#merchantsgetupdates) | **GET** /api/v1/fulfiller/merchants/updates | Get Updates
*OutboundsApi* | [**outboundsChangeStatus**](docs/Api/OutboundsApi.md#outboundschangestatus) | **PUT** /api/v1/fulfiller/outbounds/{outboundId}/status | Change Status
*OutboundsApi* | [**outboundsChangeStatusBulk**](docs/Api/OutboundsApi.md#outboundschangestatusbulk) | **POST** /api/v1/fulfiller/outbounds/status | Change Status Bulk
*OutboundsApi* | [**outboundsChangeWarehouse**](docs/Api/OutboundsApi.md#outboundschangewarehouse) | **PUT** /api/v1/fulfiller/outbounds/{outboundId}/warehouse | Change Warehouse
*OutboundsApi* | [**outboundsGet**](docs/Api/OutboundsApi.md#outboundsget) | **GET** /api/v1/fulfiller/outbounds/{outboundId} | Get
*OutboundsApi* | [**outboundsGetAll**](docs/Api/OutboundsApi.md#outboundsgetall) | **GET** /api/v1/fulfiller/outbounds | Get All
*OutboundsApi* | [**outboundsGetOutboundAttachment**](docs/Api/OutboundsApi.md#outboundsgetoutboundattachment) | **GET** /api/v1/fulfiller/outbounds/{outboundId}/attachments/{merchantDocumentId} | Get Outbound Attachment
*OutboundsApi* | [**outboundsGetShippingLabelForOutbound**](docs/Api/OutboundsApi.md#outboundsgetshippinglabelforoutbound) | **GET** /api/v1/fulfiller/outbounds/{outboundId}/shipping-labels/{shippingLabelId} | Get Shipping Label For Outbound
*OutboundsApi* | [**outboundsGetShippingNotification**](docs/Api/OutboundsApi.md#outboundsgetshippingnotification) | **GET** /api/v1/fulfiller/outbounds/{outboundId}/shipping-notifications/{shippingNotificationId} | Get Shipping Notification
*OutboundsApi* | [**outboundsGetShippingNotifications**](docs/Api/OutboundsApi.md#outboundsgetshippingnotifications) | **GET** /api/v1/fulfiller/outbounds/{outboundId}/shipping-notifications | Get Shipping Notifications
*OutboundsApi* | [**outboundsGetUpdates**](docs/Api/OutboundsApi.md#outboundsgetupdates) | **GET** /api/v1/fulfiller/outbounds/updates | Get Updates
*OutboundsApi* | [**outboundsPostShippingLabelForOutbound**](docs/Api/OutboundsApi.md#outboundspostshippinglabelforoutbound) | **POST** /api/v1/fulfiller/outbounds/{outboundId}/shipping-labels | Post Shipping Label For Outbound
*OutboundsApi* | [**outboundsPostShippingNotification**](docs/Api/OutboundsApi.md#outboundspostshippingnotification) | **POST** /api/v1/fulfiller/outbounds/{outboundId}/shipping-notifications | Post Shipping Notification
*ProductsApi* | [**productsGet**](docs/Api/ProductsApi.md#productsget) | **GET** /api/v1/fulfiller/products/{jfsku} | Get
*ProductsApi* | [**productsGetAll**](docs/Api/ProductsApi.md#productsgetall) | **GET** /api/v1/fulfiller/products | Get All
*ProductsApi* | [**productsGetPicture**](docs/Api/ProductsApi.md#productsgetpicture) | **GET** /api/v1/fulfiller/products/{jfsku}/pictures/{number} | Get Picture
*ProductsApi* | [**productsGetPictureData**](docs/Api/ProductsApi.md#productsgetpicturedata) | **GET** /api/v1/fulfiller/products/{jfsku}/pictures/{number}/data | Get Picture Data
*ProductsApi* | [**productsGetUpdates**](docs/Api/ProductsApi.md#productsgetupdates) | **GET** /api/v1/fulfiller/products/updates | Get Updates
*ProductsApi* | [**productsPostRelated**](docs/Api/ProductsApi.md#productspostrelated) | **POST** /api/v1/fulfiller/products/{jfsku}/related-products/condition | Post Related
*ReturnsApi* | [**returnsDelete**](docs/Api/ReturnsApi.md#returnsdelete) | **DELETE** /api/v1/fulfiller/returns/{returnId} | Delete
*ReturnsApi* | [**returnsDeleteReturnItem**](docs/Api/ReturnsApi.md#returnsdeletereturnitem) | **DELETE** /api/v1/fulfiller/returns/{returnId}/items/{returnItemId} | Delete Return Item
*ReturnsApi* | [**returnsGet**](docs/Api/ReturnsApi.md#returnsget) | **GET** /api/v1/fulfiller/returns/{returnId} | Get
*ReturnsApi* | [**returnsGetAll**](docs/Api/ReturnsApi.md#returnsgetall) | **GET** /api/v1/fulfiller/returns | Get All
*ReturnsApi* | [**returnsGetChanges**](docs/Api/ReturnsApi.md#returnsgetchanges) | **GET** /api/v1/fulfiller/returns/changes | Get Changes
*ReturnsApi* | [**returnsGetChangesFromReturn**](docs/Api/ReturnsApi.md#returnsgetchangesfromreturn) | **GET** /api/v1/fulfiller/returns/{returnId}/changes | Get Changes for specific for specific Return
*ReturnsApi* | [**returnsGetReturnItem**](docs/Api/ReturnsApi.md#returnsgetreturnitem) | **GET** /api/v1/fulfiller/returns/{returnId}/items/{returnItemId} | Get Return Item
*ReturnsApi* | [**returnsGetUpdates**](docs/Api/ReturnsApi.md#returnsgetupdates) | **GET** /api/v1/fulfiller/returns/updates | Get Updates
*ReturnsApi* | [**returnsLock**](docs/Api/ReturnsApi.md#returnslock) | **PUT** /api/v1/fulfiller/returns/{returnId}/lock | Lock
*ReturnsApi* | [**returnsPatch**](docs/Api/ReturnsApi.md#returnspatch) | **PATCH** /api/v1/fulfiller/returns/{returnId} | Patch
*ReturnsApi* | [**returnsPatchReturnItem**](docs/Api/ReturnsApi.md#returnspatchreturnitem) | **PATCH** /api/v1/fulfiller/returns/{returnId}/items/{returnItemId} | Patch Return Item
*ReturnsApi* | [**returnsPost**](docs/Api/ReturnsApi.md#returnspost) | **POST** /api/v1/fulfiller/returns | Post
*ReturnsApi* | [**returnsPostIncomingReturnItem**](docs/Api/ReturnsApi.md#returnspostincomingreturnitem) | **POST** /api/v1/fulfiller/returns/{returnId}/items/{returnItemId}/incomming-goods | Post Incoming Return Item
*ReturnsApi* | [**returnsPostReturnItem**](docs/Api/ReturnsApi.md#returnspostreturnitem) | **POST** /api/v1/fulfiller/returns/{returnId}/items | Post Return Item
*ReturnsApi* | [**returnsSplitReturnItem**](docs/Api/ReturnsApi.md#returnssplitreturnitem) | **POST** /api/v1/fulfiller/returns/{returnId}/items/{returnItemId} | Split Return Item
*ReturnsApi* | [**returnsUnlock**](docs/Api/ReturnsApi.md#returnsunlock) | **PUT** /api/v1/fulfiller/returns/{returnId}/unlock | Unlock
*ShippingMethodsApi* | [**shippingMethodsDelete**](docs/Api/ShippingMethodsApi.md#shippingmethodsdelete) | **DELETE** /api/v1/fulfiller/shippingmethods/{shippingMethodId} | Delete
*ShippingMethodsApi* | [**shippingMethodsGet**](docs/Api/ShippingMethodsApi.md#shippingmethodsget) | **GET** /api/v1/fulfiller/shippingmethods/{shippingMethodId} | Get
*ShippingMethodsApi* | [**shippingMethodsGetAll**](docs/Api/ShippingMethodsApi.md#shippingmethodsgetall) | **GET** /api/v1/fulfiller/shippingmethods | Get All
*ShippingMethodsApi* | [**shippingMethodsGetUpdates**](docs/Api/ShippingMethodsApi.md#shippingmethodsgetupdates) | **GET** /api/v1/fulfiller/shippingmethods/updates | Get Updates
*ShippingMethodsApi* | [**shippingMethodsPost**](docs/Api/ShippingMethodsApi.md#shippingmethodspost) | **POST** /api/v1/fulfiller/shippingmethods | Post
*ShippingMethodsApi* | [**shippingMethodsUpdate**](docs/Api/ShippingMethodsApi.md#shippingmethodsupdate) | **PATCH** /api/v1/fulfiller/shippingmethods/{shippingMethodId} | Update
*StocksApi* | [**stocksGetRecentStockChanges**](docs/Api/StocksApi.md#stocksgetrecentstockchanges) | **GET** /api/v1/fulfiller/stocks/updates | Get Recent Stock Changes Updates
*StocksApi* | [**stocksGetStock**](docs/Api/StocksApi.md#stocksgetstock) | **GET** /api/v1/fulfiller/stocks/{jfsku} | Get Stock
*StocksApi* | [**stocksGetStockChangesAll**](docs/Api/StocksApi.md#stocksgetstockchangesall) | **GET** /api/v1/fulfiller/stocks/changes | Get Stock Changes All
*StocksApi* | [**stocksGetStockChangesInWarehouseAll**](docs/Api/StocksApi.md#stocksgetstockchangesinwarehouseall) | **GET** /api/v1/fulfiller/stocks/changes/{warehouseId} | Get Stock Changes In Warehouse All
*StocksApi* | [**stocksGetStockInWarehouse**](docs/Api/StocksApi.md#stocksgetstockinwarehouse) | **GET** /api/v1/fulfiller/stocks/{jfsku}/{warehouseId} | Get Stock In Warehouse
*StocksApi* | [**stocksGetStocksAll**](docs/Api/StocksApi.md#stocksgetstocksall) | **GET** /api/v1/fulfiller/stocks | Get Stocks All
*StocksApi* | [**stocksGetStocksInWarehouseAll**](docs/Api/StocksApi.md#stocksgetstocksinwarehouseall) | **GET** /api/v1/fulfiller/stocks/warehouse/{warehouseId} | Get Stocks In Warehouse All
*StocksApi* | [**stocksPostAdjustment**](docs/Api/StocksApi.md#stockspostadjustment) | **POST** /api/v1/fulfiller/stocks/adjustments | Post Adjustment
*WarehousesApi* | [**warehousesDelete**](docs/Api/WarehousesApi.md#warehousesdelete) | **DELETE** /api/v1/fulfiller/warehouses/{warehouseId} | Delete
*WarehousesApi* | [**warehousesGet**](docs/Api/WarehousesApi.md#warehousesget) | **GET** /api/v1/fulfiller/warehouses/{warehouseId} | Get
*WarehousesApi* | [**warehousesGetAll**](docs/Api/WarehousesApi.md#warehousesgetall) | **GET** /api/v1/fulfiller/warehouses | Get All
*WarehousesApi* | [**warehousesGetUpdates**](docs/Api/WarehousesApi.md#warehousesgetupdates) | **GET** /api/v1/fulfiller/warehouses/updates | Get Updates
*WarehousesApi* | [**warehousesPost**](docs/Api/WarehousesApi.md#warehousespost) | **POST** /api/v1/fulfiller/warehouses | Post
*WarehousesApi* | [**warehousesUpdate**](docs/Api/WarehousesApi.md#warehousesupdate) | **PATCH** /api/v1/fulfiller/warehouses/{warehouseId} | Update

## Models

- [Address](docs/Model/Address.md)
- [Attribute](docs/Model/Attribute.md)
- [AttributeType](docs/Model/AttributeType.md)
- [Authorization](docs/Model/Authorization.md)
- [AuthorizedShippingMethod](docs/Model/AuthorizedShippingMethod.md)
- [BestBefore](docs/Model/BestBefore.md)
- [BillOfMaterialsComponent](docs/Model/BillOfMaterialsComponent.md)
- [ChangeOutboundStatusRequest](docs/Model/ChangeOutboundStatusRequest.md)
- [ChangeStatusRequest](docs/Model/ChangeStatusRequest.md)
- [ChangeWarehouseRequest](docs/Model/ChangeWarehouseRequest.md)
- [ChangedOutboundStatus](docs/Model/ChangedOutboundStatus.md)
- [ConditionType](docs/Model/ConditionType.md)
- [CreateAddressRequest](docs/Model/CreateAddressRequest.md)
- [CreateAmazonSfpShippingLabelDataRequest](docs/Model/CreateAmazonSfpShippingLabelDataRequest.md)
- [CreateAuthorizedShippingMethodRequest](docs/Model/CreateAuthorizedShippingMethodRequest.md)
- [CreateBestBeforeRequest](docs/Model/CreateBestBeforeRequest.md)
- [CreateIncomingGoodsBulkRequest](docs/Model/CreateIncomingGoodsBulkRequest.md)
- [CreateIncomingGoodsItemRequest](docs/Model/CreateIncomingGoodsItemRequest.md)
- [CreateIncomingReturnItemRequest](docs/Model/CreateIncomingReturnItemRequest.md)
- [CreateOutboundShippingNotificationItemRequest](docs/Model/CreateOutboundShippingNotificationItemRequest.md)
- [CreateOutboundShippingNotificationRequest](docs/Model/CreateOutboundShippingNotificationRequest.md)
- [CreateOutboundShippingPackageDimensionsRequest](docs/Model/CreateOutboundShippingPackageDimensionsRequest.md)
- [CreateOutboundShippingPackageRequest](docs/Model/CreateOutboundShippingPackageRequest.md)
- [CreateOutboundStatusRequest](docs/Model/CreateOutboundStatusRequest.md)
- [CreatePackageIdentifierRequest](docs/Model/CreatePackageIdentifierRequest.md)
- [CreateRelatedProductRequest](docs/Model/CreateRelatedProductRequest.md)
- [CreateReturnItemRequest](docs/Model/CreateReturnItemRequest.md)
- [CreateReturnItemSplitRequest](docs/Model/CreateReturnItemSplitRequest.md)
- [CreateReturnRequest](docs/Model/CreateReturnRequest.md)
- [CreateShippingLabelDataRequest](docs/Model/CreateShippingLabelDataRequest.md)
- [CreateShippingMethodRequest](docs/Model/CreateShippingMethodRequest.md)
- [CreateStockAdjustmentRequest](docs/Model/CreateStockAdjustmentRequest.md)
- [CreateWarehouseRequest](docs/Model/CreateWarehouseRequest.md)
- [DeliveryExperienceType](docs/Model/DeliveryExperienceType.md)
- [Dimensions](docs/Model/Dimensions.md)
- [DocumentType](docs/Model/DocumentType.md)
- [ErrorCode](docs/Model/ErrorCode.md)
- [ErrorMessages](docs/Model/ErrorMessages.md)
- [ErrorResponse](docs/Model/ErrorResponse.md)
- [FfnServerApiV1FulfillerReturnsModelsChangedLockStatus](docs/Model/FfnServerApiV1FulfillerReturnsModelsChangedLockStatus.md)
- [FfnServerApiV1FulfillerReturnsModelsChangedReturn](docs/Model/FfnServerApiV1FulfillerReturnsModelsChangedReturn.md)
- [FfnServerApiV1FulfillerReturnsModelsChangedReturnItem](docs/Model/FfnServerApiV1FulfillerReturnsModelsChangedReturnItem.md)
- [FfnServerApiV1FulfillerReturnsModelsChangedReturnItemStockChange](docs/Model/FfnServerApiV1FulfillerReturnsModelsChangedReturnItemStockChange.md)
- [FfnServerApiV1FulfillerReturnsModelsReturnChange](docs/Model/FfnServerApiV1FulfillerReturnsModelsReturnChange.md)
- [FfnServerApiV1FulfillerReturnsModelsReturnItemChange](docs/Model/FfnServerApiV1FulfillerReturnsModelsReturnItemChange.md)
- [FfnServerApiV1FulfillerReturnsModelsReturnItemStockChangeChange](docs/Model/FfnServerApiV1FulfillerReturnsModelsReturnItemStockChangeChange.md)
- [FfnServerApiV1FulfillerSharedModelsChangedAddress](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedAddress.md)
- [FfnServerApiV1FulfillerSharedModelsChangedConditionType](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedConditionType.md)
- [FfnServerApiV1FulfillerSharedModelsChangedDateTimeOffset](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedDateTimeOffset.md)
- [FfnServerApiV1FulfillerSharedModelsChangedDecimal](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedDecimal.md)
- [FfnServerApiV1FulfillerSharedModelsChangedInt](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedInt.md)
- [FfnServerApiV1FulfillerSharedModelsChangedReturnReasonType](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedReturnReasonType.md)
- [FfnServerApiV1FulfillerSharedModelsChangedReturnType](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedReturnType.md)
- [FfnServerApiV1FulfillerSharedModelsChangedString](docs/Model/FfnServerApiV1FulfillerSharedModelsChangedString.md)
- [FfnServerApiV1FulfillerStocksModelsChangedStockChangeId](docs/Model/FfnServerApiV1FulfillerStocksModelsChangedStockChangeId.md)
- [FreightOptionType](docs/Model/FreightOptionType.md)
- [Identifier](docs/Model/Identifier.md)
- [IdentifierType](docs/Model/IdentifierType.md)
- [Inbound](docs/Model/Inbound.md)
- [InboundItem](docs/Model/InboundItem.md)
- [InboundShippingNotification](docs/Model/InboundShippingNotification.md)
- [InboundShippingNotificationItem](docs/Model/InboundShippingNotificationItem.md)
- [InboundShippingPackage](docs/Model/InboundShippingPackage.md)
- [InboundShippingPackageDimensions](docs/Model/InboundShippingPackageDimensions.md)
- [InboundStatus](docs/Model/InboundStatus.md)
- [InboundSupplier](docs/Model/InboundSupplier.md)
- [ItemType](docs/Model/ItemType.md)
- [KindOfRelationType](docs/Model/KindOfRelationType.md)
- [LockStatus](docs/Model/LockStatus.md)
- [Merchant](docs/Model/Merchant.md)
- [ModelReturn](docs/Model/ModelReturn.md)
- [ModificationInfo](docs/Model/ModificationInfo.md)
- [Mpn](docs/Model/Mpn.md)
- [ObjectState](docs/Model/ObjectState.md)
- [Outbound](docs/Model/Outbound.md)
- [OutboundAttachment](docs/Model/OutboundAttachment.md)
- [OutboundAttachmentData](docs/Model/OutboundAttachmentData.md)
- [OutboundItem](docs/Model/OutboundItem.md)
- [OutboundShippingLabel](docs/Model/OutboundShippingLabel.md)
- [OutboundShippingNotification](docs/Model/OutboundShippingNotification.md)
- [OutboundShippingNotificationItem](docs/Model/OutboundShippingNotificationItem.md)
- [OutboundShippingPackage](docs/Model/OutboundShippingPackage.md)
- [OutboundShippingPackageDimensions](docs/Model/OutboundShippingPackageDimensions.md)
- [OutboundStatusType](docs/Model/OutboundStatusType.md)
- [PackageIdentifier](docs/Model/PackageIdentifier.md)
- [Page](docs/Model/Page.md)
- [PageLinks](docs/Model/PageLinks.md)
- [PagedAuthorizationResponse](docs/Model/PagedAuthorizationResponse.md)
- [PagedInboundResponse](docs/Model/PagedInboundResponse.md)
- [PagedMerchantResponse](docs/Model/PagedMerchantResponse.md)
- [PagedOutboundResponse](docs/Model/PagedOutboundResponse.md)
- [PagedProductResponse](docs/Model/PagedProductResponse.md)
- [PagedReturnResponse](docs/Model/PagedReturnResponse.md)
- [PagedShippingMethodResponse](docs/Model/PagedShippingMethodResponse.md)
- [PagedStockChangeResponse](docs/Model/PagedStockChangeResponse.md)
- [PagedStockChangeWithProductResponse](docs/Model/PagedStockChangeWithProductResponse.md)
- [PagedStockInWarehouseResponse](docs/Model/PagedStockInWarehouseResponse.md)
- [PagedStockResponse](docs/Model/PagedStockResponse.md)
- [PagedWarehouseResponse](docs/Model/PagedWarehouseResponse.md)
- [Picture](docs/Model/Picture.md)
- [PictureData](docs/Model/PictureData.md)
- [PremiumType](docs/Model/PremiumType.md)
- [Price](docs/Model/Price.md)
- [Product](docs/Model/Product.md)
- [ProductBundle](docs/Model/ProductBundle.md)
- [ProductPageItem](docs/Model/ProductPageItem.md)
- [RecentAuthorizationList](docs/Model/RecentAuthorizationList.md)
- [RecentInboundList](docs/Model/RecentInboundList.md)
- [RecentInboundShippingNotificationList](docs/Model/RecentInboundShippingNotificationList.md)
- [RecentMerchantList](docs/Model/RecentMerchantList.md)
- [RecentOutboundList](docs/Model/RecentOutboundList.md)
- [RecentProductList](docs/Model/RecentProductList.md)
- [RecentReturnChangeList](docs/Model/RecentReturnChangeList.md)
- [RecentReturnList](docs/Model/RecentReturnList.md)
- [RecentShippingMethodList](docs/Model/RecentShippingMethodList.md)
- [RecentStockChangeList](docs/Model/RecentStockChangeList.md)
- [RecentWarehouseList](docs/Model/RecentWarehouseList.md)
- [RelatedProduct](docs/Model/RelatedProduct.md)
- [ReturnItem](docs/Model/ReturnItem.md)
- [ReturnItemStockChange](docs/Model/ReturnItemStockChange.md)
- [ReturnReasonType](docs/Model/ReturnReasonType.md)
- [ReturnType](docs/Model/ReturnType.md)
- [ShippingMethod](docs/Model/ShippingMethod.md)
- [ShippingMethodAuthorizationRequest](docs/Model/ShippingMethodAuthorizationRequest.md)
- [ShippingType](docs/Model/ShippingType.md)
- [Specifications](docs/Model/Specifications.md)
- [Statistics](docs/Model/Statistics.md)
- [StatisticsPerWarehouse](docs/Model/StatisticsPerWarehouse.md)
- [StatusTimestamp](docs/Model/StatusTimestamp.md)
- [Stock](docs/Model/Stock.md)
- [StockAnnouncedDetail](docs/Model/StockAnnouncedDetail.md)
- [StockChange](docs/Model/StockChange.md)
- [StockChangeId](docs/Model/StockChangeId.md)
- [StockChangeInboundItem](docs/Model/StockChangeInboundItem.md)
- [StockChangeOutboundItem](docs/Model/StockChangeOutboundItem.md)
- [StockChangeOutboundShippingNotificationItem](docs/Model/StockChangeOutboundShippingNotificationItem.md)
- [StockChangeReturnItem](docs/Model/StockChangeReturnItem.md)
- [StockChangeType](docs/Model/StockChangeType.md)
- [StockChangeWithProduct](docs/Model/StockChangeWithProduct.md)
- [StockInWarehouse](docs/Model/StockInWarehouse.md)
- [StockLevelDetail](docs/Model/StockLevelDetail.md)
- [StockReservedDetail](docs/Model/StockReservedDetail.md)
- [UpdateAddressRequest](docs/Model/UpdateAddressRequest.md)
- [UpdateReturnItemRequest](docs/Model/UpdateReturnItemRequest.md)
- [UpdateReturnRequest](docs/Model/UpdateReturnRequest.md)
- [UpdateShippingMethodRequest](docs/Model/UpdateShippingMethodRequest.md)
- [UpdateWarehouseRequest](docs/Model/UpdateWarehouseRequest.md)
- [Warehouse](docs/Model/Warehouse.md)
- [WarehouseAuthorization](docs/Model/WarehouseAuthorization.md)
- [WarehouseAuthorizationRequest](docs/Model/WarehouseAuthorizationRequest.md)

## Authorization
Endpoints do not require authorization.

## Tests

To run the tests, use:

```bash
composer install
vendor/bin/phpunit
```

## Author

info@jtl-software.de

## About this package

This PHP package is automatically generated by the [OpenAPI Generator](https://openapi-generator.tech) project:

- API version: `v1`
    - Generator version: `7.14.0`
- Build package: `org.openapitools.codegen.languages.PhpClientCodegen`