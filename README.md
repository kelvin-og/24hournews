# 24HOURNEWS — Ghana's 24-Hour Digital Newsroom

A high-performance modern news and editorial publishing platform providing round-the-clock coverage across Politics, Business, Education, Health, Sports, and Entertainment.

---

## 🌟 Key Features

- **24/7 Editorial Newsroom & Publishing Suite**:
  - Full WYSIWYG editorial composer with multi-block support (paragraphs, subheadings, pull quotes).
  - Editorial pick (`is_editorial_pick`) and trending popular ranking (`is_popular_override`) controls.
  - Breaking news tickers, hero carousels, and multi-desk tag management.
  - Media asset library with direct file uploads.
- **Enterprise Super Admin & Audit Controls**:
  - Role-Based Access Control (RBAC): Super Admin & Newsroom Editor roles.
  - Immutable audit trail recording publications, status shifts, and role changes.
  - Real-time system monitoring (PostgreSQL storage, CDN asset caching, API telemetry).
- **Modern Fullstack Architecture**:
  - **Framework**: TanStack Start (Nitro SSR, TanStack Router, React 19).
  - **Styling**: Tailwind CSS v4, Radix UI accessible primitives, Lucide icons.
  - **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and Storage CDN buckets.
  - **Type Safety**: End-to-end TypeScript with strict schema validation.

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 20+ installed
- npm or pnpm package manager

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/kelvin-og/24hournews.git
cd 24hournews

# Install dependencies
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_ACCESS_TOKEN=your_personal_access_token # for automated migrations
SUPABASE_PROJECT_REF=your_project_ref
```

### 4. Running the Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:8080`.

- **Public Reader Site**: `http://localhost:8080/`
- **Editorial Admin**: `http://localhost:8080/admin`

---

## 🛠️ Scripts & Tooling

| Command           | Description                                                  |
| :---------------- | :----------------------------------------------------------- |
| `npm run dev`     | Starts the local dev server on port 8080                     |
| `npm run build`   | Builds the client and Nitro SSR server for production        |
| `npm run preview` | Previews the production build locally                        |
| `npm run test`    | Executes unit and routing test suites via Vitest             |
| `npm run lint`    | Runs ESLint 9 checks across the codebase                     |
| `npm run format`  | Formats all code with Prettier                               |
| `npm run migrate` | Executes Supabase SQL migrations directly via management API |

---

## 📁 Repository Structure

```
24hournews/
├── .github/workflows/     # CI & deployment automated workflows
├── public/                # Static public assets (favicons, robots.txt)
├── scripts/               # Migration and maintenance automation scripts
├── src/
│   ├── assets/            # Editorial photography & brand identity assets
│   ├── components/        # React components (site, admin, and UI primitives)
│   ├── hooks/             # Custom React hooks
│   ├── lib/
│   │   ├── auth/          # Authentication & role guard providers
│   │   ├── news/          # Newsroom API & data providers
│   │   ├── supabase/      # Supabase client, types, and server DB bridge
│   │   └── site.ts        # Category configurations and site metadata
│   ├── routes/            # TanStack file-based routes & API handlers
│   ├── styles.css         # Tailwind CSS styling tokens
│   └── test/              # Vitest test specs
└── supabase/migrations/   # Version-controlled PostgreSQL migrations
```

---

## 🚢 Deployment

### Cloudflare Pages / Workers (Recommended)

This project is configured with Nitro targeting Cloudflare Workers/Pages (`.output/server/wrangler.json`), enabling instant edge SSR and full API endpoint support. Connecting this repository to Cloudflare Pages yields zero-config deployments.

### GitHub Pages (Static Client Preview)

Automated GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) builds and deploys the static reader client to GitHub Pages upon push to `main`.

---

## 📄 License

Private and confidential. Built for 24HOURNEWS.
