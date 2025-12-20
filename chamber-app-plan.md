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
| Hosting | VPS via Coolify | Self-managed |
| File Storage | Local disk | Persistent volume in Coolify |
| Email | Resend / Nodemailer | Transactional emails |

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
Member directory listings.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | No | Business name |
| slug | text | No | URL-safe identifier |
| description | richText | Yes | |
| logo | upload | No | |
| coverImage | upload | No | |
| category | relationship | No | Link to categories |
| address | text | No | |
| phone | text | No | |
| email | email | No | |
| website | text | No | |
| socialLinks | array | No | Facebook, Instagram, etc. |
| memberSince | date | No | |
| featured | checkbox | No | Show on homepage |
| status | select | No | active, inactive |

### Events
Community and business events.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| title | text | Yes | |
| slug | text | No | |
| description | richText | Yes | |
| image | upload | No | |
| date | date | No | |
| startTime | text | No | |
| endTime | text | No | |
| location | text | No | |
| business | relationship | No | Hosting business (optional) |
| category | select | No | community, networking, workshop, etc. |
| featured | checkbox | No | |
| status | select | No | draft, published, cancelled |

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
Dedicated pages for recurring annual events.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | Yes | e.g., "Hot Rod ChiliFest" |
| slug | text | No | |
| description | richText | Yes | |
| logo | upload | No | Event-specific branding |
| gallery | array | No | Photo gallery |
| schedule | richText | Yes | Day-of schedule |
| vendors | richText | Yes | Vendor list |
| rules | richText | Yes | Rules & regulations |
| year | number | No | Current year's info |
| status | select | No | upcoming, active, archived |

**Known Signature Events:**
- Hot Rod ChiliFest / Chili Challenge Cookoff
- AquaFest

### Categories
Business categories for directory.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| name | text | Yes | |
| slug | text | No | |
| description | textarea | Yes | |
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
| Pages | CRUD | CRUD | — | Read published |
| Announcements | CRUD | CRUD | — | Read published |
| Categories | CRUD | Read | Read | Read |
| Media | CRUD | CRUD | Create, Read | Read |

**Approval Workflow (TBD with chamber):**
- Do business-submitted events require approval before publishing?
- Can businesses edit their profiles directly or submit change requests?

---

## Page Structure

### Public Pages

```
/                       Homepage
/about                  About the chamber
/join                   Membership information
/contact                Contact form
/businesses             Member directory
/businesses/[slug]      Individual business page
/events                 Events calendar/list
/events/[slug]          Individual event page
/news                   Announcements list
/news/[slug]            Individual announcement
/[slug]                 Dynamic pages (from Pages collection)

/fr/...                 French versions of all above
```

### Admin Routes

```
/admin                  Payload admin dashboard
/admin/collections/...  Collection management
/admin/globals/...      Global settings
```

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
- [ ] Categories collection
- [ ] Pages collection with block builder
- [ ] Announcements collection
- [ ] Header/Footer globals

### Phase 3: Public Frontend (Week 5-6)
- [ ] Layout components (header, footer, navigation)
- [ ] Homepage with dynamic content
- [ ] Business directory + detail pages
- [ ] Events listing + detail pages
- [ ] News/announcements pages
- [ ] Static pages (about, join, contact)
- [ ] Contact form

### Phase 4: Localization & Polish (Week 7)
- [ ] French translations for all content
- [ ] Locale switcher component
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Mobile testing and refinements

### Phase 5: Launch Prep (Week 8)
- [ ] Content migration (if applicable)
- [ ] Chamber staff training
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
- [ ] Do you need training? (Recommend 1-2 hours)
- [ ] What happens if something breaks? (Support expectations)
- [ ] Who handles member support questions about their logins?
- [ ] Any plans for future features? (Mobile app, e-commerce, etc.)

## Nice-to-Haves (Future Phases)

- [ ] Online membership payment/dues via Stripe?
- [ ] Job board for member businesses?
- [ ] Deals/coupons/specials from member businesses?
- [ ] Newsletter integration (Mailchimp, Constant Contact)?
- [ ] Event RSVPs or ticketing for ChiliFest/AquaFest?
- [ ] Member-only content areas (beyond profile editing)?
- [ ] Interactive map of member businesses?
- [ ] Integration with Vermont tourism sites?
- [ ] Photo gallery/contest functionality?

---

## Sign-Off

Once discussed, both parties should confirm:

- [ ] Scope of work is understood and agreed
- [ ] Timeline expectations are realistic
- [ ] Roles and responsibilities are clear
- [ ] Maintenance/support boundaries are defined
- [ ] Point of contact identified for decisions

---

*Document Version: 1.0*  
*Last Updated: [Date]*
