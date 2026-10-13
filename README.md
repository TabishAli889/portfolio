# Portfolio with a built-in content studio

A personal portfolio site where **every word on the public page is editable from
the browser**. No redeploy to change a job title, no code edit to add a project.

- **Public site** - single page with smooth scroll (hero, about, skills,
  experience, projects, education, certifications, contact) plus a
  `/projects/[slug]` case-study page for each project.
- **Admin dashboard** at `/admin` - full create/edit/delete for every content
  type, drag-to-reorder, draft/published toggles, image and resume uploads, and
  an inbox for contact-form messages.
- **Static by default** - public pages are prerendered and served from cache, so
  visitors never wait on the database. Saving in the admin purges the affected
  cache tag, so an edit is live on the next request.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Quick start](#quick-start)
3. [Setting up the services](#setting-up-the-services)
   - [MongoDB Atlas](#1-mongodb-atlas)
   - [Auth secret and admin password](#2-auth-secret-and-admin-password)
   - [Cloudinary](#3-cloudinary-images-and-resume-pdf)
   - [Gmail SMTP](#4-gmail-smtp-contact-form)
4. [Seeding content](#seeding-content)
5. [Using the admin](#using-the-admin)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Keeping the free Atlas cluster awake (UptimeRobot)](#keeping-the-free-atlas-cluster-awake-uptimerobot)
8. [How it works](#how-it-works)
9. [Design decisions](#design-decisions)
10. [Troubleshooting](#troubleshooting)
11. [Scripts reference](#scripts-reference)

---

## Tech stack

| Layer      | Choice                                     |
| ---------- | ------------------------------------------ |
| Framework  | Next.js 16.4 (App Router, Turbopack)       |
| UI         | React 19.3, Tailwind CSS 4.3               |
| Animation  | Framer Motion 14                           |
| Database   | MongoDB Atlas + Mongoose 9                 |
| Auth       | Auth.js (NextAuth) v5, credentials + bcrypt |
| Validation | Zod 4 + React Hook Form 7                  |
| Uploads    | Cloudinary (signed direct uploads)         |
| Email      | Nodemailer 10 over Gmail SMTP              |
| Hosting    | Vercel                                     |

---

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill it in - see the next section
npm run hash:password -- "a-password-at-least-12-characters"
npm run seed                    # loads the starter content
npm run dev                     # http://localhost:3000
```

Then open <http://localhost:3000/admin> and sign in with `ADMIN_EMAIL` and the
password you just hashed.

> **Node 20.9+ is required** (Next.js 16). This project was built and verified
> on Node 24.

---

## Setting up the services

All four are free tiers. Nothing here costs money at portfolio traffic.

### 1. MongoDB Atlas

1. Create an account at <https://www.mongodb.com/cloud/atlas/register>.
2. **Create a cluster** - choose the **M0 Free** tier and a region near you.
3. **Database Access** → *Add New Database User*. Username and password, role
   *Read and write to any database*. Use a generated password with no `@` or `/`
   in it, or URL-encode those characters in the connection string.
4. **Network Access** → *Add IP Address*. For Vercel, whose build and function
   IPs are not fixed, use **Allow access from anywhere** (`0.0.0.0/0`). The
   database is still protected by the user credentials. If you want to lock this
   down later, Atlas offers private endpoints on paid tiers.
5. **Connect** → *Drivers* → copy the connection string and add the database
   name to the path:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
                                                              ^^^^^^^^^ the database name
   ```

   Put it in `.env.local` as `MONGODB_URI`.

### 2. Auth secret and admin password

```bash
# AUTH_SECRET - signs the session cookie
npx auth secret            # writes it to .env.local for you
# ...or generate one yourself:
openssl rand -base64 32

# ADMIN_PASSWORD_HASH
npm run hash:password -- "your-password-min-12-chars"
```

`hash:password` prints **two** forms of the hash. This is not redundant:

- the **escaped** form (`"\$2b\$12\$..."`) goes in `.env.local`
- the **raw** form (`$2b$12$...`) goes in the Vercel dashboard

A bcrypt hash contains `$` characters, and `.env` files go through variable
expansion, so an unescaped hash is silently truncated and **every login fails
with "invalid credentials"** even though the file looks correct. Vercel injects
environment variables verbatim and never expands them, so there the hash must
not be escaped. If you ever get this wrong the app now tells you exactly what
happened instead of just rejecting the password.

Your plain-text password is never stored anywhere - only the hash.

### 3. Cloudinary (images and resume PDF)

1. Sign up at <https://cloudinary.com/users/register_free>.
2. Dashboard → **Product Environment Credentials**. Copy the cloud name, API key
   and API secret into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
   `CLOUDINARY_API_SECRET`.

Uploads go **straight from your browser to Cloudinary**, signed by this app.
The API secret never reaches the browser, and files never pass through a Vercel
function - which also means you are not bound by the 4.5 MB serverless request
body limit. Images are delivered with `f_auto,q_auto` transformations, so
visitors get AVIF or WebP automatically.

If Cloudinary is not configured the admin still works; the upload button just
reports that it is unavailable and you can paste an external image URL instead.

### 4. Gmail SMTP (contact form)

Gmail rejects your normal account password for SMTP. You need an **App
Password**, which requires 2-Step Verification:

1. Enable 2-Step Verification: <https://myaccount.google.com/signinoptions/two-step-verification>
2. Create an App Password: <https://myaccount.google.com/apppasswords>
   - App: *Mail*, Device: *Other* → name it "Portfolio".
   - Google shows a 16-character code like `abcd efgh ijkl mnop`.
3. Put it in `.env.local`:

   ```ini
   GMAIL_USER="you@gmail.com"
   GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"   # spaces are fine, they get stripped
   CONTACT_TO_EMAIL="you@gmail.com"           # where enquiries are delivered
   ```

4. Verify it before trusting it with a real enquiry:

   ```bash
   npm run test:mail
   ```

   This authenticates against `smtp.gmail.com` and then sends a real message
   through the exact code path the contact form uses. Check your inbox (and the
   spam folder on the first send).

Notes:

- The email's `From` is always your own address - Gmail will not let you send as
  someone else. The visitor's address goes in `Reply-To`, so hitting reply in
  your mail client answers *them*.
- Because `From` is your own account, set `CONTACT_TO_EMAIL` to a **different**
  address if you can. Gmail files messages its own account sent under "Sent" /
  "All Mail" instead of the Inbox, which makes a perfectly delivered
  notification look missing.
- **If the email fails, the message is not lost.** The contact route writes the
  message to MongoDB *before* attempting delivery, records the SMTP error on the
  document, and still shows the visitor a success state. The admin inbox flags
  those messages with "Email not sent". This ordering is deliberate: an expired
  App Password should cost you a notification, not a job enquiry.

---

## Seeding content

```bash
npm run seed            # additive: only fills collections that are empty
npm run seed -- --reset # replaces the content collections
```

The seed loads a complete starter portfolio (profile, experience, four projects
with written case studies, 16 skills across 4 categories, education, social
links).

**Contact messages are never touched by either mode.** Re-seeding content will
not delete real enquiries.

`--reset` replaces content collections, so anything you have edited in the admin
is overwritten. Additive mode is the safe default.

---

## Using the admin

Sign in at `/admin`. The sidebar is generated from the content registry, so
every content type is there automatically.

- **Page content** (Hero, About, Site settings) - one editable document each.
- **Collections** (Projects, Skills, Skill categories, Experience, Education,
  Certifications, Social links) - list views with:
  - **drag to reorder** via the grip handle. This is also keyboard accessible:
    focus a handle, press <kbd>Space</kbd>, then use the arrow keys. The order
    in the list is the order on the public site.
  - **publish / draft toggle** (the eye icon). Drafts stay in the admin and
    disappear from the public site.
  - inline delete with a two-step confirm.
- **Inbox** - every contact submission, with read/unread, delete, and a reply
  link that opens your mail client addressed to the sender.

Every save shows a toast, every form validates inline using the same Zod schema
the server enforces, and a save purges the relevant cache so the public page is
updated immediately.

Icon fields (social links, skill categories) take a
[lucide](https://lucide.dev) icon name such as `Github`, `Linkedin`, `Mail`,
`Code2`, `Brain`, `Database` or `Rocket`. Unknown names fall back to a neutral
icon rather than breaking the page.

### Markdown in project descriptions

The project **Full description** field accepts Markdown - headings, bold,
italics, links, lists, code blocks and blockquotes. It is rendered through a
sanitiser with an explicit tag allow-list, so raw HTML, `<script>`, `<iframe>`
and inline styles are stripped even though you are the only author.

---

## Deploying to Vercel

1. **Push to GitHub.** `.gitignore` already excludes `.env*` (except
   `.env.example`), so your secrets stay local.

   ```bash
   git add -A
   git commit -m "Portfolio with admin dashboard"
   git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
   git push -u origin HEAD
   ```

   (`HEAD` pushes whatever branch you are on, so this works whether your
   default is `main` or `master`.)

2. **Import the repo** at <https://vercel.com/new>. Framework preset: Next.js.
   Leave the build settings alone.

3. **Add the environment variables** (Project → Settings → Environment
   Variables) for *Production*, *Preview* and *Development*:

   | Variable                | Notes                                             |
   | ----------------------- | ------------------------------------------------- |
   | `MONGODB_URI`           | the Atlas string, including the database name     |
   | `AUTH_SECRET`           | 32-byte random string                             |
   | `ADMIN_EMAIL`           | your login email                                  |
   | `ADMIN_PASSWORD_HASH`   | **the raw hash, no backslashes**                  |
   | `AUTH_URL`              | `https://your-domain.vercel.app`                  |
   | `NEXT_PUBLIC_SITE_URL`  | `https://your-domain.vercel.app`                  |
   | `CLOUDINARY_CLOUD_NAME` |                                                   |
   | `CLOUDINARY_API_KEY`    |                                                   |
   | `CLOUDINARY_API_SECRET` |                                                   |
   | `GMAIL_USER`            |                                                   |
   | `GMAIL_APP_PASSWORD`    |                                                   |
   | `CONTACT_TO_EMAIL`      |                                                   |

   > `MONGODB_URI` must be set before the first build. The public pages are
   > prerendered at build time, which reads from the database, so a build without
   > it will fail with a clear "Missing required environment variable" error.

4. **Deploy.** Then seed the production database once, from your machine,
   pointing at the same Atlas cluster:

   ```bash
   npm run seed
   ```

5. **Add your custom domain** (optional) under Project → Settings → Domains, and
   update `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to match. Auth.js builds its
   callback URLs from `AUTH_URL`; a stale value breaks login after a domain
   change.

6. **Set up the keep-alive monitor** - see the next section.

---

## Keeping the free Atlas cluster awake (UptimeRobot)

The public pages are served from cache, which is the point - but it means that
on a quiet week MongoDB may receive **no queries at all**, and a free-tier M0
cluster pauses itself after roughly 60 days of inactivity. A paused cluster makes
the next admin save or contact submission fail until it resumes.

`GET /api/health` exists for this. It runs a trivial `ping` against the database
and returns:

```json
{ "status": "ok", "database": "connected", "latencyMs": 43, "timestamp": "..." }
```

It returns HTTP 503 with `"database": "unreachable"` if the ping fails, so the
same monitor doubles as an alert.

**Point UptimeRobot at it:**

1. Sign up at <https://uptimerobot.com> (the free plan allows 50 monitors at
   5-minute intervals).
2. **+ Add New Monitor**:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `Portfolio health`
   - URL: `https://your-domain.vercel.app/api/health`
   - Monitoring Interval: **5 minutes**
3. Under *Advanced*, optionally set **Keyword** monitoring with the keyword
   `"status":"ok"` so a 200 response containing an error payload still alerts.
4. Add your email under *Alert Contacts To Notify*.
5. Save.

That is ~8,640 pings a month, which is trivially within Vercel's free function
quota and keeps the cluster warm indefinitely.

---

## How it works

### Content model

Ten Mongoose models, split into two kinds:

- **Singletons** (`Hero`, `About`, `SiteSettings`) - exactly one document,
  addressed by a fixed `key: 'singleton'` field and upserted.
- **Collections** (`Project`, `Skill`, `SkillCategory`, `Experience`,
  `Education`, `Certification`, `SocialLink`) - each document carries `order`
  (for drag-to-reorder) and `published` (the draft toggle).

Plus `Message` for contact submissions.

### The admin is generated, not hand-written

`lib/resources.ts` is a registry describing every content type: its label, its
icon, its Zod schema and a list of field descriptors (`text`, `markdown`,
`image`, `tags`, `ref`, ...). The sidebar, the list views, the forms, the
validation and the server actions all read from it.

Adding a field is one entry in that file - no new component, no new route, no new
action. Adding a whole content type is a model, a schema and a registry entry.
This is the "Django admin" part of the brief: one generic admin over a registry
of models, rather than ten near-identical CRUD screens that drift apart.

### Caching and revalidation

Next.js 16's **Cache Components** is enabled. Every public read in `lib/data.ts`
is a `'use cache'` scope tagged with its content type:

```ts
export async function getProjects(): Promise<Project[]> {
  'use cache'
  cacheTag(CACHE_TAGS.projects)
  cacheLife('max')
  // ...
}
```

The home page therefore prerenders into a static shell at build time and is
served without touching MongoDB. When the admin saves, the server action calls
`updateTag()` with the same tags:

```ts
for (const tag of tagsFor(resource)) updateTag(tag)
```

`updateTag` is Next 16's "read your own writes" purge, which is what you want
after a form submission - the next read is fresh, immediately, rather than
serving stale content while it revalidates in the background. (`revalidateTag`
with a profile is the right call from a route handler where staleness is fine.)

Measured locally: a cached home-page request is served in **~6 ms**; the first
request after an admin save re-renders in ~480 ms and every request after that
is back to ~6 ms.

### Security

Three independent layers, because any one of them can be bypassed:

1. **`proxy.ts`** (Next 16 renamed `middleware` to `proxy`) redirects
   unauthenticated requests for `/admin/*` and `/api/admin/*` to the login page.
   Its matcher deliberately excludes static assets, so it can never block CSS or
   images.
2. **Every admin page** calls `requireAdminPage()`, which re-reads the session
   and redirects if it is not an admin.
3. **Every server action and API route** calls `requireAdmin()` / checks
   `getAdminSession()` before touching the database.

Layer 3 is not belt-and-braces. Verified during development: a session cookie
that is cryptographically valid but carries a non-admin role **passes the proxy**
and gets a 200 from `/admin/hero` - the page then leaks nothing (the response
streams a redirect) and the save action rejects the write. Proxy alone would not
have stopped it.

Also:

- Login is rate limited to 5 attempts per IP per 10 minutes, and a wrong email
  still runs a bcrypt comparison against a dummy hash so the response time does
  not reveal whether the email was right.
- The contact form is rate limited to 3 submissions per IP per 10 minutes and
  carries a honeypot field. A filled honeypot gets a normal-looking success
  response and is silently dropped - telling a bot it was detected only teaches
  the operator to adapt.
- All input is validated with Zod **on the server**, using the same schema the
  browser used. Visitor-submitted text is rendered as plain text, never HTML.
- Admin Markdown is sanitised with an explicit allow-list before rendering.
- Secrets live only in environment variables. `.gitignore` excluded `.env*`
  before the first commit.

### Accessibility and motion

- `prefers-reduced-motion` is honoured twice over: a CSS media query neutralises
  the keyframe animations, and every Framer Motion component checks
  `useReducedMotion()` and renders its final state directly - necessary because
  Framer animates inline styles that CSS cannot override.
- Drag-to-reorder works from the keyboard (dnd-kit's keyboard sensor).
- Every form field has a real `<label for>`; composite fields (tag lists, image
  pickers) thread the id through to their actual input, and the key/value editor
  uses a labelled `role="group"` because it has no single input to point at.
- The cursor glow only mounts for a fine pointer and never for reduced motion.

### Scroll performance

The first version of this theme looked right but scrolled badly. What was wrong
and what fixed it, since all four are easy to reintroduce:

1. **`backdrop-filter` on every card.** `.glass` is used ~40 times on the home
   page, and a backdrop filter makes the compositor re-sample and re-blur that
   element's backdrop on every frame while scrolling. This was by far the
   biggest cost. `.glass` now uses a near-opaque gradient instead; real
   backdrop blur survives as `.glass-blur`, used only by the fixed header, the
   mobile menu sheet and the admin sidebar - a handful of permanently promoted
   layers where content genuinely scrolls underneath.
2. **`scale()` on heavily blurred layers.** The aurora blobs animated
   `translate3d` *and* `scale`. Scaling a blurred layer forces the blur to be
   re-rasterized every frame; translating one does not. The keyframes are
   translate-only now, and the blur radii came down from 90-110px to 56-64px.
3. **Animating layout and paint properties.** The skill bars animated `width`
   from 0, which triggers a layout pass per frame - with 16 bars entering the
   viewport together, that stalled the scroll. They are now sized to their
   final width and revealed with `scaleX` from a left origin. The "current
   role" timeline node animated `box-shadow`, repainting every frame; it is now
   a pseudo-element ring animating `transform` and `opacity`.
4. **Blend modes and per-event React renders.** `mix-blend-mode` forces the
   whole stacking context to be re-composited each frame, so it is gone from
   the film grain and the cursor glow. `ProjectCard` used to call `setState`
   twice per `pointermove`, re-rendering the card on every mouse movement; the
   tilt and spotlight are driven by motion values now, which write straight to
   the DOM without a React render.

The rule of thumb that came out of it: animate only `transform` and `opacity`,
and treat `backdrop-filter`, `mix-blend-mode` and animated `width`/`box-shadow`
as things you can afford once or twice on a page, not forty times.

Note that `content-visibility: auto` is **not** used to skip offscreen
sections, tempting though it is. It implies `contain: paint`, which would make
every section a clipping ancestor and cut the neon glows off - the exact bug
described next.

### A note on the glow clipping problem

The brief flagged that neon glows got clipped in an earlier project. Three rules
are applied here, and there is a comment at each site explaining why:

1. **`.glass` never sets `overflow: hidden`.** Card images are clipped by an
   inner wrapper that carries no glow instead. An element with
   `overflow: hidden` clips **its own pseudo-elements**, and the halo is a
   `::before` at `inset: -28px` - so putting both on one element makes the glow
   vanish entirely. (One instance of exactly this slipped into the About
   portrait during the build and was caught by auditing every `overflow`
   declaration.)
2. **`.glow-room`** (`padding: 1.75rem; margin: -1.75rem`) wraps every grid of
   glowing cards. The padding gives the halo room to paint; the negative margin
   cancels the visual indent so the cards still line up with the heading above.
   Without it the halo is cut off at the grid cell edge even though nothing sets
   `overflow: hidden`.
3. **`body` uses `overflow-x: clip`, not `hidden`.** `clip` prevents sideways
   scrolling without creating a scroll container - and therefore without becoming
   a clipping ancestor for every glow on the page.

---

## Design decisions

Where there was a real choice to make, here is what was picked and why.

**Generic registry-driven admin instead of per-type screens.** Ten content types
would have meant ten list views and ten forms that slowly diverge. The registry
means one code path, so a fix to validation or error handling applies everywhere.
The cost is a layer of indirection: the forms are rendered from descriptors, so
a genuinely bespoke field needs a new descriptor type rather than ad-hoc JSX.

**Four generic server actions instead of fifty.** `saveResource`,
`deleteResource`, `reorderResource` and `setPublished` take a resource key that
is validated against the registry, so the key can never address an arbitrary
collection. The alternative - five exported actions per type - is more code for
the same safety.

**Signed direct uploads instead of proxying files.** A Vercel function caps
request bodies at 4.5 MB, and proxying spends function time on bytes we do not
need to inspect. The browser gets a short-lived signature that pins the upload
folder, and the API secret stays server-side.

**Database write before email send.** Covered above: the message is durable
before Gmail is involved, so an SMTP failure costs a notification rather than an
enquiry.

**In-memory rate limiting, not Redis.** On Vercel each instance has its own
memory, so a limit of 3 is really "3 per instance". For a personal site that is
the right trade: it stops scripts and double submits, costs nothing, and adds no
service to maintain. The call sites are unchanged if you later swap in
`@upstash/ratelimit` - that is the one function to replace in
`lib/rate-limit.ts`.

**`nodemailer@10` with an npm `override`.** Auth.js v5 beta declares an optional
peer of `nodemailer ^7 || ^8`, but every version `<= 10.0.5` carries high-severity
advisories. Since this project uses the Credentials provider and never Auth.js's
nodemailer-based email provider, the override is safe and `npm audit --omit=dev`
reports zero vulnerabilities. Installing nodemailer 8 to satisfy the stale peer
would have meant shipping the known-vulnerable version.

**Free-text dates (`"Jun 2025"`) instead of date pickers.** Resume dates are
written at month granularity and sometimes as "Present". A real date type would
force a precision the data does not have and make the admin more annoying to use.

**Seeded certifications are empty on purpose.** The brief listed none, and
inventing credentials on a resume site is worse than an empty section - which
the public page hides automatically.

---

## Troubleshooting

**"Invalid credentials" when the password is definitely right.**
Your `ADMIN_PASSWORD_HASH` is being eaten by `.env` variable expansion. In
`.env.local` the dollars must be escaped: `"\$2b\$12\$..."`. Re-run
`npm run hash:password -- "your-password"` and paste the first form. The app
validates the hash shape at runtime and will tell you this directly.

**Build fails with "Missing required environment variable MONGODB_URI".**
Public pages are prerendered at build time, which reads the database. Set
`MONGODB_URI` in your Vercel project settings (all three environments) and
redeploy.

**Login redirects to the wrong host after deploying.**
`AUTH_URL` still points at the old URL. Update it to your current domain.

**`npm run test:mail` fails to authenticate.**
You are using the account password rather than an App Password, or 2-Step
Verification is not enabled on the Google account. App Passwords do not exist
until 2FA is on.

**Contact form succeeds but no email arrives.**
First check the admin inbox. If the message is there *without* an "Email not
sent" flag, then Gmail accepted it and the problem is where it landed, not
whether it sent.

The usual cause is `CONTACT_TO_EMAIL` being the same address as `GMAIL_USER`.
Gmail recognises a message its own account sent and files it under "Sent" /
"All Mail" rather than the Inbox, so it looks like nothing arrived. Either
point `CONTACT_TO_EMAIL` at a different address, or search your mail for
`subject:"Portfolio message from"`. Check spam on the first send too.

If the message *is* flagged "Email not sent", the SMTP error is recorded on it;
run `npm run test:mail` to debug authentication separately.

**Cloudinary upload fails: "Request forbidden due to missing permissions
(actions=[\"create\"])".**

The API key authenticates but is not permitted to upload. This is an account
setting, not a code problem. How to be sure, and how to fix it:

*Confirming the diagnosis.* An unsigned upload sends no API key at all, so it
isolates the key from everything else:

```bash
curl -F file=@any.png -F upload_preset=does_not_exist   https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
```

`400 {"error":{"message":"Upload preset not found"}}` means the upload endpoint
works for your account and the key is the problem. A `403` with "missing
permissions" instead would mean the whole product environment is blocked. (A
genuinely malformed signature reports `Invalid Signature`, which is a different
failure again.)

*Fix 1 - use a key that may upload.* Console > **Settings > API Keys**. Use the
original key pair that came with the product environment. If you generated an
additional key, it must be **activated** there before it can do anything; an
inactive or restricted key authenticates and then refuses every upload.

*Fix 2 - skip API keys for uploading.* Console > **Settings > Upload > Upload
presets > Add upload preset**, set **Signing Mode = Unsigned**, give it a
folder (e.g. `portfolio/images`), and restrict allowed formats and max file
size. Then set:

```ini
CLOUDINARY_UPLOAD_PRESET="your_preset_name"
```

and restart the dev server. The admin switches to unsigned uploads
automatically and ignores the API key. The trade-off: an unsigned preset can be
used by anyone who learns your cloud name and preset name, so the restrictions
you set on the preset are the security boundary. The folder is fixed on the
preset, so it cannot be redirected by a caller.

Signed uploads remain the default whenever `CLOUDINARY_UPLOAD_PRESET` is unset.

**The Next.js logo sits in the bottom-left corner.**
That is the Next.js dev indicator, which only renders under `npm run dev` and
never in a production build. It is switched off via `devIndicators: false` in
`next.config.ts`; changes to that file need a dev-server restart.

**Atlas connection times out from Vercel.**
Network Access does not allow Vercel's IPs. Add `0.0.0.0/0`.

**An admin edit does not show on the public page.**
A save purges the cache tag automatically. If you changed the database
*directly* (outside the admin) the cache is not purged - it will refresh within
a day, or you can redeploy. Edits made through the admin are immediate.

**A project page returns 200 for a slug that does not exist.**
Expected. With partial prerendering the static shell is sent before the database
lookup runs, so the status is already committed. Next.js injects
`<meta name="robots" content="noindex">` on that render, so the page is not
indexable and there is no soft-404 SEO problem.

---

## Scripts reference

| Script                              | What it does                                                      |
| ----------------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                       | Dev server with Turbopack                                         |
| `npm run build`                     | Production build (prerenders the public pages - needs the DB)     |
| `npm start`                         | Serve the production build                                        |
| `npm run typecheck`                 | `next typegen` then `tsc --noEmit`                                |
| `npm run lint`                      | ESLint                                                            |
| `npm run verify`                    | typecheck + lint + build, in one go                               |
| `npm run seed`                      | Load starter content (additive)                                   |
| `npm run seed -- --reset`           | Replace content collections                                       |
| `npm run hash:password -- "pw"`     | Print a bcrypt hash in both `.env` and Vercel forms               |
| `npm run test:mail`                 | Authenticate against Gmail SMTP and send a real test message      |

> `npm run typecheck` runs `next typegen` first on purpose. Next 16 generates the
> `PageProps` / `LayoutProps` route types into `.next/types`, so `tsc` alone
> fails on a clean checkout.

---

## Project layout

```
app/
  page.tsx                    public single page
  projects/[slug]/page.tsx    project case study
  admin/
    layout.tsx                session guard + shell
    page.tsx                  dashboard
    login/page.tsx
    inbox/page.tsx
    [resource]/               generic list + new + edit, for every content type
  api/
    contact/route.ts          validate -> store -> email
    health/route.ts           DB ping for UptimeRobot
    admin/upload-signature/   Cloudinary signature (admin only)
    auth/[...nextauth]/
components/
  public/                     hero, sections, cards, background, motion helpers
  admin/                      shell, generated form, sortable list, inbox
  ui/                         icon registry, brand marks
lib/
  resources.ts                the content registry (client-safe)
  resources.server.ts         registry -> Mongoose models + cache tags
  schemas.ts                  Zod schemas, shared client and server
  data.ts                     cached public readers (use cache + cacheTag)
  admin-data.ts               uncached admin readers
  actions.ts                  the four generic server actions
  mongodb.ts                  cached serverless connection
  auth-guard.ts               requireAdmin / requireAdminPage
  rate-limit.ts               in-memory fixed-window limiter
models/                       ten Mongoose models
scripts/                      seed, hash-password, test-mail
auth.ts / auth.config.ts      Auth.js (split for the edge runtime)
proxy.ts                      admin route protection
```
