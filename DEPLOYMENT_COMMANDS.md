# Deployment Commands Reference

## ✅ **Correct Way to Deploy/Run**

### **For Development (Running Locally)**

```bash
# Option 1: Run backend only
npm run dev:backend

# Option 2: Run full stack (frontend + backend)
npm run dev
```

This will:
- ✅ Start Convex dev server
- ✅ Watch for changes
- ✅ Auto-deploy when you save files
- ✅ Show logs in terminal

---

### **For Production Deployment**

```bash
# Don't use: npx convex deploy ❌
# Instead use:

npm run dev:backend -- --prod
```

---

## 🔑 **Adding Environment Variables**

### **Method 1: Convex Dashboard (Recommended)**

1. Go to: https://dashboard.convex.dev/
2. Select your project
3. Settings → Environment Variables
4. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** `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`
5. Click **Save**

### **Method 2: Command Line**

```bash
npx convex env set OPENROUTER_API_KEY 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
```

---

## ✅ **Verify Setup**

### **Check if deployment is ready:**

```powershell
# Wait ~30 seconds after starting dev:backend, then:
curl "https://accurate-marlin-326.convex.site/api/health"
```

### **Expected Response:**

```json
{
  "status": "ok",
  "environment": {
    "openRouterConfigured": true,
    "elevenLabsConfigured": false
  },
  "setup": [
    "✅ All API keys configured!"
  ]
}
```

---

## 🎥 **Start Webcam Demo**

Once the API health check shows `"openRouterConfigured": true`:

```bash
python scripts/livestream-monitor.py \
  --source 0 \
  --camera-id "k17ey5jcw89s6brn397x4gbp757v2bky" \
  --api-url "https://accurate-marlin-326.convex.site" \
  --interval 10 \
  --priority 10
```

---

## 🐛 **Troubleshooting**

### **Error: "Could not resolve convex/server"**

**Solution:** Use npm scripts instead of `npx convex`

```bash
# ❌ Don't use:
npx convex deploy

# ✅ Use:
npm run dev:backend
```

### **Error: "500 Internal Server Error"**

**Solution:** Add API key

1. Check health:
   ```bash
   curl https://accurate-marlin-326.convex.site/api/health
   ```

2. If `openRouterConfigured: false`, add key in dashboard

3. Restart dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev:backend
   ```

### **Error: "Cannot find module"**

**Solution:** Reinstall dependencies

```bash
npm install
npm run dev:backend
```

---

## 📋 **Current Status**

Your Convex dev server is now running! 

**Next steps:**

1. **Verify deployment** (wait ~30 seconds):
   ```bash
   curl "https://accurate-marlin-326.convex.site/api/health"
   ```

2. **If API key not set**, add it in dashboard:
   - https://dashboard.convex.dev/
   - Settings → Environment Variables
   - Add `OPENROUTER_API_KEY`

3. **Start webcam demo**:
   ```bash
   python scripts/livestream-monitor.py \
     --source 0 \
     --camera-id "k17ey5jcw89s6brn397x4gbp757v2bky" \
     --api-url "https://accurate-marlin-326.convex.site" \
     --interval 10
   ```

---

## 🎬 **For Your Demo**

Keep the Convex dev server running in the background, then:

1. Open dashboard: https://dashboard.convex.dev/
2. Start webcam monitor (command above)
3. Hold up signs with "SAFETY VIOLATION" or "ERROR"
4. Watch Agent Activity panel show ReAct workflow
5. Show judges the automatic ticket creation! 🚀

