# Chamber of Commerce Web Application
## Project Planning Document

---

## Project Overview

A bilingual (English/French) web application for a local chamber of commerce, featuring a public-facing website and a content management system for chamber staff and member businesses.

**Project Type:** Pro Bono
**Primary Developer:** [Your Name]
**Client:** Vermont's North Country Chamber of Commerce
**Location:** Newport, VT (Northeast Kingdom)
**Current Website:** https://www.vtnorthcountry.org (WordPress)

### Key Features (PM Requirements)

**Content Management:**
- ✅ Announcements and event updates system
- ✅ Full access for chamber staff to update content
- ✅ Bilingual content with AI-powered translation

**Membership Management:**
- ✅ Accept membership applications with business information
- ✅ Upload and display member business logos
- ✅ Online payment processing for membership dues (Stripe)
- ✅ Multiple membership tiers with different benefits

**Business Directory:**
- ✅ Full member management capabilities
- ✅ Sort and filter by business location (city, address)
- ✅ Sort and filter by business type (category)
- ✅ Sort by business name (A-Z)
- ✅ Enhanced member advertising with links to business websites
- ✅ Support for member business hours, photos, and descriptions
- ✅ Map view of business locations

**Events Calendar:**
- ✅ Chamber events and announcements
- ✅ Accept event submissions from external organizations
- ✅ Signature event pages (ChiliFest, AquaFest) with seasonal info
- ✅ Application system for entering signature events
- ✅ Event filtering by type (chamber, community, external)

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | Server components, SSG/ISR |
| CMS | Payload CMS 3.0 | Embedded in Next.js app |
| Database | PostgreSQL | Hosted via Coolify container |
| Styling | Tailwind CSS | Mobile-first approach |
| Components | shadcn/ui | Accessible, customizable |
| Icons | Lucide React | Consistent icon set |
| Maps | OpenStreetMap + react-openlayers | Interactive business location maps |
| Hosting | VPS via Coolify | Self-managed |
| File Storage | Local disk | Persistent volume in Coolify |
| Email | Resend / Nodemailer | Transactional emails |
| Payments | Stripe | Membership dues and event payments |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Coolify (VPS)                   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js Application                 │  │
│  │  ┌─────────────────┬───────────────────────┐  │  │
│  │  │   Public Site   │   Payload Admin       │  │  │
│  │  │   /             │   /admin              │  │  │
│  │  │   /fr           │   /api                │  │  │
│  │  │   /events       │                       │  │  │
│  │  │   /businesses   │                       │  │  │
│  │  └─────────────────┴───────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │              PostgreSQL                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         Persistent Volume (Uploads)           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Migration from Existing Site

### Current Platform
- WordPress with WPBDP (Business Directory Plugin)
- Domain: vtnorthcountry.org

### Content to Migrate

**Business Listings (~45 total):**
| Category | Count |
|----------|-------|
| Shop | 19 |
| Live (Real Estate) | 8 |
| Services | 7 |
| Stay | 5 |
| Play | 3 |
| Eat | 1 |
| News | 1 |
| Individual | 1 |

**Static Pages:**
- History of the Northeast Kingdom
- President's Welcome Message
- Member Benefits
- Welcome Center information
- Board of Directors
- Join the Chamber
- Contact Us

**Events:**
- Hot Rod ChiliFest / Chili Challenge Cookoff (annual)
- AquaFest (annual summer event)
- Farmer's Market info (recurring)
- Event submission system

**Member Features:**
- Member login system
- Edit profile functionality
- Submit event functionality

### Migration Tasks
- [ ] Export business directory data (CSV or database export)
- [ ] Export user accounts (emails, names, associated businesses)
- [ ] Download all media/images from wp-content/uploads
- [ ] Copy static page content
- [ ] Document old URL structure for redirects
- [ ] Identify and skip obsolete content (practice pages, old events)

