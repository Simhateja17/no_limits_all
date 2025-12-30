Webhooks
In this guide we explain in more details what webhooks are and how they are used.

What are Webhooks?
A Webhook is an event notification sent to a URL of your choice. Merchants (or their developers) can configure a webhook that are triggered by events on one site, to invoke behavior on another site.

Webhooks are useful for integrating your site with third-party services or other external Application Programming Interfaces (API) that support them.

Webhooks in WooCommerce
Webhooks can trigger events each time you add, edit or delete orders, products, coupons, or customers, when purchases are made, etc.

Scope of support:

We are unable to provide support for customizations under our Support Policy. If you need to customize a snippet or extend its functionality, we recommend working with a Woo Agency Partner or a WooCommerce developer on Codeable.

It’s also possible to use webhooks with WooCommerce actions, e.g. create a webhook for use every time a product is added to the shopping cart, using the action woocommerce_add_to_cart.

Webhooks also enable third-party apps to integrate with WooCommerce.

Creating webhooks
To create a new webhook:

Go to WooCommerce > Settings > Advanced > Webhooks.
Select Add webhook. The Webhook data form appears.

Fill in the fields according to requirements:
Name – Describe the webhook. If left blank, the Name field defaults to “Webhook created on [date @ time of creation]”, but can updated later.
Status – set to Active to respond accordingly, Paused to not respond, or Disabled to not respond due to failures.
Topic – indicate when the webhook should be triggered based on a variety of events linked to coupons, customers, orders, products, and Action. Other topics may also be available depending on what plugins or extensions are active on the site.
Custom Topic: This option is for advanced users only. It’s possible to introduce new, customized topics with the help of woocommerce_webhook_topic_hooks filter.
Action Event – when Action is specified in the field above, this field is added and can be used to specify which action will trigger this webhook (for example woocommerce_add_to_cart for when customers add products to the shopping cart)
Delivery URL – specify the URL where the webhook response is delivered.
Secret – the Secret Key generates a hash of the delivered webhook and is provided in the request headers. This defaults to the current API user’s consumer secret, if nothing is entered.
Click Save Webhook to save the changes.
Note: The first time your webhook is saved with the Activated status, it sends a ping to the Delivery URL.

A webhook will be automatically disabled by WooCommerce if the total number of consecutive delivery failures are > 5. A failure is defined by anything that is not 2xx, 301 or 302. For example if delivery URL responds with 4xx or 5xx http code.

To increase/decrease the failure limit, you can use the woocommerce_max_webhook_delivery_failures filter.

Editing and deleting webhooks
Webhooks are listed the same way as posts or products.

Find the webhook you wish to alter.
Hover the pointer over the webhook name to see the ID, Edit and Delete permanently options appear.
Click Delete permanently, or click Edit to make and Save changes. Bulk deletion is also possible with the Bulk actions dropdown.

Webhook logs
WooCommerce saves logs of all events triggering a webhook. Webhook logs are found at WooCommerce > Status > Logs. For sites with many log files, select a source such as webhooks-delivery from the “All sources” dropdown to filter the list of log files. The search box to the top right can be used to search the content of logs files.


Logs may be reviewed to see delivery and response from the server, making it simpler to integrate and debug.

Questions and support
Do you still have questions and need assistance? 

This documentation is about the free, core WooCommerce plugin, for which support is provided in our community forums on WordPress.org. By searching this forum, you’ll often find that your question has been asked and answered before.

If you haven’t created a WordPress.org account to use the forums, here’s how.

If you’re looking to extend the core functionality shown here, we recommend reviewing available extensions in the WooCommerce Marketplace.
Need ongoing advanced support or a customization built for WooCommerce? Hire a Woo Agency Partner.
Are you a developer building your own WooCommerce integration or extension? Check our Developer Resources.
If you weren’t able to find the information you need, please use the feedback thumbs below to let us know.