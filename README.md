# Jongu Wellness Platform

Community-driven wellness tool discovery platform. This is the wellness component of the Jongu ecosystem, focused on tool sharing, discovery, and community building around mental health and wellness resources.

## Features

- Community tool discovery and sharing
- Tool rating and review system
- Admin panel for tool curation
- Multi-channel architecture (wellness, coding, children's books, etc.)
- User authentication and profiles
- Newsletter subscription system

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (if using AI features)
```

## Related Projects

- **Best Possible Self App**: The wellness journaling tool that's featured on this platform
- **Supabase Backend**: Shared database and authentication system

## Architecture

This app shares the same Supabase backend with the Best Possible Self wellness app, enabling unified user authentication and cross-platform features.

## Deployment

Deploy on Vercel by connecting your repository and setting the environment variables in the Vercel dashboard.