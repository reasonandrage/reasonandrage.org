# Reason and Rage

A website for publishing letters to Congress in response to current events. Visitors can submit their own letters, which are reviewed and published after approval.

## Submitting a Letter

You can submit your own letter to Congress through our website:

1. Visit the [Submit a Letter](submit.html) page
2. Fill in the form with:
   - **Title**: A clear, descriptive title for your letter
   - **Date**: The date of your letter
   - **Content**: Write your letter using the editor
3. Use the formatting toolbar to add:
   - **Bold text** for emphasis
   - *Italic text* for subtle emphasis
   - Bullet lists for action items
4. Click "Submit Letter" to create a pull request on GitHub
5. Your letter will be reviewed before being published on the site

### Formatting Tips

- Use `**text**` for **bold** or click the "B" button
- Use `*text*` for *italic* or click the "I" button  
- Use `- item` for bullet lists or click the "• List" button
- Press Enter twice to create a new paragraph

## How It Works

When you submit a letter:
1. A pull request is automatically created on our GitHub repository
2. The letter is reviewed for appropriateness and clarity
3. If approved, the PR is merged and the site automatically redeploys
4. Your letter appears on the main page

## For Maintainers

### Reviewing Submissions

1. Check the [GitHub repository](https://github.com/reasonandrage/reasonandrage.org) for new pull requests
2. Review the letter content
3. If approved, merge the PR
4. Cloudflare Pages will automatically redeploy the site

### Manual Letter Addition

If you need to add a letter manually:

1. Open `index.html`
2. Copy an existing `<article class="letter">` block
3. Paste it after the first letter (newest letters go at the top)
4. Update:
   - The `<h2>` tag for the title
   - The date in `<p class="date">`
   - The content in `<div class="letter-content">`
5. Commit and push to trigger automatic deployment

### Customizing Styling

Edit `styles.css` to change colors, fonts, spacing, etc.

## Deployment

This site is deployed on Cloudflare Pages and automatically redeploys when changes are pushed to the main branch.

### Setting Up Cloudflare Pages

1. Push this code to your Git repository
2. Go to Cloudflare Dashboard → Workers & Pages → Create a project
3. Connect your Git repository
4. Build settings:
   - **Framework preset**: None (or Static)
   - **Build command**: (leave empty)
   - **Build output directory**: `/` (root)
5. Add environment variables:
   - `GITHUB_TOKEN`: A GitHub personal access token with repo permissions
   - `GITHUB_OWNER`: Your GitHub username (default: `reasonandrage`)
   - `GITHUB_REPO`: Repository name (default: `reasonandrage.org`)
6. Click "Save and Deploy"

### Connecting Your Domain

1. In Cloudflare Dashboard → Workers & Pages → Your project
2. Go to Custom domains tab
3. Click "Add a custom domain"
4. Enter your domain (e.g., `reasonandrage.org`)
5. Cloudflare will automatically configure DNS and SSL

## Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve
```

Then visit `http://localhost:8000`

## Environment Variables

For the submission API to work, you need to set these in Cloudflare Pages:

- `GITHUB_TOKEN`: GitHub personal access token with `repo` scope
- `GITHUB_OWNER`: GitHub username (optional, defaults to `reasonandrage`)
- `GITHUB_REPO`: Repository name (optional, defaults to `reasonandrage.org`)

To create a GitHub token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Select `repo` scope
4. Copy the token and add it to Cloudflare Pages environment variables
