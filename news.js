/**
 * VeriFact — Live News Feed Module
 * ----------------------------------
 * Fetches real-time news from NewsAPI and renders an interactive
 * feed with category filters and one-click analyze functionality.
 */

const NEWS_API_KEY = 'aa3c72b5c6a749a593b495b0a50c20c4';
const NEWS_API_BASE = 'https://newsapi.org/v2';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const newsGrid = document.getElementById('news-grid');
const newsLoading = document.getElementById('news-loading');
const newsError = document.getElementById('news-error');
const categoryFiltersEl = document.getElementById('category-filters');
const btnRefresh = document.getElementById('btn-refresh-news');
const btnRetry = document.getElementById('btn-retry-news');

let currentCategory = 'general';
let newsCache = {};

/**
 * Format a date string into a human-readable "time ago" format
 */
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const dt = new Date(dateStr);
    const now = new Date();
    const diffMs = now - dt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    if (diffHr < 24) return diffHr + 'h ago';
    if (diffDay < 7) return diffDay + 'd ago';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Fetch news from NewsAPI with CORS proxy fallback
 */
async function fetchNews(category) {
    const topHeadlinesUrl = NEWS_API_BASE + '/top-headlines?country=us&category=' + category + '&pageSize=12&apiKey=' + NEWS_API_KEY;

    // Attempt 1: Direct fetch (works from localhost)
    try {
        const res = await fetch(topHeadlinesUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' && data.articles && data.articles.length > 0) return data.articles;
        }
    } catch (e) {
        // CORS blocked — fall through to proxy
    }

    // Attempt 2: CORS proxy
    try {
        const proxyUrl = CORS_PROXY + encodeURIComponent(topHeadlinesUrl);
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' && data.articles && data.articles.length > 0) return data.articles;
        }
    } catch (e) {
        // Proxy also failed — try alternative endpoint
    }

    // Attempt 3: "everything" endpoint via proxy
    try {
        const searchTerm = category === 'general' ? 'world news today' : category;
        const altUrl = NEWS_API_BASE + '/everything?q=' + encodeURIComponent(searchTerm) + '&sortBy=publishedAt&pageSize=12&language=en&apiKey=' + NEWS_API_KEY;
        const proxyUrl = CORS_PROXY + encodeURIComponent(altUrl);
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' && data.articles && data.articles.length > 0) return data.articles;
        }
    } catch (e) {
        // All attempts failed
    }

    return null;
}

/**
 * Escape HTML entities for safe rendering
 */
function escapeHtml(str) {
    const el = document.createElement('div');
    el.textContent = str || '';
    return el.innerHTML;
}

/**
 * Escape string for use in data-* attributes
 */
function escapeAttr(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Build a single news card element
 */
function createNewsCard(article, index) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.style.animationDelay = (index * 0.08) + 's';

    // Image
    let imgHtml;
    if (article.urlToImage) {
        imgHtml = '<img class="news-card-img" src="' + escapeAttr(article.urlToImage) +
            '" alt="" loading="lazy" onerror="this.outerHTML=\'<div class=\\\'news-card-img no-image\\\'>\uD83D\uDCF0</div>\'">';
    } else {
        imgHtml = '<div class="news-card-img no-image">\uD83D\uDCF0</div>';
    }

    // Meta
    const source = (article.source && article.source.name) ? article.source.name : 'Unknown';
    const time = timeAgo(article.publishedAt);

    // Title (strip " - SourceName" suffix that NewsAPI sometimes appends)
    const rawTitle = article.title || 'Untitled';
    const cleanTitle = rawTitle.replace(/\s*-\s*[^-]+$/, '').trim();

    // Description
    const desc = article.description || '';

    // Text to send to the analyzer
    const analyzeContent = cleanTitle + (desc ? '. ' + desc : '');

    // Read more link
    let readLink = '';
    if (article.url) {
        readLink = '<a class="btn-read-more" href="' + escapeAttr(article.url) +
            '" target="_blank" rel="noopener noreferrer">Read \u2197</a>';
    }

    card.innerHTML =
        imgHtml +
        '<div class="news-card-body">' +
        '<div class="news-card-meta">' +
        '<span class="news-source">' + escapeHtml(source) + '</span>' +
        '<span class="news-time">' + time + '</span>' +
        '</div>' +
        '<div class="news-card-title">' + escapeHtml(cleanTitle) + '</div>' +
        '<div class="news-card-desc">' + escapeHtml(desc) + '</div>' +
        '<div class="news-card-actions">' +
        '<button class="btn-analyze-news" data-text="' + escapeAttr(analyzeContent) + '">' +
        '\uD83D\uDD0D Analyze This' +
        '</button>' +
        readLink +
        '</div>' +
        '</div>';

    return card;
}

