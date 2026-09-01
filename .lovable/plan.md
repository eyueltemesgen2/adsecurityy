# AD Security Camera Solution — Full Platform

A real, database-backed business platform: public website, customer portal (products, cart, orders, service requests), and an admin control center that manages all customer-facing content.

Because of its size, this is built in phases. Each phase ends with a working, testable app — no mock data, no dead buttons.

## Phase 1 — Foundation, design, backend
- Enable Lovable Cloud (database, auth, file storage, server logic).
- Choose the visual direction (I'll show you 3 rendered options first: professional security-industry look, strong typography, no AI-template feel).
- Database schema + seed data: users/profiles, roles, product categories, products, product images/specs, services + service categories, service requests + uploaded files, orders + order items, addresses, cart, notifications, contact messages, gallery, testimonials, FAQs, website settings, homepage sections, pages, navigation items, footer sections, social links, media, announcements, audit logs.
- Security: row-level policies per role, roles in a separate table, server-side authorization on every admin action, validated/limited file uploads.
- Auth: register, login, logout, forgot/reset password, protected customer area, admin-only area.
- Seeded content includes real-looking products, categories, the 6 services, FAQs, testimonials, gallery, company contact info (adsecuritycamerasolution@gmail.com, @adsecuritycamera on Instagram/Telegram/TikTok) — all editable by admin.

## Phase 2 — Public website (CMS-driven)
- Sticky header with admin-controlled navigation, search, cart, account menu, Request Service CTA; real mobile menu.
- Home: hero, trust points, services, featured products, installation section, why choose us, how it works, testimonials, gallery preview, FAQ preview, final CTA — every section reads published data from the database.
- Pages: Products (search, filters, sorting, pagination), Product detail, Services, Service detail, About, Gallery, FAQ, Contact (form saves to database), plus footer driven by CMS.
- Per-page SEO metadata from the database.

## Phase 3 — Customer portal & commerce
- Cart (persisted), checkout, order creation, order confirmation, my orders + status tracking.
- Service request form (service type, location, property type, preferred date/time, device count, description, photo/document upload) and request tracking.
- Dashboard overview, profile (name, email, phone, avatar, addresses, password change), notifications.

## Phase 4 — Admin control center
- Dashboard with real KPIs and charts (orders over time, revenue, customer growth, service requests).
- Management for orders, service requests (status, internal notes, scheduling, assigned staff), customers, products, categories, services, service categories, messages, notifications.
- Content: homepage sections, pages, About, gallery, testimonials, FAQs, navigation, footer, social links, branding (logo, favicon, company name), announcements, SEO, appearance (colors, radius, button style with live preview), media library.
- Draft → preview → publish for content, version history on key changes, audit log of admin actions.
- Fully usable on a phone.

## Phase 5 — Polish & acceptance
- Loading, empty, error, success states; 404 / unauthorized / server error pages; toasts and destructive-action confirmations.
- End-to-end run of both flows (customer purchase + service request; admin edits reflected on the live site) driven in a real browser.
- Deployment notes: required configuration, storage, auth setup.

## Technical notes
- TanStack Start with file-based routes; server functions for all data access; admin routes gated both client-side and server-side with role checks in the database.
- Design tokens in the global stylesheet, overridable by the admin appearance settings — no hardcoded colors in components.
- Branding, contact info, navigation, footer, and all section copy are read from the database, never hardcoded.
- Uploads go to Cloud storage with type/size validation and safe generated filenames; metadata tracked in the media table.
- Admin account: I'll set up the first admin via a role assignment you can trigger after registering with your email.

## Scope note
This is a large multi-message build. I'll implement it phase by phase and tell you what to test at the end of each phase.