### URL Redirects Needed
Map old WordPress URLs to new structure:
```
/business-locator/           → /businesses
/business-locator/genre/eat/ → /businesses?category=eat
/events/                     → /events
/hot-rod-chilifest/          → /events/hot-rod-chilifest
/member-benefits/            → /join
/contact-us/                 → /contact
...
```

### Cleanup Opportunities
Current site has accumulated cruft to clean up:
- Duplicate "Events" pages (events/, events-2/, events-2025/)
- Test/practice pages visible in navigation
- Outdated event pages (AquaFest 2018)
- Redundant login/member pages

---

## Localization Strategy

**Supported Languages:**
- English (en) — Default, primary authoring language
- French (fr) — Auto-generated with AI, manually editable

**Implementation:**
- Payload field-level localization for content
- Next.js middleware for locale routing (`/` for English, `/fr` for French)
- Payload admin UI available in both languages
- **AI-powered auto-translation on content save**

**Localized Fields:**
- Page titles, content, meta descriptions
- Event titles, descriptions
- Business descriptions
- Announcements

**Non-Localized Fields:**
- Dates, times
- Addresses, phone numbers, emails
- Prices, URLs
- Media files

### Auto-Translation System

Chamber staff write content in English only. French translations are auto-generated via AI when content is saved, but remain editable if manual tweaks are needed.

**Infrastructure:**
- Self-hosted LLM (Qwen 3 8B or similar) with OpenAI-compatible API
- Endpoint: `http://[local-box]:11434/v1` (Ollama, vLLM, or similar)
- Called from Payload `beforeChange` hooks

**Translation Service:**
```ts
// lib/translate.ts
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.TRANSLATION_API_URL || 'http://localhost:11434/v1',
  apiKey: 'not-needed'
});

export async function translateToFrench(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'qwen3:8b',
    messages: [
      {
        role: 'system',
        content: `Translate to Canadian French. Keep proper nouns unchanged 
                  (business names, "Newport", "Northeast Kingdom", "Vermont"). 
                  Return only the translation, no explanation.`
      },
      { role: 'user', content: text }
    ],
    temperature: 0.3
  });
  return response.choices[0].message.content || text;
}
```

**Chunking Strategy for Rich Text:**

Large content blocks are split into smaller chunks for more reliable translation:

```ts
// lib/translate.ts
export async function translateRichText(content: string): Promise<string> {
  // Split on paragraph breaks, headings, or logical boundaries
  const chunks = content.split(/(\n\n|\n(?=#{1,6}\s))/);
  
  const translated = await Promise.all(
    chunks.map(async (chunk) => {
      if (chunk.trim() === '' || /^[\n\s]+$/.test(chunk)) {
        return chunk; // Preserve whitespace/breaks
      }
      return translateToFrench(chunk);
    })
  );
  
  return translated.join('');
}
```

**Payload Hook Integration:**
```ts
// collections/Events.ts
import { translateToFrench, translateRichText } from '@/lib/translate';

export const Events: CollectionConfig = {
  slug: 'events',
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Only translate if English exists and French is empty
        if (data.title?.en && !data.title?.fr) {
          data.title.fr = await translateToFrench(data.title.en);
        }
        if (data.description?.en && !data.description?.fr) {
          data.description.fr = await translateRichText(data.description.en);
        }
        return data;
      }
    ]
  },
  // ...
}
```

**Behavior:**
- New content: Auto-translates English → French on first save
- Edits to English: Does NOT overwrite existing French (preserves manual edits)
- To re-translate: Clear the French field, save again
- Chamber staff can always manually edit French if translation needs tweaking

**Environment Variables:**
```
TRANSLATION_API_URL=http://192.168.x.x:11434/v1
TRANSLATION_MODEL=qwen3:8b
```

---

## Collections & Data Model

### Users
Authentication and access control for admin panel.

| Field | Type | Notes |
|-------|------|-------|
| email | email | Required, unique |
| password | password | |
| name | text | |
| role | select | admin, chamber_staff, business_member |
| business | relationship | Link to business (for members) |

