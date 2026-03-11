# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-10

### Fixed

- Added 'Manager' role and restored 'Manager' access to products, sales reports, and CRM by aligning Firestore rules with Manager profiles stored in `inventoryUsers`
- Added consistent Manager permission fallback across protected inventory collections to prevent store-scoped access regressions

## [1.0.2] - 2026-03-11

### Added

- Owner Dashboard Cockpit: single-screen executive view with store + date controls, intervention queue, and store command ranking
- Store Command expanded view (foreground modal) with blurred background and executive summary

### Changed

- Dashboard KPIs now derive from live business data sources only (removed mock/dummy displays and aligned operational metrics to computed store performance)
- Unified repair status normalization and inventory threshold logic for consistent cross-module reporting

### Fixed

- Manager store visibility for the dashboard by subscribing to the correct owner tenant and scoping to assigned store

## [1.0.0] - 2026-02-28

### Already have

- Inventory management: store management, product management, and employee management
- Point of sale (POS) for member sales and transactions
- CRM module with customer management
- Sales reports and member sales dashboard
- AI-powered chatbot for inventory and customer support (RAG integration)
- User authentication: signup, login, forgot password, email verification
- Landing page with marketing sections
- Firebase Hosting deployment with staging and production channels
