# Invoice Desktop App — Project Context

## 1. Project Purpose

This project is an offline desktop application for artisans and small service businesses.

The first real user is an electrician, but the application must NOT be hard-coded specifically for electricians.

Future users may include:

- Electricians
- Plumbers
- Aluminium workers
- Carpenters
- Painters
- HVAC technicians
- Repair technicians
- Small construction businesses
- Other artisans

The application should help them easily manage:

- Clients
- Services
- Quotations / estimates
- Invoices
- Payments
- Company information
- Logos
- Invoice/document styles
- PDF generation

The application should remain simple enough for users who rarely use computers.

---

# 2. Core Product Principle

The most important product requirement is:

> The application must be understandable without training, documentation, or technical knowledge.

The target user may be an artisan who rarely uses a laptop.

For every screen, ask:

> Could an artisan who rarely uses a computer understand what to do without someone explaining it?

If the answer is no, simplify the interface.

When there is a choice between:

- more features
- simpler usability

prefer simpler usability unless the feature is essential.

---

# 3. Technology Stack

The project uses:

- Tauri 2
- React
- TypeScript
- Vite
- SQLite
- Tailwind CSS
- React Hook Form
- Zod

The application is primarily intended for Windows.

The application must work completely offline.

Do NOT introduce:

- Firebase
- Supabase
- PostgreSQL server
- MongoDB
- Remote database
- Backend API
- Cloud dependency

unless explicitly requested later.

---

# 4. Architecture Principles

Keep the architecture clean but simple.

Avoid enterprise-style over-engineering.

Use strict TypeScript.

Avoid `any`.

Separate concerns between:

- UI
- Business logic
- Database access
- Financial calculations
- Document generation

Do NOT place SQLite queries directly inside React presentation components.

Do NOT place important financial calculations directly inside UI components.

Avoid unnecessary abstraction layers.

Reuse existing components and patterns where appropriate.

Do not refactor unrelated working code unless necessary.

---

# 5. Generic Artisan Architecture

The project must remain generic.

Do NOT create core entities such as:

`ElectricianService`

Use:

`Service`

Do NOT create:

`ElectricInvoice`

Use:

`Invoice`

Core concepts should remain generic:

- Client
- Service
- Invoice
- Quotation
- Payment

Example:

An electrician can create:

Installation caméra

A plumber can create:

Installation chauffe-eau

An aluminium worker can create:

Installation fenêtre aluminium

No source-code modification should be required.

---

# 6. User Interface Language

The initial application interface should use simple French.

Avoid complicated administrative or technical language.

Prefer:

- Accueil
- Factures
- Devis
- Clients
- Services
- Paramètres

Avoid user-facing terminology such as:

- Référentiel
- Entity
- Transaction
- Record
- Template Engine
- Database
- Schema

For example:

Use:

`Services`

instead of:

`Référentiel des services`

Use:

`Style des factures`

instead of:

`Document Template Configuration`

---

# 7. UX Rules

The interface should feel:

- Simple
- Calm
- Modern
- Professional
- Trustworthy
- Easy to understand

Prefer:

- Large buttons
- Large clickable areas
- Clear labels
- Icons combined with text
- Short forms
- Few choices per screen
- Sensible defaults
- Obvious primary actions
- Comfortable spacing
- Readable typography
- Minimal number of clicks

Avoid:

- Tiny buttons
- Tiny icons
- Icon-only important actions
- Huge forms
- Complex navigation
- Deep nested menus
- Hidden important actions
- Right-click-only actions
- Keyboard-dependent workflows
- ERP-style interfaces
- Accounting-software complexity
- Overloaded tables

Important actions should contain text.

Bad:

`+`

Good:

`+ Nouvelle facture`

Bad:

Printer icon only.

Good:

`Imprimer`

---

# 8. Main Navigation

Keep the sidebar short.

Recommended navigation:

- Accueil
- Factures
- Devis
- Clients
- Services
- Paramètres

Do not expose unnecessary technical categories.

---

# 9. Home Screen

The home screen should prioritize common actions.

The most visible actions should be:

- Nouvelle facture
- Nouveau devis

Also provide easy access to:

- Clients
- Factures
- Devis

Do not turn the home screen into a complex analytics dashboard.

Simple useful information may be shown later, but creating documents is more important.

---

# 10. Most Important Workflow

The most important workflow in the application is creating an invoice.

For an existing client, the artisan should ideally be able to create an invoice very quickly.

Typical workflow:

1. Open application
2. Click `Nouvelle facture`
3. Select client
4. Select services
5. Enter quantity and price
6. Enter payment information
7. Verify
8. Create invoice
9. Print or open PDF

This workflow should require as few unnecessary clicks as possible.

---

# 11. Client Management

A client may contain:

- ID
- Client type
- Name / company name
- Contact person
- Phone
- Address
- City
- Email
- ICE
- IF
- RC
- Notes
- Active/archive status
- Created date
- Updated date

Client types:

- Individual
- Company

Not every field should be mandatory.

---

# 12. Quick Client Creation

When creating an invoice, the user should be able to create a client without leaving the invoice workflow.

Initial quick form:

- Nom
- Téléphone

Then optionally:

`Plus d'informations`

which can reveal:

- Adresse
- Ville
- Email
- ICE
- IF
- RC
- Notes

Do not overwhelm the user with all fields immediately.

---

# 13. Services

Users maintain a configurable service catalogue.

A service should support:

- ID
- Optional reference/code
- French name
- Arabic name
- English name
- French description
- Arabic description
- English description
- Default unit
- Default price
- Active/archive status
- Created date
- Updated date

Example:

Code:

ELEC-004

French:

Installation caméra de surveillance

Arabic:

تركيب كاميرا مراقبة

English:

Security camera installation

Default price:

500 MAD

---

# 14. Service Behaviour

The default service price is only a suggestion.

When adding a service to an invoice, the user can change the price for that particular invoice.

Changing an invoice item's price must NOT modify the service catalogue's default price.

Example:

Default service price:

500 MAD

Invoice today:

450 MAD

The service catalogue should remain:

500 MAD

unless the user explicitly edits the service itself.

---

# 15. Service Selection UX

Adding a service to an invoice should be very easy.

Provide an obvious action:

`Ajouter un service`

Allow searching by partial text.

Example:

Typing:

`cam`

should find:

`Installation caméra de surveillance`

After selecting a service, show simple information.

Example:

Installation caméra

Quantité:

`[-] 4 [+]`

Prix unitaire:

`500 MAD`

Total:

`2 000 MAD`

---

# 16. Progressive Disclosure

Do not show advanced fields unless necessary.

For an invoice item, show by default:

- Service
- Quantity
- Price
- Total

Optional fields may appear under:

`Plus d'options`

For example:

- Custom description
- Unit
- Discount
- Tax

Keep normal workflows simple.

---

# 17. Supported Document Languages

Invoices and quotations support:

- French
- Arabic
- English

Default document language:

French

The document language is independent from the application UI language.

Example:

The software interface can remain French while generating an Arabic invoice.

When document language is Arabic, use the Arabic version of service descriptions.

Arabic documents must correctly support:

- Arabic connected characters
- RTL layout where required
- Correct text alignment
- Appropriate Arabic-compatible fonts

---

# 18. Company Information

Company settings may contain:

- Company name
- Owner/contact person
- Address
- City
- Country
- Phone
- Email
- Website
- ICE
- IF
- RC
- Patente
- CNSS
- Bank name
- RIB / IBAN
- Default currency
- Default language

Not every field is mandatory.

---

# 19. First Launch UX

First launch should be simple.

Do NOT show a large configuration screen.

Prefer something like:

Bienvenue

Configurons votre entreprise.

Initial information:

- Company name
- Phone
- Address
- Logo
- Primary color

Then:

`Commencer`

Other information such as ICE, IF, RC and bank details can be entered later.

---

# 20. Currency

Default currency:

MAD

Display money clearly.

Example:

`2 500 MAD`

Important totals should be visually prominent.

---

# 21. Invoices

An invoice may contain:

- ID
- Invoice number
- Client
- Invoice date
- Due date
- Language
- Document style
- Logo
- Items
- Subtotal
- Discount
- Tax
- Total
- Payments
- Remaining balance
- Status
- Notes
- Created date
- Updated date

---

# 22. Invoice Numbering

Invoice numbers should normally be generated automatically.

Example:

FAC-2026-0001

FAC-2026-0002

FAC-2026-0003

The artisan should not normally need to manage invoice numbers manually.

Duplicate invoice numbers must not be allowed.

---

# 23. Invoice Creation UX

Do NOT display invoice creation as one giant form.

Organize it naturally around:

- Client
- Services
- Payment
- Verification
- Generation

The user should always understand:

- What he is currently doing
- What information is required
- What happens next

Avoid unnecessary separate pages where a simpler workflow is possible.

---

# 24. Payment Methods

Supported payment methods may include:

- Espèces
- Virement bancaire
- Chèque
- Carte
- Autre

---

# 25. Payment UX

Payment should be visual and easy to understand.

Example:

TOTAL

5 000 MAD

Montant payé

2 000 MAD

RESTE À PAYER

3 000 MAD

Mode de paiement

Espèces

The application should calculate the remaining balance automatically.

---

# 26. Invoice Status

Invoice status should be calculated where possible.

Possible statuses:

- Brouillon
- Non payée
- Partiellement payée
- Payée
- Annulée

Example:

Total:

5 000 MAD

Paid:

0 MAD

Status:

Non payée

Example:

Total:

5 000 MAD