### Businesses
Member directory listings with enhanced advertising capabilities.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | No | Business name |
| slug | text | No | URL-safe identifier |
| description | richText | Yes | Full business description |
| logo | upload | No | Business logo for directory |
| coverImage | upload | No | Hero image for business page |
| category | relationship | No | Link to categories (multiple) |
| address | text | No | Street address |
| city | text | No | City/Town |
| state | text | No | State (default: VT) |
| zipCode | text | No | ZIP code |
| coordinates | group | No | lat/lng for map display |
| phone | text | No | Primary phone |
| email | email | No | Public contact email |
| website | text | No | Business website URL |
| socialLinks | array | No | Facebook, Instagram, etc. |
| membershipTier | select | No | basic, premium, featured |
| memberSince | date | No | Membership start date |
| membershipExpires | date | No | Renewal tracking |
| featured | checkbox | No | Show on homepage |
| advertisingSlots | array | No | Gallery images, videos, offers |
| hoursOfOperation | richText | Yes | Business hours |
| status | select | No | active, inactive, pending |

### Events
Community and business events (chamber + external organizations).

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| title | text | Yes | Event title |
| slug | text | No | URL-safe identifier |
| description | richText | Yes | Full event description |
| image | upload | No | Event image/poster |
| date | date | No | Event date |
| endDate | date | No | For multi-day events |
| startTime | text | No | Start time |
| endTime | text | No | End time |
| location | text | No | Venue/location name |
| address | text | No | Full address |
| business | relationship | No | Hosting business (optional) |
| organizer | text | No | For external organizations |
| category | select | No | chamber, community, networking, workshop, festival |
| featured | checkbox | No | Highlight on homepage |
| recurring | checkbox | No | Is this a recurring event? |
| externalUrl | text | No | Link to external registration/info |
| status | select | No | draft, published, cancelled |
| submittedBy | relationship | No | User who submitted (tracking) |

### Pages
Static content pages.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| title | text | Yes | |
| slug | text | No | |
| content | richText (blocks) | Yes | Page builder with blocks |
| meta | group | Yes | SEO title, description, image |
| status | select | No | draft, published |

### Announcements
News and updates from the chamber.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| title | text | Yes | |
| slug | text | No | |
| content | richText | Yes | |
| image | upload | No | |
| publishDate | date | No | |
| featured | checkbox | No | |
| status | select | No | draft, published |

### Signature Events
Dedicated pages for recurring annual events with applications.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | Yes | e.g., "Hot Rod ChiliFest" |
| slug | text | No | URL identifier |
| description | richText | Yes | Event overview |
| logo | upload | No | Event-specific branding |
| gallery | array | No | Photo gallery |
| schedule | richText | Yes | Day-of schedule |
| vendors | richText | Yes | Vendor list |
| rules | richText | Yes | Rules & regulations |
| applicationForm | richText | Yes | Instructions & requirements |
| applicationOpen | checkbox | No | Accept applications? |
| applicationDeadline | date | No | Deadline for entries |
| year | number | No | Current year's info |
| contactEmail | email | No | Event coordinator email |
| status | select | No | upcoming, active, archived |

**Known Signature Events:**
- Hot Rod ChiliFest / Chili Challenge Cookoff
- AquaFest

### Event Applications
Applications for signature events (ChiliFest, etc.)

| Field | Type | Notes |
|-------|------|-------|
| event | relationship | Link to Signature Event |
| applicantName | text | Individual/Business name |
| applicantEmail | email | Contact email |
| applicantPhone | text | Contact phone |
| business | relationship | Link to member business (optional) |
| category | text | Entry category (e.g., "Hot Rod", "Chili") |
| details | richText | Application details/questions |
| attachments | upload | Supporting files |
| status | select | pending, approved, rejected |
| submittedDate | date | Auto-populated |
| notes | richText | Internal chamber notes |

