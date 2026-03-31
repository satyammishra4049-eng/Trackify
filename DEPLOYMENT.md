# Trackify - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. [Vercel Account](https://vercel.com/signup)
2. [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) (Free tier available)
3. Gmail account with App Password for email service

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Environment Variables

Create a `.env` file with these variables:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/trackifyDB?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Email Configuration (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password

# Optional: Mailtrap fallback
MAILTRAP_USER=your-mailtrap-user
MAILTRAP_PASS=your-mailtrap-pass

# Frontend URL (will be your Vercel URL)
FRONTEND_URL=https://your-project.vercel.app
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Copy the 16-character password

---

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Option B: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub/GitLab/Bitbucket repository
3. Select the **Trackify** project
4. Configure settings:
   - **Framework Preset:** Other
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add Environment Variables (copy from your `.env` file):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `FRONTEND_URL`

6. Click **Deploy**

---

### Step 3: Set Up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Get your connection string
4. Replace `username`, `password`, and `cluster` in the MONGO_URI

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/trackifyDB?retryWrites=true&w=majority
```

---

### Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Update `FRONTEND_URL` environment variable with your domain
5. Redeploy the project

---

## 🔧 Post-Deployment Configuration

### Update CORS Origins

After deployment, update `server/app.ts` to add your production URL:

```typescript
const allowedOrigins = [
  'http://localhost:5002',
  'https://your-project.vercel.app', // Add your Vercel URL
];
```

Or add it as an environment variable `VERCEL_URL` which is automatically set by Vercel.

---

## 🧪 Testing Your Deployment

### Test API Endpoints:

```bash
# Test health endpoint
curl https://your-project.vercel.app/api/health

# Test forgot password (should send email)
curl -X POST https://your-project.vercel.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Email Service:

Visit: `https://your-project.vercel.app/api/auth/test-email`

---

## 🐛 Troubleshooting

### Issue: 404 Not Found
- Check that `vercel.json` routes are correct
- Ensure `api/index.ts` exists

### Issue: CORS Errors
- Add your Vercel URL to `allowedOrigins` in `server/app.ts`
- Redeploy after changes

### Issue: Database Connection Failed
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)

### Issue: Emails Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Check Gmail App Password (not your regular password)
- Check server logs in Vercel Dashboard

---

## 📁 Project Structure for Vercel

```
Trackify/
├── api/
│   └── index.ts          # Serverless API handler
├── server/
│   ├── app.ts            # Express app
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
├── src/                  # Frontend React app
├── dist/                 # Build output (generated)
├── vercel.json           # Vercel configuration
├── package.json
└── vite.config.ts
```

---

## 🔒 Security Checklist

- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] Use Gmail App Password (not regular password)
- [ ] Restrict MongoDB Atlas IP whitelist in production
- [ ] Enable MongoDB auto-expire for OTPs
- [ ] Use HTTPS in production (Vercel provides this)
- [ ] Set `NODE_ENV=production`

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833

---

## 🎉 Success!

Your Trackify app should now be live on Vercel! 🚀

Visit your Vercel dashboard to monitor deployments and logs.
