# GoalCircle - Journey Companion

GoalCircle pairs you with an accountability partner so you actually finish what you start. A modern React application built with TypeScript, Vite, and Supabase for goal tracking and social accountability.

## 🚀 Features

- **Goal Setting & Tracking**: Set personal goals with deadlines and progress tracking
- **Accountability Partners**: Connect with friends for mutual accountability
- **Progress Visualization**: Interactive charts and graphs for goal progress
- **Real-time Chat**: Communicate with accountability partners
- **Achievements & Gamification**: Earn XP and unlock achievements
- **Dark/Light Theme**: Modern UI with theme switching
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Real-time)
- **State Management**: React Query, Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest, React Testing Library

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd journey-companion
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_REDIRECT_URL=http://localhost:8080
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Go to Settings > API to get your URL and anon key
3. Enable Row Level Security (RLS) on all tables
4. Set up authentication providers (Google OAuth recommended)

### 4. Database Schema

Run the SQL migrations in `supabase/migrations/` to set up your database schema.

### 5. Development

```bash
npm run dev
```

Visit `http://localhost:8080` to see the app.

## 🏗️ Production Deployment

### Environment Variables

For production, ensure these environment variables are set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_SUPABASE_REDIRECT_URL=https://yourdomain.com
VITE_APP_NAME=GoalCircle
VITE_APP_DESCRIPTION=GoalCircle pairs you with an accountability partner...
```

### Build and Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist/` folder to your hosting provider (Vercel, Netlify, etc.).

## 🔒 Security

### Authentication

- Uses Supabase Auth with Row Level Security
- Google OAuth integration
- Protected routes with automatic redirects
- Secure session management

### Environment Security

- Never commit `.env` files
- Use different credentials for development/production
- Validate environment variables at startup

### Database Security

- Row Level Security enabled on all tables
- Policies restrict data access to authenticated users
- Input validation with Zod schemas

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── data/               # Static data and constants
└── test/               # Test files
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section below
2. Search existing GitHub issues
3. Create a new issue with detailed information

### Troubleshooting

**Blank white screen in development:**
- Check that your `.env` file exists and contains valid Supabase credentials
- Restart the dev server after changing environment variables
- Check browser console for errors

**Authentication issues:**
- Verify Supabase URL and anon key are correct
- Check OAuth redirect URLs in Supabase dashboard
- Ensure RLS policies are properly configured

**Build failures:**
- Run `npm run lint` to check for code issues
- Ensure all dependencies are installed
- Check TypeScript errors with your IDE

## 🔄 Migration Guide

If upgrading from an earlier version:

1. Update environment variables as described above
2. Run database migrations if any
3. Update any deprecated API calls
4. Test authentication flow thoroughly

---

Built with ❤️ using modern web technologies.