### Memberships
Membership tiers and payment tracking.

| Field | Type | Notes |
|-------|------|-------|
| business | relationship | Link to business |
| tier | select | basic, premium, featured |
| amount | number | Annual dues amount |
| startDate | date | Membership period start |
| endDate | date | Membership expiration |
| autoRenew | checkbox | Recurring payment enabled |
| stripeCustomerId | text | Stripe customer reference |
| stripeSubscriptionId | text | Stripe subscription reference |
| paymentStatus | select | pending, paid, overdue, cancelled |
| paymentMethod | select | stripe, check, cash, comp |
| invoiceUrl | text | Link to Stripe invoice |
| notes | richText | Internal notes |

### Membership Tiers (Global Config)
Define available membership levels.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | Yes | Tier name (e.g., "Premium") |
| slug | text | No | tier-identifier |
| description | richText | Yes | Benefits description |
| annualPrice | number | No | Price in dollars |
| features | array | Yes | List of features included |
| advertisingSlots | number | No | Number of ad slots |
| featured | checkbox | No | Featured directory placement |
| active | checkbox | No | Currently accepting |

### Categories
Business categories for directory.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | Yes | Category name |
| slug | text | No | URL identifier |
| description | textarea | Yes | Category description |
| icon | text | No | Lucide icon name |

**Existing Categories to Migrate:**
- Eat (Restaurants, Pizza)
- Stay (Lodging)
- Shop (Retail)
- Play (Recreation)
- Live (Real Estate)
- Services (Financial, Vision, etc.)
- News/Media
- Individual Members

### Media
Shared media library.

| Field | Type | Notes |
|-------|------|-------|
| alt | text | Required, for accessibility |
| caption | text | Optional |

### Globals

**Header**
- Logo
- Navigation links (localized labels)
- CTA button

**Footer**
- Contact info
- Social links
- Navigation links
- Copyright text (localized)

**Site Settings**
- Site name
- Default meta description
- Social media URLs
- Google Analytics ID (if used)

---

## Access Control Matrix

| Collection | Admin | Chamber Staff | Business Member | Public |
|------------|-------|---------------|-----------------|--------|
| Users | CRUD | Read own | Read own | — |
| Businesses | CRUD | CRUD | Update own | Read |
| Events | CRUD | CRUD | CRUD own | Read published |
| Event Applications | CRUD | Read all | Read own | Create |
| Memberships | CRUD | Read all | Read own | — |
| Membership Tiers | CRUD | Read | Read | Read |
| Signature Events | CRUD | CRUD | Read | Read published |
| Pages | CRUD | CRUD | — | Read published |
| Announcements | CRUD | CRUD | — | Read published |
| Categories | CRUD | Read | Read | Read |
| Media | CRUD | CRUD | Create, Read | Read |

**Approval Workflow:**
- Business-submitted events: Auto-publish for members, staff can moderate
- Business profile updates: Direct edit (member businesses can update own)
- Event applications: Public can submit, staff reviews/approves
- Membership applications: Require staff approval before activation

---

## Page Structure

### Public Pages

```
/                           Homepage
/about                      About the chamber
/join                       Membership information & tiers
/join/apply                 Membership application form
/join/payment               Membership payment (Stripe)
/contact                    Contact form
/businesses                 Member directory (sortable by name, location, category)
/businesses?category=eat    Filter by category
/businesses?location=newport Filter by city/location
/businesses/[slug]          Individual business page with advertising
/events                     Events calendar/list (all events)
/events?type=chamber        Filter by event type
/events/submit              Submit external event
/events/[slug]              Individual event page
/signature-events           List of annual signature events
/signature-events/[slug]    Signature event detail page
/signature-events/[slug]/apply Application form (ChiliFest, etc.)
/news                       Announcements list
/news/[slug]                Individual announcement
/[slug]                     Dynamic pages (from Pages collection)

/fr/...                     French versions of all above
```

