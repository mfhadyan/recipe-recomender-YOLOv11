# Quick Deployment Reference

This is a quick reference guide. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🚀 Quick Deploy Steps

### 1. Frontend (Vercel) - 5 minutes

```bash
# Option 1: Via Dashboard
1. Go to vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repo
4. Add env var: NEXT_PUBLIC_API_BASE_URL (set after backend deploy)
5. Deploy

# Option 2: Via CLI
npm i -g vercel
vercel login
vercel
vercel env add NEXT_PUBLIC_API_BASE_URL
vercel --prod
```

### 2. Backend (Railway) - 10 minutes

```bash
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Set Root Directory: backend
4. Add env vars:
   - GEMINI_API_KEY=your_key
   - ALLOWED_ORIGINS=https://your-frontend.vercel.app
5. Deploy
```

### 3. Connect Them

1. Copy backend URL from Railway
2. Update `NEXT_PUBLIC_API_BASE_URL` in Vercel
3. Update `ALLOWED_ORIGINS` in Railway with Vercel URL
4. Redeploy both

## 📋 Environment Variables Checklist

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_BASE_URL` = your backend URL

### Backend (Railway/Render/Fly.io)
- [ ] `GEMINI_API_KEY` = your Gemini API key
- [ ] `ALLOWED_ORIGINS` = your Vercel frontend URL

## 🔗 URLs to Save

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app` (or similar)
- Backend Health: `https://your-backend.railway.app/health`
- Backend Docs: `https://your-backend.railway.app/docs`

## ✅ Post-Deploy Test

1. Visit frontend URL
2. Upload an image
3. Check browser console for errors
4. Verify recipes are generated

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Check `ALLOWED_ORIGINS` includes frontend URL |
| 404 on API calls | Verify `NEXT_PUBLIC_API_BASE_URL` is correct |
| Backend won't start | Check logs, verify env vars are set |
| Model not found | Ensure `my_model.pt` is in backend directory |

For detailed troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting).

