# Acceptafy

## Overview

Acceptafy is a React and TypeScript email marketing analysis and education platform. Its primary purpose is to help users optimize their email campaigns through AI-powered grading, deliverability tools, sender reputation tracking, and comprehensive educational resources. Built with Vite, Express, and the Google Gemini AI API, the platform aims to provide real-time email analysis and educational content to master email marketing best practices. The business vision is to empower marketers with intelligent tools to improve campaign performance and deliverability.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, bundled via Vite. It uses `shadcn/ui` components (Radix UI primitives) with a custom dark theme design system featuring purple gradient accents and dark slate backgrounds. Styling is handled with Tailwind CSS, including custom utility classes for animations. State management relies on local component state with React hooks, and browser localStorage for history data. The application is a single-page application, using conditional rendering for its Grader, History, and Academy views.

### Backend

The backend is an Express.js server with TypeScript, providing RESTful APIs for AI-powered operations such as email content analysis (`/api/grade`), rewriting (`/api/rewrite`), follow-up generation (`/api/followup`), and various deliverability tools. The server code is built using a custom `esbuild` script, while Vite handles client bundling. Production builds serve static assets from `dist/public`.

### Data Storage

PostgreSQL is used as the database with Drizzle ORM, primarily for a minimal user schema. Client-side storage uses browser localStorage for analysis history, limited to the 20 most recent items, storing complete email content and AI analysis results.

### AI Integration

The platform integrates with Google Gemini AI via Replit's AI Integrations service. All AI operations utilize structured output with schema validation, mapping to defined TypeScript interfaces. Key AI functions include multi-faceted email grading, goal-based email rewriting, context-aware follow-up and sequence generation, technical record generation (SPF, DKIM, DMARC, BIMI), domain/list analysis, and the "Ask Acceptafy" conversational AI assistant for email deliverability questions (with image upload support, paid-member only via `askAcceptafy` feature flag in SUBSCRIPTION_LIMITS).

### System Design Choices

The project employs a monorepo structure, sharing types between client and server for type safety. It utilizes `drizzle-kit push` for schema synchronization instead of migrations. Static assets for the client are built separately and served in production. Infrastructure for session management with PostgreSQL is present, with Replit authentication fully implemented. A daily rate-limiting system tracks usage per day and month, with subscription-tier based limits enforced at the API level. Performance is optimized through lazy loading of routes and heavy components, along with SEO enhancements including comprehensive meta tags, structured data, and semantic HTML.

### Security Features

- **Session Security**: Express sessions use `httpOnly`, `secure`, and `sameSite="lax"` cookie settings for CSRF protection
- **Input Validation**: Zod schemas validate all user input for gamification, manual campaign stats, and admin notes
- **Rate Limiting**: IP-based rate limiting on authentication, password reset, AI endpoints, and contact list processing
- **Authentication**: Sensitive endpoints require authentication (isAuthenticated) or admin access (isAdmin); public AI features use optionalAuth with rate limiting for free trial experience
- **Admin Exclusion**: Admin accounts are excluded from all analytics metrics to prevent data skewing

## External Dependencies

-   **Google Gemini AI**: Used for all AI-powered features (via Replit AI Integrations).
-   **PostgreSQL**: Database for persistent storage (configured via Neon serverless).
-   **Radix UI**: Headless UI component primitives.
-   **shadcn/ui**: Pre-configured Radix components with Tailwind styling.
-   **Lucide React**: Icon library.
-   **TanStack Query**: Client-side data fetching and caching.
-   **Tailwind CSS**: Utility-first styling framework.
-   **Zod**: Runtime schema validation.
-   **Vite**: Frontend build tool.
-   **Express.js**: Backend web framework.