### Admin Routes

```
/admin                  Payload admin dashboard
/admin/collections/...  Collection management
/admin/globals/...      Global settings
```

---

## Business Directory Features

### Sorting Options
- **By Name:** Alphabetical A-Z or Z-A
- **By Location:** Group by city/town, then alphabetically
- **By Category:** Group by business type
- **By Membership Date:** Newest members first
- **Featured First:** Premium/featured members at top

### Filtering Options
- **Category Filter:** Single or multiple categories
- **Location Filter:** By city, town, or ZIP code
- **Membership Tier:** Filter by basic, premium, featured
- **Search:** Free text search across name, description, keywords

### Display Modes
- **Grid View:** Cards with logo, name, category, location
- **List View:** Compact rows with key info
- **Map View:** Interactive OpenStreetMap with pins for each business
  - Built with react-openlayers
  - Click pin to see business card popup
  - Filter and sort apply to map view
  - Clustering for nearby businesses
  - Custom marker styling for membership tiers
  - Zoom to Newport, VT region by default

### Business Detail Page
- Logo and cover image
- Full business description (rich text, localized)
- Contact info (address, phone, email, website)
- Hours of operation
- Social media links
- Advertising slots (gallery images, promotional content)
- Map with location pin
- "Get Directions" link
- Related businesses (same category)
- Member since badge
- Membership tier badge (if premium/featured)

---

## Rich Text Blocks

Custom blocks available in the page builder:

| Block | Purpose | Fields |
|-------|---------|--------|
| Content | Basic rich text | content (richText) |
| Hero | Page headers | heading, subheading, image, cta |
| CallToAction | Conversion sections | heading, text, buttonText, buttonLink, style |
| EventsGrid | Display upcoming events | count, category filter |
| BusinessGrid | Featured businesses | count, category filter |
| ImageText | Image with text | image, content, imagePosition (left/right) |
| Stats | Key numbers | items[] (number, label) |
| Team | Board/staff display | members[] (relationship to team collection) |
| FAQ | Accordion Q&A | items[] (question, answer) |
| Contact | Contact form | heading, description |

---

## Design System

### Colors (To be confirmed with chamber)

Current site uses green/earth tones reflecting Vermont's natural landscape.

```
Primary:     [TBD - likely green based on current branding]
Secondary:   [TBD - accent color]
Background:  #FFFFFF
Surface:     #F9FAFB (gray-50)
Text:        #111827 (gray-900)
Text Muted:  #6B7280 (gray-500)
Border:      #E5E7EB (gray-200)
Success:     #10B981 (green-500)
Warning:     #F59E0B (amber-500)
Error:       #EF4444 (red-500)
```

Design should evoke: Northeast Kingdom, mountains, lakes, rural Vermont character.

### Typography

```
Font Family:  Inter (or system fonts for performance)
Headings:     
  h1: 2.25rem (36px), bold
  h2: 1.875rem (30px), semibold
  h3: 1.5rem (24px), semibold
  h4: 1.25rem (20px), medium
Body:         1rem (16px), regular
Small:        0.875rem (14px)
```

### Spacing Scale

Using Tailwind defaults (4px base unit).

### Breakpoints

```
sm:   640px   (large phones)
md:   768px   (tablets)
lg:   1024px  (laptops)
xl:   1280px  (desktops)
```

Mobile-first approach: design for mobile, enhance for larger screens.

---

## Third-Party Services

| Service | Purpose | Cost |
|---------|---------|------|
| Stripe | Payment processing | 2.9% + $0.30 per transaction |
| OpenStreetMap | Map tiles and geocoding | Free (open source) |
| Resend | Transactional email | Free tier (100/day) |
| Plausible/Umami | Analytics | Self-hosted (free) or ~$9/mo |
| Backblaze B2 | Backup storage | ~$0.005/GB/mo |
| Translation API | EN→FR translation | Self-hosted (Qwen 3 8B via Ollama) |

