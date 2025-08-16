# Jongu MVP Channel

Community-driven wellness channel app (Next.js + Supabase). Focused on tool sharing, discovery, and profiles.

## Features

- Community tool discovery and sharing
- Tool rating and review system
- Admin panel for tool curation
- Multi-channel architecture (wellness, coding, children's books, etc.)
- User authentication and profiles
- Newsletter subscription system

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3003 in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (if using AI features)
```

## Related

- Best Possible Self Tool (separate app)
- Shared Supabase project for auth and data

## Architecture

This app shares the same Supabase backend with the Best Possible Self wellness app, enabling unified user authentication and cross-platform features.

## Customization

Edit `jongu.config.json` to change channel name, description, links, and feature flags. No code changes required.

## Deployment

Deploy on Vercel and add the same environment variables. Make sure the auth callback URL is whitelisted in Supabase.

## License

Creative Commons Attribution-ShareAlike 4.0. See `LICENSE`.
