# Quick Setup Guide - Production Authentication

## 🚀 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here_minimum_100_characters

# Optional but recommended
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📍 Where to Get These Values

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ What Happens Without Them?

### Development
```bash
npm run dev
# ❌ Error: [Supabase] Missing configuration...
# App won't start
```

### Production
```bash
# Protected routes return:
HTTP 503 Service Unavailable
{
  "error": "Authentication service not configured"
}

# Users see:
"Authentication Error: [Supabase] Missing configuration..."
```

## ✅ Verify Setup

```bash
# Check if env vars are loaded
npm run dev

# Should see:
# ✓ Ready in 2.3s
# ○ Compiling / ...

# If you see errors, check:
# 1. .env.local exists
# 2. Variables are set correctly
# 3. No typos in variable names
```

## 🔧 Troubleshooting

### Error: "Invalid SUPABASE_URL format"
```bash
# ❌ Wrong
NEXT_PUBLIC_SUPABASE_URL=my-project

# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=https://my-project.supabase.co
```

### Error: "Invalid SUPABASE_ANON_KEY format"
```bash
# ❌ Key too short
NEXT_PUBLIC_SUPABASE_ANON_KEY=abc123

# ✅ Correct (100+ characters)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error: "Authentication service not configured"
```bash
# Check if variables are public (NEXT_PUBLIC_ prefix)
# Frontend needs NEXT_PUBLIC_ prefix to access them

# ❌ Wrong
SUPABASE_URL=https://...

# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=https://...
```

## 📦 Deployment (Render, Vercel, etc.)

### Render
1. Go to your service
2. **Environment** tab
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Save Changes**
5. Redeploy

### Vercel
1. Project Settings
2. **Environment Variables**
3. Add all three variables
4. Select environments (Production, Preview, Development)
5. **Save**
6. Redeploy

## 🧪 Testing

```bash
# Test locally
npm run dev
# Visit http://localhost:3000/login
# Should see login page (not errors)

# Test build
npm run build
# Should complete without errors

# Test production mode
npm run start
# Should work same as dev
```

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Authentication Analysis](./AUTHENTICATION_UPDATES.md)

---

**Need Help?** Check the console logs for detailed error messages!
