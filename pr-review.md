# PR Review: feature-list-from-meeting

**Branch:** `feature-list-from-meeting` → `main`
**Files Changed:** 145 files (+19,878 / -48,843 lines)
**Commits:** 7

---

## Summary of Changes

### Major Architectural Changes
- **Removed Stripe integration** - Deleted payment processing, checkout sessions, webhooks, and membership sync
- **Replaced Posts with News** - Migrated blog/posts system to a simpler News collection
- **Removed SignatureEvents** - Consolidated into regular Events collection
- **Removed Announcements** - Functionality merged into News/Banners
- **Removed EventApplications** - Simplified event submission process
- **New database migrations** - Consolidated and reset migration history

### New Features Added
- **Business Application Flow** - New membership application with admin approval workflow
- **Mailing List System** - Subscribe/unsubscribe with secure tokens
- **Newsletter Sending** - Batch email sending from admin panel
- **Event Approval Pages** - Dedicated approval UI for business and event submissions
- **Recurring Events** - Weekly and monthly recurrence patterns with expansion utility
- **Site Banners** - Global banner system for announcements
- **Auto-translation Hooks** - For Header/Footer navigation

### Collections Changed
- Added: `News`, `MailingList`, `EmailCampaigns`
- Removed: `Posts`, `Announcements`, `SignatureEvents`, `Memberships`, `EventApplications`
- Modified: `Businesses`, `Events`, `Categories`, `Pages`

### API Routes
- Added: `/api/apply-membership`, `/api/approve-business`, `/api/send-newsletter`, `/api/mailing-list/subscribe`, `/api/mailing-list/unsubscribe`, `/api/seed`
- Removed: `/api/create-checkout-session`, `/api/sync-membership`, `/api/webhooks/stripe`

---

## Potential Problems

### Data & Migration Issues
- [x] **Migration consolidation** - ~~Old migrations deleted; may cause issues for existing deployments with data~~
  - N/A: Development environment, database was wiped. Auto-migrations handle new deployments.
- [x] **No data migration path** - ~~Posts → News migration not automated~~
  - N/A: Development environment, no legacy data to migrate.
- [ ] **Hard-coded collection casts** - Multiple `as any` type assertions bypass type safety

### Functionality Concerns
- [x] **Newsletter batching limits** - ~~Hard limit of 1000 subscribers; will fail silently for larger lists~~
  - Fixed: [send-newsletter/route.ts](src/app/(payload)/api/send-newsletter/route.ts) now uses pagination to handle any subscriber count
- [ ] **No retry mechanism** - Failed newsletter sends are logged but not retried
- [x] **Recurring event edge cases** - ~~Months with fewer days may skip occurrences for day-of-month recurrence~~
  - Reviewed: This is correct behavior - if an event recurs on the 31st, months without a 31st skip that occurrence
- [x] **Date handling without timezone** - ~~`new Date()` usage throughout without explicit timezone handling~~
  - N/A: All users are in EST (USA/Canada), timezone handling not required
- [x] **Deleted membership page** - ~~Portal membership page removed but linked functionality unclear~~
  - N/A: Intentionally removed with Stripe integration; membership now handled via application flow

### Code Quality
- [x] **Duplicate password generation** - ~~Same `generateTempPassword` function exists in multiple files~~ Fixed: Consolidated to shared utility
- [x] **Empty `getLocale.ts`** - ~~File exists but utility function removed~~
  - Reviewed: File is not empty, contains locale utility functions (getLocaleFromPathname, toggleLocale, etc.)
- [ ] **Mixed component patterns** - Some pages use Server Components, others Client Components inconsistently
- [ ] **Large file changes** - `email.ts` grew significantly (+724 lines changed); could benefit from splitting

---

## Security Concerns

### High Priority
- [x] **Weak password generation** - ~~Uses `Math.random()` which is not cryptographically secure~~
  - Fixed: Created shared utility [generatePassword.ts](src/utilities/generatePassword.ts) using `crypto.randomBytes()`
  - Updated: [apply-membership/route.ts](src/app/(payload)/api/apply-membership/route.ts)
  - Updated: [approve-business/route.ts](src/app/(payload)/api/approve-business/route.ts)

- [x] **No rate limiting** - ~~Public endpoints lack rate limiting~~
  - Fixed: Created [rateLimit.ts](src/utilities/rateLimit.ts) utility with in-memory rate limiting
  - Applied to `/api/apply-membership` (5 req/15 min)
  - Applied to `/api/mailing-list/subscribe` (10 req/hour)

