# RANZCR MCQ Practice App

A progressive web app for practicing RANZCR Clinical Radiology examination questions.

## Features

- 📚 **Phase 1 & Phase 2 Coverage**: Anatomy, AIT, Pathology, Clinical Radiology, Film Reading, and all Viva categories
- ✍️ **Notes System**: Create and search notes linked to categories
- 📊 **Progress Tracking**: Track your performance by category
- 📱 **PWA Support**: Install as a native app on mobile devices
- 🔄 **Real-time Sync**: Data syncs across devices via Supabase

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

---

## Setup Guide

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon → **New repository**
3. Name it `ranzcr-mcq`
4. Make it **Private**
5. **Don't** initialize with README (we'll push our code)
6. Click **Create repository**

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in
2. Click **New Project**
3. Fill in:
   - **Name**: `ranzcr-mcq`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: West EU (Frankfurt) - closest to NL
4. Click **Create new project**
5. Wait 1-2 minutes for setup

### Step 3: Set Up Database

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` 
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success" - the tables and sample questions are created

### Step 4: Get Supabase Credentials

1. Go to **Settings** → **API** (in left sidebar)
2. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (long string)

### Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with GitHub
2. Click **Add New** → **Project**
3. Click **Import** next to your `ranzcr-mcq` repo
4. In **Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |

5. Click **Deploy**

### Step 6: Push Code to GitHub

In your terminal:

```bash
# Clone the empty repo
git clone https://github.com/YOUR_USERNAME/ranzcr-mcq.git
cd ranzcr-mcq

# Copy all the project files here, then:
git add .
git commit -m "Initial commit: RANZCR MCQ app"
git push origin main
```

Vercel will automatically redeploy when you push.

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.local.example .env.local
# Edit .env.local with your actual values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## RANZCR Exam Structure

### Phase 1 (Year 1-2)
- **Anatomy**: Radiological anatomy across all modalities
- **Applied Imaging Technology (AIT)**: Physics, radiation protection, technology

### Phase 2 (Year 4-5)
- **Pathology**: MCQs and SAQs
- **Clinical Radiology**: MCQs
- **Film Reading**: Case-based questions
- **Vivas**: Chest, MSK, Neuro, Abdo, Paeds, Breast, Pathology

---

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"

---

## Adding Questions

You can add questions through:

1. **The App**: Use the "Add Question" button
2. **Supabase Dashboard**: Insert directly into the `questions` table
3. **Bulk Import**: Use SQL INSERT statements in Supabase SQL Editor

---

## License

Private use only.
