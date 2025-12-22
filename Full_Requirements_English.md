Full Requirements Document (English)

====================================

1\. Project Vision

A responsive, multi-tenant dashboard for managing customers, shops,
orders, returns, inbound deliveries, warehouse tasks, and chat
communication. Integrates deeply with JTL-FFN, extending areas where the
official API has limitations (e.g., custom returns module). Built using
TailwindCSS and LiveWire.

2\. User Roles & Permissions

\- Super Admin: Full access, can impersonate customers, manage
predefined responses, create customers, view all chats.

\- Customer: Access to own shops, articles, orders, inbound deliveries,
returns, and chat with Super Admin.

\- Warehouse Staff: Access to returns, inbound deliveries, and tasks.
Can send predefined responses (double-confirm required), create
free-text which is sent to Super Admin for approval.

3\. Multi-Tenancy

Each customer is isolated (tenant). Customers may connect multiple
shops. Stock is shared across all shops of a customer.

4\. Dashboard KPIs

\- Orders today

\- Monthly chart (last 12 months)

\- Open orders

\- Returns today

\- Open inbound deliveries

\- Low stock items

\- Top sellers

\- Open support requests

5\. Shop Integrations

Customers can connect Shopify, WooCommerce, etc. via Client-ID and
Client-Secret. Multiple shops allowed per customer. Secrets stored
encrypted. Connection validation via API test call.

6\. Article Management

List and detail views mirroring JTL-FFN. Create, edit, and sync
articles. Search and filter supported. Edit pushes updates to JTL-FFN
and optionally shops.

7\. Order Management

View, search, and filter orders. Cancel orders via JTL-FFN. Create
Replacement Orders:

\- Opens a modal showing original order.

\- Default: identical quantities.

\- Quantities may be adjusted.

\- New order number = original + "E" (E = Replacement).

\- Optionally notify customer via chat.

8\. Inbound Deliveries

Create inbound deliveries in JTL-FFN via dashboard. Option “simulate
stock booked” temporarily increases stock in connected shops until
delivery confirmed. On confirmation, simulated stock replaced with
actual received amount.

9\. Returns Module (Custom)

Since JTL-FFN returns are unreliable, a custom returns system is
required.

Workflow:

\- Warehouse uses responsive web app to upload photos.

\- AI attempts recognition of customer and items using
barcode/label/address.

\- If customer unknown → mark “Unknown Return” → Super Admin notified.

\- If customer known but item unknown → warehouse selects from list of
customer's items.

\- Customer returns require photo per item; multiple photos allowed.

\- Status workflow: Received → Checked → Restocked or Not restocked.

10\. Chat & Task System

One chat per customer:

\- Customer ↔ Super Admin communication.

\- Warehouse can read but cannot freely message customer.

\- Warehouse uses predefined responses (double confirm) to send messages
directly.

\- Free text from warehouse routed to Super Admin as draft.

Task creation:

\- Messages can be flagged as tasks.

\- AI identifies potential tasks → Super Admin confirms or rejects.

\- Option to notify customer when a task is created.

11\. Predefined Responses

Super Admin manages predefined warehouse responses. Warehouse chooses
them via dropdown, must double-confirm before sending to customer.

12\. Data Model (Simplified)

\- Users, Customers, Shops

\- Articles, Orders, Replacement Orders

\- Deliveries, Returns

\- Chat Messages, Tasks

\- Predefined Responses, Audit Logs

13\. External APIs

JTL-FFN for articles, orders, deliveries. Shops (Shopify/WooCommerce)
for stock and order sync. All credentials encrypted.

14\. Non-Functional Requirements

\- Performance: \<2s load for main pages with large datasets.

\- Security: TLS, encrypted secrets, RBAC enforcement.

\- GDPR compliance.

\- Scalable infrastructure.

\- Full audit logging for critical operations.

15\. Risks

\- AI recognition quality varies.

\- JTL-FFN API limitations may require fallback logic.

\- Race conditions in simulated stock updates.

16\. Glossary

"E" = Replacement order.

Inbound delivery = Incoming stock delivery.

Return = Customer or carrier return.

End of document.