---

## Infrastructure

### Coolify Setup

1. **PostgreSQL Service**
   - Single container
   - Persistent volume for data
   - Automated backups (configure)

2. **Next.js Application**
   - Build from GitHub repo
   - Environment variables configured
   - Persistent volume for `/uploads`

3. **Staging Environment** (optional but recommended)
   - Separate deployment from same repo
   - Different branch or manual deploys

### Environment Variables

```
DATABASE_URL=postgresql://...
PAYLOAD_SECRET=...
NEXT_PUBLIC_SITE_URL=https://...

# Email
RESEND_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Translation (self-hosted LLM)
TRANSLATION_API_URL=http://192.168.x.x:11434/v1
TRANSLATION_MODEL=qwen3:8b

# Optional
NEXT_PUBLIC_GA_ID=...
```

### Backup Strategy

- **Database:** Daily pg_dump, retain 7 days, upload to B2
- **Uploads:** Weekly sync to B2
- **Code:** Git repository (GitHub/GitLab)

---

## SEO Checklist

- [ ] Meta titles and descriptions on all pages (localized)
- [ ] Open Graph images for social sharing
- [ ] Sitemap.xml generation
- [ ] Robots.txt
- [ ] Canonical URLs
- [ ] Structured data (LocalBusiness schema for directory)
- [ ] Image alt text (enforced in CMS)
- [ ] Semantic HTML throughout
- [ ] Fast page loads (target < 3s)

---

## Accessibility Checklist

- [ ] Semantic HTML elements
- [ ] Keyboard navigation works throughout
- [ ] Focus states visible
- [ ] Color contrast minimum 4.5:1
- [ ] Alt text on all images
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Skip to main content link
- [ ] Language attribute on HTML element (dynamic per locale)

---

## Development Phases

### Phase 0: Discovery & Migration Prep (Week 1)
- [ ] Export existing business listings from WordPress (WPBDP plugin)
- [ ] Export existing member/user accounts
- [ ] Inventory all pages and content to migrate
- [ ] Gather brand assets (logo, colors)
- [ ] Document redirect mapping (old URLs → new URLs)
- [ ] Set up development environment

### Phase 1: Foundation (Week 2-3)
- [ ] Initialize project with Payload website template
- [ ] Configure PostgreSQL connection
- [ ] Set up Tailwind + shadcn/ui
- [ ] Configure localization (en/fr)
- [ ] Create base collections (Users, Media)
- [ ] Implement access control roles
- [ ] Deploy staging environment to Coolify

### Phase 2: Core Collections (Week 3-4)
- [ ] Businesses collection + access control
- [ ] Events collection
- [ ] Event Applications collection
- [ ] Signature Events collection
- [ ] Categories collection
- [ ] Memberships collection
- [ ] Membership Tiers global
- [ ] Pages collection with block builder
- [ ] Announcements collection
- [ ] Header/Footer globals

### Phase 3: Public Frontend (Week 5-6)
- [ ] Layout components (header, footer, navigation)
- [ ] Homepage with dynamic content
- [ ] Business directory with sort/filter (name, location, category)
- [ ] Business detail pages with enhanced advertising
- [ ] Business location map integration
- [ ] Events listing + detail pages (with filters)
- [ ] Event submission form (for external organizations)
- [ ] Signature events pages (ChiliFest, AquaFest)
- [ ] Event application forms (ChiliFest entries, etc.)
- [ ] News/announcements pages
- [ ] Static pages (about, join, contact)
- [ ] Contact form

### Phase 4: Payment Integration (Week 7)
- [ ] Stripe account setup and configuration
- [ ] Membership application form with Stripe integration
- [ ] Payment processing for membership dues
- [ ] Webhook handlers for payment events
- [ ] Member dashboard for payment history
- [ ] Renewal reminders and notifications

### Phase 5: Localization & Polish (Week 8)
- [ ] French translations for all content
- [ ] Locale switcher component
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Mobile testing and refinements

