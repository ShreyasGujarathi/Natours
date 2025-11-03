# Security Notice

## 🔒 Credentials and Environment Variables

**IMPORTANT:** This repository does NOT contain any real credentials or sensitive information.

### What's Safe:
- ✅ `.env` file is in `.gitignore` and **never committed**
- ✅ All actual credentials are stored locally in `.env` (not in repository)
- ✅ No hardcoded passwords, API keys, or database URLs in source code
- ✅ Documentation files only contain **placeholder examples**

### What GitHub Detects:
GitHub's security scanner may flag documentation files that contain **example** MongoDB connection strings. These are just templates/placeholders, NOT real credentials.

**Example pattern detected (safe - these are placeholders):**
```
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/natours
```

### How to Use This Repository Safely:

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Create your own `.env` file** locally with your actual credentials:
   ```bash
   cp .env.example .env
   # Then edit .env with your REAL credentials
   ```
3. **For production** (Render, Heroku, etc.):
   - Add environment variables through the platform's dashboard
   - Never put real credentials in code or documentation

### If You See Warnings:
If GitHub shows a warning about exposed credentials:
- ✅ Check that `.env` is not committed (`git status` should not show `.env`)
- ✅ Verify no real credentials are in any `.md` files (only placeholders)
- ✅ All source code uses `process.env.VARIABLE_NAME` (no hardcoded values)

### Your Actual Credentials:
- Store in `.env` file (local development)
- Store in Render/Heroku environment variables (production)
- **NEVER commit to Git**

---

**All connection strings in documentation are examples only. Replace with your own credentials.**

