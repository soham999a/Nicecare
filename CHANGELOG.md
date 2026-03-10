# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-10

### Fixed

- Restored Manager access to products, sales reports, and CRM by aligning Firestore rules with Manager profiles stored in `inventoryUsers`
- Added consistent Manager permission fallback across protected inventory collections to prevent store-scoped access regressions

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