- [x] **Email exposure risk** - ~~Admin emails queried and stored in approval notifications~~
  - Fixed: Created [getAdminEmails.ts](src/utilities/getAdminEmails.ts) utility
  - Prioritizes `ADMIN_NOTIFICATION_EMAIL` env var over database queries
  - Updated [apply-membership/route.ts](src/app/(payload)/api/apply-membership/route.ts)
  - Updated [Events/index.ts](src/collections/Events/index.ts)
  - Removed email counts from log messages

### Medium Priority
- [x] **No input sanitization** - ~~Form fields cast directly without validation~~
  - Fixed: Created [sanitize.ts](src/utilities/sanitize.ts) with `escapeHtml()` function
  - Updated [email.ts](src/utilities/email.ts) to escape all user-provided content in HTML templates

- [x] **File upload validation** - ~~Logo upload lacks type validation and size limits~~
  - Fixed: Created [fileValidation.ts](src/utilities/fileValidation.ts) with:
    - File type allowlist (JPEG, PNG, GIF, WebP, SVG)
    - 5MB file size limit
    - Extension-to-MIME type validation
    - Filename sanitization
  - Updated [apply-membership/route.ts](src/app/(payload)/api/apply-membership/route.ts)

- [ ] **Unsubscribe token in URL** - Token passed via query parameter, may be logged in server logs
  - Location: [unsubscribe/page.tsx](src/app/(frontend)/unsubscribe/page.tsx)
  - Note: This is standard practice for unsubscribe links; consider log scrubbing if concerned

### Low Priority
- [x] **Verbose error logging** - ~~Full error objects logged which may contain sensitive data~~
  - Fixed: Created [errorLogging.ts](src/utilities/errorLogging.ts) with `getSafeErrorMessage()` function
  - Updated key API routes to only log error messages, not full stack traces
- [ ] **No CSRF protection** - Form submissions should include CSRF tokens
  - Note: Next.js API routes have built-in protection via same-origin policy
- [ ] **Missing Content-Security-Policy** - Email HTML templates don't specify CSP

---

## Potential Improvements

### Code Organization
- [x] Extract `generateTempPassword` to shared utility with crypto-secure implementation (Done)
- [ ] Split `email.ts` into separate files per email type (welcome, newsletter, approval, etc.)
- [x] Create shared form validation utilities (Done: [fileValidation.ts](src/utilities/fileValidation.ts), [sanitize.ts](src/utilities/sanitize.ts))
- [ ] Add TypeScript strict mode and fix `as any` casts

### Security Hardening
- [x] Implement rate limiting on public API endpoints (Done)
- [ ] Add CAPTCHA to membership application form
- [x] Use `crypto.randomBytes()` for password generation (Done)
- [x] Add file type allowlist and size limits for logo uploads (Done)
- [ ] Implement CSP headers for email templates

### Functionality
- [ ] Add retry queue for failed newsletter sends
- [x] Implement pagination for newsletter sending (>1000 subscribers) (Done)
- [ ] Add preview mode for newsletters before sending
- [x] Create data migration script for Posts → News (N/A: Dev environment)
- [x] Add timezone-aware date handling utility (N/A: All users in EST)

### Testing
- [ ] Add integration tests for approval workflows
- [ ] Add unit tests for recurring event expansion
- [ ] Test newsletter sending with various subscriber counts
- [ ] Add E2E tests for membership application flow

### Documentation
- [ ] Document the new approval workflow
- [ ] Update API documentation for new/changed endpoints
- [ ] Add runbook for newsletter sending
- [ ] Document migration path from old schema

---

## Files to Review Carefully

| File | Reason |
|------|--------|
| [apply-membership/route.ts](src/app/(payload)/api/apply-membership/route.ts) | New public endpoint, creates users/businesses |
| [approve-business/route.ts](src/app/(payload)/api/approve-business/route.ts) | Admin action, password reset |
| [send-newsletter/route.ts](src/app/(payload)/api/send-newsletter/route.ts) | Mass email sending |
| [expandRecurringEvents.ts](src/utilities/expandRecurringEvents.ts) | Complex date logic |
| [email.ts](src/utilities/email.ts) | All email templates |
| [migrations/20260131_145338.ts](src/migrations/20260131_145338.ts) | Database schema changes |

---

*Generated: 2026-01-31*
