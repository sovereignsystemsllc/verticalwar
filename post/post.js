import '../src/style.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    const loadingMsg = document.getElementById('loading-msg');
    const errorMsg = document.getElementById('error-msg');
    const articleContainer = document.getElementById('article-container');

    const articleTitle = document.getElementById('article-display-title');
    const articleSubtitle = document.getElementById('article-display-subtitle');
    const articleSeries = document.getElementById('article-series');
    const articleDate = document.getElementById('article-date');
    const articleContent = document.getElementById('article-content');

    if (!articleId) {
        showError();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !data) {
            console.error('Error fetching article:', error);
            showError();
            return;
        }

        // Render the article metadata
        articleTitle.textContent = data.title;
        articleSeries.textContent = data.series || 'UNCLASSIFIED';

        if (data.subtitle) {
            articleSubtitle.textContent = data.subtitle;
            articleSubtitle.classList.remove('hidden');
        }

        const dateObj = new Date(data.created_at);
        articleDate.textContent = 'DATE: ' + dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).toUpperCase();

        // Render the HTML content
        articleContent.innerHTML = data.content_html;

        // Ensure title matches metadata for SEO
        document.title = `${data.title} // THE CODEX`;

        // Hide loading, show content
        loadingMsg.classList.add('hidden');
        articleContainer.classList.remove('hidden');
        articleContainer.classList.add('flex', 'flex-col');

    } catch (err) {
        console.error('Unexpected error:', err);
        showError();
    }

    function showError() {
        loadingMsg.classList.add('hidden');
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('flex');
    }
});