Paid:

2 000 MAD

Status:

Partiellement payée

Example:

Total:

5 000 MAD

Paid:

5 000 MAD

Status:

Payée

Do not force the artisan to manually calculate or select payment status.

---

# 27. Multiple Payments

The architecture must support multiple payments for one invoice.

Example:

Invoice total:

10 000 MAD

Payment 1:

3 000 MAD
Espèces

Payment 2:

2 000 MAD
Virement

Remaining:

5 000 MAD

Do not permanently model payments using only one `amountPaid` field if that prevents storing payment history.

Use a proper Payment model when persistence is implemented.

---

# 28. Invoice Verification

Before generating the invoice, show a simple verification summary.

Example:

FACTURE

Client:

Ahmed Bennani

Services:

Installation caméra × 4

TOTAL:

2 000 MAD

PAYÉ:

1 000 MAD

RESTE:

1 000 MAD

Primary actions:

- Modifier
- Créer la facture

Do not overload this screen with actions.

---

# 29. Invoice Success Screen

After invoice creation, clearly show that it succeeded.

Example:

Facture créée

FAC-2026-0023

Ahmed Bennani

Total:

2 000 MAD

Available actions:

- Imprimer
- Ouvrir PDF
- Nouvelle facture
- Retour à l'accueil

Do not silently redirect the user without confirmation.

---

# 30. Quotations / Devis

The application supports quotations.

Example numbering:

DEV-2026-0001

A quotation may contain:

- Client
- Date
- Valid until
- Language
- Document style
- Items
- Quantities
- Prices
- Discounts
- Taxes
- Total
- Notes
- Status

Possible statuses:

- Brouillon
- Envoyé
- Accepté
- Refusé
- Expiré
- Facturé

---

# 31. Convert Quotation to Invoice

A quotation should eventually be convertible to an invoice.

Conversion should reuse:

- Client
- Services
- Descriptions
- Quantities
- Prices
- Discounts
- Taxes

The invoice receives a new invoice number.

The original quotation must remain stored.

---

# 32. Logos

The application may store multiple logos.

Users should eventually be able to:

- Add logo
- Preview logo
- Rename logo
- Select default logo
- Remove/archive safely

Do not permanently rely on the original absolute file path selected by the user.

Copy/import logos into application-controlled local storage.

---

# 33. Document Styles

The application supports multiple document styles.

For the end user, use simple names such as:

- Style 1
- Style 2

A style may configure:

- Logo
- Header primary color
- Footer color
- Accent color
- Footer text
- Visible company information

Avoid exposing implementation terminology like:

`Template Engine`

---

# 34. PDF Generation

Invoices and quotations should eventually generate professional A4 PDFs.

PDF architecture should separate:

Document data

from:

Visual style

Conceptually:

`DocumentData`

may contain:

- Company snapshot
- Client snapshot
- Document number
- Dates
- Items
- Totals
- Payments
- Notes

Different visual styles should consume the same document data.

This allows adding Style 3 later without changing invoice business logic.

---

# 35. Historical Document Integrity

Historical invoices and quotations must NOT change when master data changes.

Example:

Today:

Installation caméra = 500 MAD

FAC-2026-0010 contains:

500 MAD

Tomorrow the user changes the service default price to:

600 MAD

FAC-2026-0010 must remain:

500 MAD

Therefore invoice and quotation items must store snapshots of important information.

Examples:

- Service name
- Description
- Quantity
- Unit
- Unit price
- Discount
- Tax

Where necessary, documents should also preserve snapshots of:

- Client information
- Company information
- Document style information

Previously generated documents must not silently change because Settings were modified.

---

# 36. Database

Use local SQLite.

Use proper migrations.

Use foreign keys where appropriate.

Use indexes for commonly searched fields when helpful.

Do not place database queries directly inside React UI components.

Keep database logic separated from presentation logic.

Avoid unnecessary enterprise-style repository layers unless they clearly help maintainability.

---

# 37. Financial Calculations

Financial calculations must be reliable.

Avoid unsafe floating-point logic for money.

Keep calculations in reusable business functions.

Examples:

- calculateLineTotal()
- calculateSubtotal()
- calculateDiscount()
- calculateTax()
- calculateTotal()
- calculateRemainingBalance()

Add tests when important financial calculation logic is implemented.

---

# 38. Search

Search should be forgiving.

Typing:

`ahm`

should find:

`Ahmed Bennani`

Typing:

`cam`

should find:

`Installation caméra de surveillance`

Search should generally be case-insensitive.

Where reasonable, tolerate differences in French accents.

---

# 39. Tables

Do not overload tables.

For invoice lists, initially prefer columns such as:

- Numéro
- Client
- Date
- Total
- Statut
- Action

Do not show 12–15 columns by default.

More information can appear after opening the document.

Important actions should remain obvious.

Prefer:

