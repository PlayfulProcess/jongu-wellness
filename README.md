# Jongu Wellness Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PlayfulProcess/jongu-wellness&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,RESEND_API_KEY,ADMIN_PASSWORD&envDescription=Required%20environment%20variables&envLink=https://github.com/PlayfulProcess/jongu-wellness%23environment-variables)

Community-driven wellness tool discovery platform. This is the wellness component of the Jongu ecosystem, focused on tool sharing, discovery, and community building around mental health and wellness resources.

Featured as the www.jongu.org channels.

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

## Customization

### Quick Start for Therapists & Creators

1. **Fork this repository** 
2. **Edit `jongu.config.json`** to customize:
   - Channel name and description
   - Discord server ID
   - Stripe donation link
   - Colors and theme

3. **Deploy with one click** using the button at the top

### What You Can Customize

- **Channel Info**: Name, tagline, description
- **Social Links**: Discord, Twitter, donation links  
- **Features**: Toggle Discord widget, donations, newsletter
- **Theme**: Colors and styling
- **Content**: All text is in `jongu.config.json`

No coding required! Just edit the JSON file and deploy.

## Deployment

Deploy on Vercel by connecting your repository and setting the environment variables in the Vercel dashboard.# Clean stable version restored
