# Recursive.eco Channels

Community-driven wellness channel app (Next.js + Supabase). Focused on tool sharing, discovery, and profiles.

🌐 **Live Site**: [channels.recursive.eco](https://channels.recursive.eco/)  
🏠 **Main Site**: [www.recursive.eco](https://www.recursive.eco/)

## Features

- Community tool discovery and sharing
- Tool rating and review system
- Admin panel for tool curation
- Multi-channel architecture (wellness, coding, children's books, etc.)
- User authentication and profiles
- Newsletter subscription system
- **🔄 Shared Authentication** - Seamless sign-in across recursive.eco tools

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

## Related Apps

- **[Best Possible Self Journal](https://journal.recursive.eco/)** - AI-guided journaling tool
- **[Recursive Patterns](https://patterns.recursive.eco/)** - Mathematical beauty & patterns
- **[Spiral Generator](https://recursive.eco/spiral/)** - Interactive logo generator

## Architecture & Shared Authentication

This app shares the same Supabase backend with other recursive.eco tools, enabling:

- **✨ Unified User Authentication**: Sign in once, access all tools
- **🔄 Cross-App Navigation**: Seamless transitions between apps
- **🛡️ Secure Session Sharing**: Built on Supabase's session management
- **📊 Shared User Data**: Consistent profiles across the platform

### How Shared Auth Works

1. **User signs into Channels** → Standard Supabase authentication
2. **User clicks "Best Possible Self" tool** → App detects authentication and passes session hint
3. **Journal app loads** → Automatically detects and restores user session
4. **Seamless experience** → No re-authentication needed!

The system gracefully falls back to standard login if session sharing fails.

## Customization

Edit `jongu.config.json` to change channel name, description, links, and feature flags. No code changes required.

## Deployment

Deploy on Vercel and add the same environment variables. 

### Important: Supabase Auth Configuration

For shared authentication to work, make sure these redirect URLs are whitelisted in Supabase:
- `https://channels.recursive.eco/auth/callback`
- `https://journal.recursive.eco/auth/callback`
- `https://www.recursive.eco/auth/callback`

## License

Creative Commons Attribution-ShareAlike 4.0. See `LICENSE`.
