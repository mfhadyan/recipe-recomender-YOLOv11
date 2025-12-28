# Deployment Guide

This guide will walk you through deploying the AI Recipe Recommender application. Since the application consists of a Next.js frontend and a Python FastAPI backend with a large ML model, we'll deploy them separately:

- **Frontend**: Deploy on Vercel (native Next.js support)
- **Backend**: Deploy on a platform that supports Python and large files (Railway, Render, or Fly.io)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploying Frontend on Vercel](#deploying-frontend-on-vercel)
3. [Deploying Backend](#deploying-backend)
   - [Option 1: Railway (Recommended)](#option-1-railway-recommended)
   - [Option 2: Render](#option-2-render)
   - [Option 3: Fly.io](#option-3-flyio)
4. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ A GitHub account
- ✅ A Vercel account ([Sign up here](https://vercel.com/signup))
- ✅ A Gemini API key ([Get one here](https://ai.google.dev/))
- ✅ The custom YOLO model file (`my_model.pt`)
- ✅ Git installed on your local machine

> ⚠️ **Security Note**: Never commit your `.env` files or API keys to GitHub. Always use environment variables in your hosting platform's dashboard. Make sure `.env` and `.env.local` are in your `.gitignore` file.

---

## Deploying Frontend on Vercel

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Ensure `.gitignore` is properly configured** to exclude:
   - `node_modules/`
   - `.env` and `.env.local` files
   - `backend/venv/`
   - `__pycache__/`
   - `.next/`

### Step 2: Deploy to Vercel

#### Method 1: Using Vercel Dashboard (Recommended for beginners)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import your GitHub repository**:
   - Select your repository from the list
   - Click "Import"

4. **Configure the project**:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
   ```
   Replace `https://your-backend-url.com` with your actual backend URL (you'll get this after deploying the backend).

6. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

7. **Get your deployment URL**:
   - Once deployed, Vercel will provide you with a URL like: `https://your-app.vercel.app`
   - You can also set up a custom domain later

#### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (for first deployment)
   - Project name? Enter a name or press Enter for default
   - Directory? `./` (default)
   - Override settings? **No**

4. **Add environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   ```
   Enter your backend URL when prompted.

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

### Step 3: Verify Frontend Deployment

1. Visit your Vercel deployment URL
2. Check the browser console for any errors
3. Test that the frontend loads correctly

---

## Deploying Backend

Since the backend includes a large ML model (custom YOLO), we'll deploy it on a platform that supports Python applications with larger file sizes.

### Option 1: Railway (Recommended)

Railway is excellent for Python applications and handles large files well.

#### Step 1: Prepare Backend for Deployment

1. **Create a `Procfile` in the backend directory**:
   ```bash
   cd backend
   touch Procfile
   ```
   
   Add this content to `Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Create a `runtime.txt` file** (optional, to specify Python version):
   ```bash
   echo "python-3.9" > runtime.txt
   ```

3. **Create a `railway.json` or ensure `requirements.txt` is up to date**:
   Your `requirements.txt` should already be correct.

#### Step 2: Deploy on Railway

1. **Sign up for Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create a New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure the Service**:
   - Railway will auto-detect Python
   - **Root Directory**: Set to `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables**:
   Click on your service → Variables tab → Add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   PORT=8000
   ```

5. **Upload Model File**:
   - Option A: Commit `my_model.pt` to your repository (if it's not too large)
   - Option B: Use Railway's volume feature to upload the file
   - Option C: Download the model on first startup (modify `model.py` to download if not found)

6. **Deploy**:
   - Railway will automatically deploy
   - Wait for the build to complete
   - Get your backend URL from the service settings (e.g., `https://your-app.up.railway.app`)

#### Step 3: Update Frontend Environment Variable

1. Go back to Vercel dashboard
2. Update `NEXT_PUBLIC_API_BASE_URL` to your Railway backend URL
3. Redeploy the frontend

---

### Option 2: Render

Render is another great option for Python applications.

#### Step 1: Prepare Backend

1. **Create `render.yaml` in the project root**:
   ```yaml
   services:
     - type: web
       name: recipe-recommender-api
       env: python
       buildCommand: pip install -r backend/requirements.txt
       startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: GEMINI_API_KEY
           sync: false
         - key: ALLOWED_ORIGINS
           value: https://your-frontend-url.vercel.app
   ```

#### Step 2: Deploy on Render

1. **Sign up for Render**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**:
   - **Name**: `recipe-recommender-api`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty (or set to `backend`)

4. **Add Environment Variables**:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL
   - `PORT`: `8000` (Render sets this automatically)

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Get your backend URL (e.g., `https://recipe-recommender-api.onrender.com`)

---

### Option 3: Fly.io

Fly.io is great for global deployment and supports large files.

#### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

#### Step 2: Prepare Backend

1. **Create `fly.toml` in the backend directory**:
   ```toml
   app = "recipe-recommender-api"
   primary_region = "iad"

   [build]

   [env]
     PORT = "8000"

   [[services]]
     internal_port = 8000
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.http_checks]]
       interval = "10s"
       timeout = "2s"
       grace_period = "5s"
       method = "GET"
       path = "/health"
   ```

2. **Create `Dockerfile` in the backend directory**:
   ```dockerfile
   FROM python:3.9-slim

   WORKDIR /app

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       build-essential \
       && rm -rf /var/lib/apt/lists/*

   # Copy requirements and install Python dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy application code
   COPY . .

   # Expose port
   EXPOSE 8000

   # Run the application
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

#### Step 3: Deploy on Fly.io

1. **Login to Fly.io**:
   ```bash
   fly auth login
   ```

2. **Initialize the app**:
   ```bash
   cd backend
   fly launch
   ```
   
   Follow the prompts:
   - App name: Enter a name or press Enter
   - Region: Select closest region
   - Create database? No
   - Deploy now? Yes

3. **Set environment variables**:
   ```bash
   fly secrets set GEMINI_API_KEY=your_gemini_api_key_here
   fly secrets set ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Get your backend URL**:
   ```bash
   fly info
   ```
   Your URL will be: `https://your-app-name.fly.dev`

---

## Connecting Frontend to Backend

After deploying both services:

1. **Update Vercel Environment Variable**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_BASE_URL` with your backend URL
   - Redeploy the frontend

2. **Update Backend CORS**:
   - Update `ALLOWED_ORIGINS` in your backend environment variables
   - Include your Vercel frontend URL
   - Restart the backend service

3. **Test the Connection**:
   - Visit your Vercel frontend URL
   - Try uploading an image and generating recipes
   - Check browser console and network tab for errors

---

## Post-Deployment Checklist

- [ ] Frontend deployed on Vercel and accessible
- [ ] Backend deployed and health check endpoint works (`/health`)
- [ ] Environment variables set correctly on both services
- [ ] CORS configured to allow frontend domain
- [ ] Frontend can communicate with backend API
- [ ] Image upload and recipe generation works
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active (automatic on Vercel and most platforms)

---

## Troubleshooting

### Frontend Issues

**Problem: Frontend shows "Failed to fetch" or CORS errors**
- **Solution**: 
  1. Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel
  2. Verify backend `ALLOWED_ORIGINS` includes your Vercel URL
  3. Ensure backend is running and accessible

**Problem: Build fails on Vercel**
- **Solution**:
  1. Check build logs in Vercel dashboard
  2. Ensure all dependencies are in `package.json`
  3. Verify Node.js version compatibility

### Backend Issues

**Problem: Backend fails to start**
- **Solution**:
  1. Check logs in your hosting platform
  2. Verify all environment variables are set
  3. Ensure `requirements.txt` is correct
  4. Check that model file (`my_model.pt`) is accessible

**Problem: Model file not found**
- **Solution**:
  1. Ensure `my_model.pt` is committed to repository (if small enough)
  2. Or use a volume/storage service to host the model
  3. Or modify code to download model on first startup

**Problem: Timeout errors**
- **Solution**:
  1. Increase timeout settings on your hosting platform
  2. Optimize model loading (use caching)
  3. Consider using a faster model variant

### General Issues

**Problem: API calls are slow**
- **Solution**:
  1. Check backend logs for bottlenecks
  2. Consider adding caching
  3. Optimize image processing
  4. Use a CDN for static assets

**Problem: Environment variables not working**
- **Solution**:
  1. Ensure variables are set in the correct environment (production)
  2. Restart services after adding variables
  3. Check variable names match exactly (case-sensitive)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Fly.io Documentation](https://fly.io/docs)

---

## Next Steps

After successful deployment:

1. **Set up custom domains** for both frontend and backend
2. **Configure monitoring** and error tracking (e.g., Sentry)
3. **Set up CI/CD** for automatic deployments
4. **Add analytics** to track usage
5. **Optimize performance** based on real-world usage

---

## Support

If you encounter issues not covered in this guide, please:
1. Check the logs on both platforms
2. Review the troubleshooting section
3. Check platform-specific documentation
4. Open an issue in your repository