### Phase 6: Launch Prep (Week 9)
- [ ] Content migration (if applicable)
- [ ] Chamber staff training (2 sessions: content + payments)
- [ ] Documentation
- [ ] Production deployment
- [ ] DNS cutover
- [ ] Post-launch monitoring

---

## Handoff Documentation (To Create)

1. **Admin User Guide**
   - Logging in
   - Creating/editing content
   - Managing events
   - Managing business listings
   - Uploading media
   - Switching languages

2. **Technical Documentation**
   - Accessing Coolify
   - Redeploying the application
   - Database access and backups
   - Restoring from backup
   - Environment variables reference

3. **Maintenance Guide**
   - Updating dependencies (when/how)
   - Monitoring for issues
   - Common troubleshooting

---

## Ongoing Maintenance Agreement

**In Scope:**
- [ ] Critical security updates
- [ ] Bug fixes for existing functionality
- [ ] Brief support questions via email

**Out of Scope:**
- [ ] New feature development
- [ ] Design changes
- [ ] Content updates (chamber responsibility)
- [ ] Third-party service issues

**Response Time:** Best effort, not guaranteed (pro bono)

**Duration:** [X months/years] after launch, then reassess

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payload breaking changes | Medium | Pin versions, update carefully |
| VPS downtime | Medium | Coolify monitoring, backup restore plan |
| Chamber can't manage content | High | Training, documentation, simple UX |
| Scope creep | High | Document scope, change request process |
| Translation API unavailable | Low | Graceful fallback, save without French |
| Translation quality issues | Low | Manual override available, review key pages |
| Developer unavailable | Medium | Documentation, simple architecture |
| Data loss during migration | High | Full WordPress backup before starting |
| Member confusion at launch | Medium | Advance notice, clear login instructions |
| SEO ranking drop | Medium | Proper redirects, submit new sitemap |
| Missing content in migration | Low | Content audit checklist, client review |

---

---

# Chamber Discussion Checklist

Questions to cover before development begins.

## Branding & Design

- [ ] Can you provide the logo in SVG or high-res PNG format?
- [ ] What are your official brand colors? (Current site appears to use green/earth tones)
- [ ] Do you have brand guidelines or a style guide?
- [ ] Any fonts you currently use in print materials?
- [ ] Are there websites you like the look of? (For inspiration)
- [ ] Should the new site feel similar to current, or is a fresh look welcome?
- [ ] Any photos of the Welcome Center, Newport, or NEK for hero images?

## Content & Structure

- [ ] Review the current pages list—which are still needed vs. can be retired?
- [ ] Is the "History of the Northeast Kingdom" content still accurate?
- [ ] Who will write/translate the initial French content?
- [ ] Are all 45 businesses active members in good standing?
- [ ] Are the current categories (Eat, Stay, Shop, Play, Live, Services) still right?
- [ ] Any new categories needed?
- [ ] Is the Farmer's Market info something you manage, or external?
- [ ] Do you want a dedicated page per signature event (ChiliFest, AquaFest)?
- [ ] Board of Directors—is current info up to date?

## User Roles & Permissions

- [ ] How many chamber staff will need admin access?
- [ ] Should member businesses have their own login?
- [ ] What can member businesses edit? (Their profile only? Events?)
- [ ] Do business-submitted events need chamber approval before publishing?
- [ ] Should businesses be able to self-register, or invite-only?

## Bilingual Requirements

- [ ] Is auto-translated French acceptable, or do you need human review?
- [ ] Any specific French terminology preferences (Canadian French vs. European)?
- [ ] Are there any pages that MUST have professional translation?
- [ ] Should the site default to English or detect browser language?
- [ ] Are there any bilingual legal requirements to consider?
- [ ] Any business names or local terms that should NOT be translated?

## Technical & Hosting

