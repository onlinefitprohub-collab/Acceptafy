# Inbox Authority

## Overview

Inbox Authority is a React + TypeScript email marketing analysis and education platform. The application helps users optimize their email campaigns through AI-powered grading, provides deliverability tools, tracks sender reputation, and offers comprehensive educational resources. Built with Vite, Express, and the Google Gemini AI API, it combines real-time email analysis with educational content to help users master email marketing best practices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, bundled via Vite

**UI Component Strategy**: The application uses shadcn/ui components (Radix UI primitives) with a custom dark theme design system. All styling is predefined in a comprehensive design guidelines document, featuring purple gradient accents, dark slate backgrounds, and specific animation patterns (pulse, shimmer, aurora, fade-in, scale-in).

**State Management**: Local component state with React hooks. No global state management library is used—state is lifted to parent components and passed down as props. History data is persisted in browser localStorage.

**Routing**: Single-page application without client-side routing. The app uses conditional rendering to switch between three main views: Grader (default), History, and Academy.

**Key Design Decisions**:
- Pre-defined custom design system (not customizable by users)
- All visual specifications are explicit—no design flexibility required
- Tailwind CSS with custom utility classes for animations and effects
- Accessibility considerations built into design (contrast, semantic HTML)

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**API Structure**: RESTful endpoints for AI-powered operations:
- `/api/grade` - Email content analysis and scoring
- `/api/rewrite` - AI-powered email rewriting with goal-based optimization
- `/api/followup` - Follow-up email generation
- `/api/sequence` - Multi-email sequence generation
- `/api/dns/generate` - DNS record generation for email authentication
- `/api/domain/health` - Domain reputation checking
- `/api/list/analyze` - Email list quality analysis
- `/api/bimi/generate` - BIMI record generation
- `/api/glossary/explain` - Educational term explanations

**Build System**: 
- Custom build script (`script/build.ts`) using esbuild for server code
- Vite for client bundling
- Server dependencies are selectively bundled to reduce cold start times
- Production builds output to `dist/` directory

**Development vs Production**:
- Development: Vite dev server with HMR via middleware mode
- Production: Serves pre-built static assets from `dist/public`

### Data Storage

**Database**: PostgreSQL with Drizzle ORM

**Schema Design**: Minimal schema with just a users table (id, username, password). The application is designed to be extended with additional tables as needed.

**Session Storage**: The codebase includes infrastructure for session management (connect-pg-simple) though user authentication is not fully implemented in the provided code.

**Client-Side Storage**: Browser localStorage for analysis history (limited to 20 most recent items). History items store complete email content, variations, and AI analysis results.

### AI Integration

**Provider**: Google Gemini AI via Replit's AI Integrations service

**Implementation Pattern**: Structured output with schema validation using Gemini's Type system. All AI operations use defined TypeScript interfaces that map to response schemas.

**Key AI Operations**:
1. **Email Grading**: Complex multi-faceted analysis returning scores, grades, and detailed feedback across multiple dimensions (subject line, preview text, body copy, spam triggers, structural issues, personalization, links, accessibility)
2. **Email Rewriting**: Goal-based rewriting (general improvement, urgency, clarity, conciseness)
3. **Follow-up Generation**: Context-aware follow-up emails with goal targeting
4. **Sequence Generation**: Multi-email drip sequences with timing and rationale
5. **Technical Record Generation**: SPF, DKIM, DMARC, BIMI records
6. **Domain Analysis**: Reputation checking and list quality analysis

**Error Handling**: Try-catch blocks with generic error responses. No retry logic implemented.

### External Dependencies

**Primary Services**:
- **Google Gemini AI** (via Replit AI Integrations): All AI-powered features
- **PostgreSQL** (via Neon serverless): Database (configured but minimally used)

**UI Component Libraries**:
- **Radix UI**: Headless component primitives (accordion, dialog, dropdown, popover, tooltip, etc.)
- **shadcn/ui**: Pre-configured Radix components with Tailwind styling
- **Lucide React**: Icon library (supplemented by custom SVG icons in CategoryIcons component)

**Supporting Libraries**:
- **TanStack Query**: Client-side data fetching and caching (infrastructure present but underutilized)
- **Tailwind CSS**: Utility-first styling with extensive custom configuration
- **class-variance-authority & clsx**: Dynamic className composition
- **date-fns**: Date formatting for history items
- **Zod**: Runtime schema validation (with drizzle-zod for database schemas)

**Development Tools**:
- **Vite Plugins**: React plugin, runtime error overlay, Replit-specific tooling (cartographer, dev banner)
- **TypeScript**: Strict mode with ESNext modules
- **PostCSS**: With Tailwind and Autoprefixer

**Notable Architectural Choices**:
1. **Monorepo Structure**: Client, server, and shared code in single repository with path aliases
2. **Type Safety**: Shared types between client/server in `client/src/types.ts` and `shared/schema.ts`
3. **No Database Migrations**: Uses `drizzle-kit push` for schema synchronization
4. **Static Asset Strategy**: Client built separately, served as static files in production
5. **Session Strategy**: Infrastructure for PostgreSQL session store present but not actively used