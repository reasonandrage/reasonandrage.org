// Cloudflare Pages Function to handle letter submissions and create GitHub PRs

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a list item
    if (line.match(/^[-*]\s+(.+)$/)) {
      const listContent = line.replace(/^[-*]\s+/, '');
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      // Process inline formatting
      let processedContent = listContent;
      processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processedContent = processedContent.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
      result.push(`<li>${processedContent}</li>`);
    } else {
      // Close list if we were in one
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      
      // Process paragraph (skip empty lines)
      if (line) {
        let processedLine = line;
        // Process inline formatting
        processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processedLine = processedLine.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
        result.push(`<p>${processedLine}</p>`);
      }
    }
  }
  
  // Close list if still open
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

// Generate HTML for the letter
function generateLetterHTML(title, date, content) {
  // Format date as M/D/YY to match existing format
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear().toString().slice(-2);
  const formattedDate = `${month}/${day}/${year}`;
  const htmlContent = markdownToHtml(content);
  
  return `            <article class="letter">
                <h2>${escapeHtml(title)}</h2>
                <p class="date">Date: ${formattedDate}</p>
                <div class="letter-content">
${htmlContent.split('\n').map(line => '                    ' + line).join('\n')}
                </div>
            </article>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Generate a branch name from title
function generateBranchName(title) {
  return 'letter-' + title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Date.now().toString().slice(-6);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const { title, date, content } = data;

    if (!title || !date || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get GitHub token from environment variables
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const GITHUB_OWNER = env.GITHUB_OWNER || 'reasonandrage';
    const GITHUB_REPO = env.GITHUB_REPO || 'reasonandrage.org';

    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: 'GitHub token not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read current index.html
    const indexUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/index.html`;
    const indexResponse = await fetch(indexUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch index.html: ${indexResponse.statusText}`);
    }

    const indexData = await indexResponse.json();
    const currentContent = atob(indexData.content.replace(/\n/g, ''));
    const currentSha = indexData.sha;

    // Find where to insert the new letter (after the opening of <section class="letters">)
    const lettersSectionStart = currentContent.indexOf('<section class="letters">');
    if (lettersSectionStart === -1) {
      throw new Error('Could not find letters section in index.html');
    }

    // Find the first </article> tag after the section starts
    const firstArticleEnd = currentContent.indexOf('</article>', lettersSectionStart);
    if (firstArticleEnd === -1) {
      throw new Error('Could not find article structure in index.html');
    }

    // Insert new letter after the first article
    const insertPosition = firstArticleEnd + '</article>'.length;
    const newLetterHTML = '\n\n' + generateLetterHTML(title, date, content);
    const newContent = currentContent.slice(0, insertPosition) + newLetterHTML + currentContent.slice(insertPosition);

    // Create a new branch
    const branchName = generateBranchName(title);
    
    // Get the default branch (usually 'main' or 'master')
    const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    // Get the SHA of the default branch
    const refResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${defaultBranch}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const refData = await refResponse.json();
    const baseSha = refData.object.sha;

    // Create new branch
    await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });

    // Update index.html in the new branch
    const updateResponse = await fetch(indexUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add letter: ${title}`,
        content: btoa(newContent),
        sha: currentSha,
        branch: branchName
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update file: ${errorData.message || updateResponse.statusText}`);
    }

    // Create pull request
    const prResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Add letter: ${title}`,
        head: branchName,
        base: defaultBranch,
        body: `Letter submitted via website.\n\n**Title:** ${title}\n**Date:** ${date}\n\nThis PR will be reviewed before merging.`
      })
    });

    if (!prResponse.ok) {
      const errorData = await prResponse.json();
      throw new Error(`Failed to create PR: ${errorData.message || prResponse.statusText}`);
    }

    const prData = await prResponse.json();

    return new Response(JSON.stringify({
      success: true,
      pr_url: prData.html_url,
      pr_number: prData.number
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing submission:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred while processing your submission'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
