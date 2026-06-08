# CIPMS Survey Module — Setup Guide

## 1. Fill in .env.local

```
MONGODB_URI=          # From MongoDB Atlas → Connect → Drivers
NEXTAUTH_SECRET=      # Run: openssl rand -base64 32
NEXTAUTH_URL=         # http://localhost:3000 (dev) or your Vercel URL (prod)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 2. MongoDB Atlas Setup
1. Go to https://mongodb.com/atlas → Create free cluster
2. Database Access → Add user with password
3. Network Access → Add IP 0.0.0.0/0 (allow all for dev)
4. Connect → Drivers → copy URI → paste in MONGODB_URI

## 3. Cloudinary Setup
1. Go to https://cloudinary.com → Sign up free
2. Dashboard → copy Cloud Name, API Key, API Secret

## 4. Create Super Admin
```bash
MONGODB_URI="your-uri" npx tsx scripts/seed-admin.ts
# Login: admin@cipms.in / Admin@123
```

## 5. Run Dev
```bash
npm run dev
# Open http://localhost:3000
```

## 6. Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
# Add all .env.local vars in Vercel dashboard → Settings → Environment Variables
```

## Flow
1. Login as Super Admin
2. Create Admins under Users
3. Create Agents (Gram Pradhans) under Users
4. Go to Forms → New Form → Build survey
5. Activate the form (change status to Active)
6. Go to Forms → [form] → Assign → Select Gram Pradhan → Share link
7. Gram Pradhan shares link with villagers via WhatsApp
8. Villagers open link and fill form (works offline on mobile)
9. View responses under Forms → [form] → Responses
10. View leaderboard under Reports