`Voir`

over relying only on a tiny three-dot menu.

---

# 40. Empty States

Never display a meaningless empty table.

Example Clients:

Vous n'avez encore aucun client.

`Ajouter votre premier client`

Example Invoices:

Aucune facture pour le moment.

`Créer ma première facture`

Example Services:

Aucun service enregistré.

`Ajouter un service`

---

# 41. Validation

Forms should use clear validation messages.

Bad:

`client_id required`

Good:

`Veuillez choisir un client.`

Bad:

`Invalid amount`

Good:

`Veuillez saisir un montant valide.`

Bad:

`SQLITE_CONSTRAINT_UNIQUE`

Good:

`Ce numéro de facture existe déjà.`

Never expose raw technical errors to the artisan.

Technical errors may be logged internally.

---

# 42. Prevent Mistakes

The application should prevent mistakes where possible.

Examples:

If no client is selected:

Do not allow invoice generation.

If no services exist on an invoice:

Do not allow invoice generation.

If quantity is zero or negative:

Show a clear validation message.

If payment is invalid:

Explain the problem immediately.

If there are unsaved changes:

Warn before leaving.

---

# 43. Dangerous Actions

Use clear confirmation dialogs for destructive actions.

Avoid generic:

Yes / No

Prefer descriptive buttons.

Example:

Voulez-vous vraiment annuler cette facture ?

FAC-2026-0023

Ahmed Bennani

2 000 MAD

Actions:

- Retour
- Annuler la facture

---

# 44. Smart Defaults

Reduce repetitive work.

Useful defaults include:

Currency:

MAD

Document language:

French

Invoice date:

Today

Default logo:

Configured default logo

Document style:

Configured default style

Invoice number:

Automatically generated

The software should remember reasonable preferences where useful.

---

# 45. Archive Instead of Destroy

Avoid hard deletion for important business data.

Invoices should generally be:

- Cancelled
- Archived

rather than physically deleted.

Services and clients referenced by historical documents should normally be archived/inactivated rather than deleted in a way that breaks document history.

---

# 46. Backup and Restore

The application will eventually support:

- Backup
- Restore

A backup should preserve:

- SQLite database
- Logos
- Required local assets
- Required application settings

Restore operations must be safe and validated.

Do not implement backup unless explicitly requested.

---

# 47. Offline Requirement

The application must continue working without internet access.

Normal functionality must not depend on:

- Network connection
- Remote server
- Cloud database
- Cloud authentication
- Remote API

All business data is stored locally unless cloud functionality is explicitly added later.

---

# 48. Code Quality Rules

When modifying the codebase:

- Inspect existing code first
- Follow existing conventions where reasonable
- Use strict TypeScript
- Avoid `any`
- Keep components focused
- Avoid giant React components
- Avoid duplicated logic
- Use reusable components where they genuinely help
- Avoid premature abstractions
- Validate user input
- Handle errors gracefully
- Keep SQLite access outside presentation components
- Keep financial calculations outside presentation components
- Do not refactor unrelated code
- Do not install unnecessary dependencies
- Preserve existing working functionality

---

# 49. AI Development Behaviour

This file describes the overall product and architecture.

It does NOT mean every feature should be implemented immediately.

The developer will provide the requested feature separately.

When receiving a development request:

1. Inspect the relevant existing code.
2. Understand how the feature fits into this project context.
3. Implement the requested feature completely.
4. Do not automatically implement unrelated future functionality.
5. Preserve existing working behaviour.
6. Run relevant TypeScript checks.
7. Run lint if configured.
8. Run relevant tests.
9. Run the appropriate build when useful.
10. Fix errors introduced by the implementation.

If a technical decision significantly affects future architecture, explain it briefly.

Do not make large architectural changes without a strong reason.

---

# 50. Scope Discipline

Do not implement features merely because they are described in this document.

This document defines future direction so architectural decisions remain compatible with the product.

Implement only what is explicitly requested in the current development prompt.

For example:

If asked to implement Services:

Implement Services properly.

Do NOT automatically also implement:

- Clients
- Invoices
- Quotations
- PDF
- Payments

unless a minimal shared dependency is genuinely necessary.

---

# 51. Simple Example of the Desired Product

A typical electrician opens the application.

He clicks:

`Nouvelle facture`

He searches:

`Ahmed`

and selects Ahmed Bennani.

He clicks:

`Ajouter un service`

and selects:

`Installation caméra`

The application automatically shows:

Quantity:

4

Price:

500 MAD

Total:

2 000 MAD

He enters:

Montant payé:

1 000 MAD

The application shows:

Reste à payer:

1 000 MAD

He clicks:

`Créer la facture`

The application generates:

FAC-2026-0023

and presents:

- Imprimer
- Ouvrir PDF
- Nouvelle facture

The artisan should be able to complete this workflow without needing help.