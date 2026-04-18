import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function prerender() {
  console.log('[PRERENDER] Starting OG tag generation...');

  const distDir = path.join(__dirname, 'dist');
  const postDistHtml = path.join(distDir, 'post', 'index.html');
  const indexDistHtml = path.join(distDir, 'codex', 'index.html');

  if (!fs.existsSync(postDistHtml) || !fs.existsSync(indexDistHtml)) {
    console.error(`[PRERENDER] Missing HTML files in /dist. Did Vite build successfully?`);
    process.exit(1);
  }

  const postHtmlTemplate = fs.readFileSync(postDistHtml, 'utf-8');
  const indexHtmlTemplate = fs.readFileSync(indexDistHtml, 'utf-8');

  // 1. Fetch data
  const { data: articles, error: errA } = await supabase.from('articles').select('id, title, subtitle, thumbnail_url, content_html, hidden');
  const { data: series, error: errS } = await supabase.from('series').select('id, title, hidden, category_label');

  if (errA || errS) {
    console.error('[PRERENDER] DB fetch error:', errA || errS);
    process.exit(1);
  }

  // 2. Process Articles
  let articleCount = 0;
  for (const article of articles || []) {
    // Only generate pages for non-hidden articles unless we want hidden available via direct link
    // Generating them anyway is fine; crawling still needs absolute URLs
    const articleDir = path.join(distDir, 'post', article.id);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    let modifiedHtml = postHtmlTemplate
      .replace(
        /<title>.*?<\/title>/,
        `<title>${article.title} // THE CODEX</title>`
      )
      .replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${article.title}">`
      )
      .replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="https://verticalwar.com/post/${article.id}/">`
      );

    if (article.subtitle) {
      modifiedHtml = modifiedHtml
        .replace(
          /<meta name="description" content="[^"]*">/,
          `<meta name="description" content="${article.subtitle}">`
        )
        .replace(
          /<meta property="og:description" content="[^"]*">/,
          `<meta property="og:description" content="${article.subtitle}">`
        );
    }

    let imageToUse = article.thumbnail_url;
    if (!imageToUse && article.content_html) {
      const imgMatch = article.content_html.match(/<img[^>]+src=["']([^">]+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageToUse = imgMatch[1];
      }
    }

    if (imageToUse) {
      modifiedHtml = modifiedHtml
        .replace(
          /<meta property="og:image" content="[^"]*">/,
          `<meta property="og:image" content="${imageToUse}">`
        )
        .replace(
          /<meta name="twitter:image" content="[^"]*">/,
          `<meta name="twitter:image" content="${imageToUse}">`
        );
    }

    fs.writeFileSync(path.join(articleDir, 'index.html'), modifiedHtml);
    articleCount++;
  }

  // 3. Process Series
  let seriesCount = 0;
  for (const s of series || []) {
    if (s.title === '[HEADING ONLY]') continue;
    
    const slug = slugify(s.title);
    const seriesDir = path.join(distDir, 'series', slug);
    if (!fs.existsSync(seriesDir)) {
      fs.mkdirSync(seriesDir, { recursive: true });
    }

    let modifiedHtml = indexHtmlTemplate
      .replace(
        /<title>.*?<\/title>/,
        `<title>${s.title} // THE CODEX</title>`
      )
      .replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${s.title} | Sovereign Series">`
      )
      .replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="Explore the ${s.title} archives inside the Sovereign Codex.">`
      )
      .replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="https://verticalwar.com/series/${slug}/">`
      );

    // If series has a specific image logic later, could inject here.
    
    fs.writeFileSync(path.join(seriesDir, 'index.html'), modifiedHtml);
    seriesCount++;
  }

  console.log(`[PRERENDER] Successfully generated HTML for ${articleCount} articles and ${seriesCount} series.`);
}

prerender().catch(err => {
  console.error('[PRERENDER] Fatal error:', err);
  process.exit(1);
});
