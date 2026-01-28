# Setup Guide for Letter Submission System

This guide will help you set up the letter submission system that creates GitHub pull requests automatically.

## Prerequisites

1. A GitHub repository (already created: https://github.com/reasonandrage/reasonandrage.org)
2. A Cloudflare account with Pages enabled
3. A GitHub Personal Access Token

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Reason and Rage Submission Bot"
4. Select the `repo` scope (this gives full repository access)
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again!

## Step 2: Connect Repository to Cloudflare Pages

1. Push this code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add letter submission system"
   git push origin main
   ```

2. Go to Cloudflare Dashboard → Workers & Pages → Create a project
3. Click "Connect to Git"
4. Select your GitHub account and the `reasonandrage/reasonandrage.org` repository
5. Click "Begin setup"

## Step 3: Configure Build Settings

1. **Framework preset**: None
2. **Build command**: (leave empty)
3. **Build output directory**: `/` (root directory)
4. Click "Save and Deploy"

## Step 4: Add Environment Variables

1. In your Cloudflare Pages project, go to Settings → Environment variables
2. Add the following variables:

   **Production:**
   - `GITHUB_TOKEN`: (paste your GitHub token from Step 1)
   - `GITHUB_OWNER`: `reasonandrage` (optional, this is the default)
   - `GITHUB_REPO`: `reasonandrage.org` (optional, this is the default)

3. Click "Save"

## Step 5: Connect Your Domain

1. In Cloudflare Dashboard → Workers & Pages → Your project
2. Go to the "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter `reasonandrage.org`
5. Cloudflare will automatically configure DNS and SSL

## Testing the Submission System

1. Visit your site at `reasonandrage.org/submit.html`
2. Fill out the form with a test letter
3. Submit it
4. Check your GitHub repository - you should see a new pull request
5. Review and merge the PR
6. The site should automatically redeploy with the new letter

## Troubleshooting

### "GitHub token not configured" error
- Make sure you added `GITHUB_TOKEN` to your Cloudflare Pages environment variables
- Ensure the token has the `repo` scope

### "Failed to fetch index.html" error
- Verify the repository name is correct in environment variables
- Check that the token has access to the repository

### Pull request not created
- Check Cloudflare Pages Function logs in the dashboard
- Verify the GitHub token has `repo` permissions
- Make sure the repository exists and is accessible

## How It Works

1. User submits a letter via the form on `/submit.html`
2. The form sends a POST request to `/api/submit`
3. The Cloudflare Pages Function (`functions/api/submit.js`) processes the request:
   - Converts markdown to HTML
   - Creates a new branch in GitHub
   - Updates `index.html` with the new letter
   - Creates a pull request
4. You review and merge the PR
5. Cloudflare Pages automatically redeploys the site

## Security Notes

- The GitHub token is stored securely in Cloudflare environment variables
- Only users with access to your Cloudflare account can modify the token
- Consider using a GitHub App instead of a personal token for better security (advanced)