/**
 * UI state functions
 */
function showNewsLoading() {
    newsLoading.classList.remove('hidden');
    newsError.classList.add('hidden');
    newsGrid.classList.add('hidden');
}

function showNewsError() {
    newsLoading.classList.add('hidden');
    newsError.classList.remove('hidden');
    newsGrid.classList.add('hidden');
}

function showNewsGrid(articles) {
    newsLoading.classList.add('hidden');
    newsError.classList.add('hidden');
    newsGrid.classList.remove('hidden');
    newsGrid.innerHTML = '';

    // Filter out removed articles
    const filtered = articles.filter(function (a) {
        return a.title && a.title !== '[Removed]';
    });

    if (filtered.length === 0) {
        showNewsError();
        return;
    }

    filtered.forEach(function (article, i) {
        newsGrid.appendChild(createNewsCard(article, i));
    });

    // Attach "Analyze This" click handlers
    newsGrid.querySelectorAll('.btn-analyze-news').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const text = btn.getAttribute('data-text');
            if (!text) return;

            // Reference the analyzer's textarea from the main app.js
            const input = document.getElementById('news-input');
            const counter = document.getElementById('char-count');

            input.value = text;
            counter.textContent = text.length + ' character' + (text.length !== 1 ? 's' : '');

            // Scroll to analyzer section
            document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Flash the textarea to draw attention
            input.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)';
            setTimeout(function () { input.style.boxShadow = ''; }, 1500);
        });
    });
}

/**
 * Main function to load news for a given category
 */
async function loadNews(category) {
    currentCategory = category || 'general';

    // Check cache (valid for 5 minutes)
    if (newsCache[currentCategory] && (Date.now() - newsCache[currentCategory].ts < 300000)) {
        showNewsGrid(newsCache[currentCategory].data);
        return;
    }

    showNewsLoading();
    btnRefresh.classList.add('spinning');

    const articles = await fetchNews(currentCategory);

    btnRefresh.classList.remove('spinning');

    if (articles && articles.length > 0) {
        newsCache[currentCategory] = { data: articles, ts: Date.now() };
        showNewsGrid(articles);
    } else {
        showNewsError();
    }
}

// ===== Event Listeners =====

// Category filter buttons
categoryFiltersEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    categoryFiltersEl.querySelectorAll('.category-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    loadNews(btn.getAttribute('data-category'));
});

// Refresh button
btnRefresh.addEventListener('click', function () {
    delete newsCache[currentCategory];
    loadNews(currentCategory);
});

// Retry button
btnRetry.addEventListener('click', function () {
    delete newsCache[currentCategory];
    loadNews(currentCategory);
});

// ===== Auto-load news on page load =====
loadNews('general');

// ===== Auto-refresh every 5 minutes =====
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let refreshTimer = null;

function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(function () {
        // Clear cache so we get fresh data
        delete newsCache[currentCategory];
        loadNews(currentCategory);
    }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Start the auto-refresh timer
startAutoRefresh();

// Pause auto-refresh when tab is hidden, resume when visible
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        // Refresh immediately if cache is stale, then restart timer
        if (!newsCache[currentCategory] || (Date.now() - newsCache[currentCategory].ts >= AUTO_REFRESH_INTERVAL)) {
            delete newsCache[currentCategory];
            loadNews(currentCategory);
        }
        startAutoRefresh();
    }
});