- [ ] Who currently manages the vtnorthcountry.org domain and DNS?
- [ ] Do you have access to WordPress admin to export data?
- [ ] Can you provide a full backup of the current site?
- [ ] Do you have existing email accounts (for transactional email)?
- [ ] Who currently hosts the WordPress site?
- [ ] Do you want to keep the same domain?
- [ ] Any analytics data you want to preserve?

## Migration Specific

- [ ] Are all ~45 business listings current and active members?
- [ ] Any businesses that should NOT be migrated?
- [ ] Do members currently use the login/edit profile features?
- [ ] Should we notify members about the transition and new login?
- [ ] Any content on the current site that's outdated and can be skipped?
- [ ] Do you have original/higher-res versions of images?
- [ ] Is the current member data (emails, passwords) something we can export?

## Legal & Compliance

- [ ] Do you have an existing privacy policy?
- [ ] Any specific accessibility requirements?
- [ ] Are there regulations around member data storage?
- [ ] Who is responsible for content (legal liability)?

## Timeline & Launch

- [ ] Is there a target launch date or deadline?
- [ ] Any upcoming events this needs to be ready for?
- [ ] Who is the primary point of contact for decisions?
- [ ] How often can we meet for check-ins? (Weekly recommended)
- [ ] Who will be trained on the CMS? (Names, roles)

## Ongoing Operations

- [ ] Who will manage content after launch?
- [ ] Do you need training? (Recommend 2-3 hours: content management + payment processing)
- [ ] What happens if something breaks? (Support expectations)
- [ ] Who handles member support questions about their logins?
- [ ] Any plans for future features? (Mobile app, e-commerce, etc.)

## Payments & Membership

- [ ] Do you currently accept credit card payments? Do you have a Stripe account?
- [ ] What are your current membership tiers and pricing?
- [ ] How often are dues collected? (Annual, monthly, quarterly?)
- [ ] Do you offer any complimentary memberships?
- [ ] Should renewals be automatic (recurring) or manual?
- [ ] Who handles membership payment questions and issues?
- [ ] What information do you need on the membership application?
- [ ] Do members need approval before being charged?
- [ ] What happens when a membership expires? Grace period?
- [ ] Do you offer proration for mid-year joins?

## Event Applications

- [ ] Which events require applications? (ChiliFest confirmed, others?)
- [ ] What information do you collect on event applications?
- [ ] Is there an application fee? Should it be collected online?
- [ ] Who reviews and approves applications?
- [ ] What's the typical timeline for application review?
- [ ] Do applicants need to be chamber members?
- [ ] Should applicants receive automated confirmation emails?

## Nice-to-Haves (Future Phases)

**Now In Scope (Phase 1):**
- ✅ Online membership payment/dues via Stripe
- ✅ Interactive map of member businesses
- ✅ Event application system (ChiliFest, AquaFest)

**Future Considerations:**
- [ ] Job board for member businesses
- [ ] Deals/coupons/specials from member businesses
- [ ] Newsletter integration (Mailchimp, Constant Contact)
- [ ] Event RSVPs or ticketing for ChiliFest/AquaFest
- [ ] Member-only content areas (exclusive resources, discounts)
- [ ] Integration with Vermont tourism sites
- [ ] Photo gallery/contest functionality
- [ ] Mobile app for members
- [ ] QR code check-in for events
- [ ] Business analytics dashboard (profile views, clicks)

---

## Sign-Off

Once discussed, both parties should confirm:

- [ ] Scope of work is understood and agreed
- [ ] Timeline expectations are realistic
- [ ] Roles and responsibilities are clear
- [ ] Maintenance/support boundaries are defined
- [ ] Point of contact identified for decisions

---

*Document Version: 1.1*
*Last Updated: 2025-12-23*

**Changelog:**
- v1.1 (2025-12-23): Added PM requirements - payment processing, enhanced business directory with sorting/filtering/maps (OpenStreetMap + react-openlayers), event application system, membership tiers
- v1.0: Initial planning document
