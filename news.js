/**
 * VeriFact — Live News Feed Module
 * ----------------------------------
 * Fetches real-time news from NewsAPI and renders an interactive
 * feed with category filters and one-click analyze functionality.
 */

const NEWS_API_KEY = 'aa3c72b5c6a749a593b495b0a50c20c4';
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Multiple CORS proxies — try each until one works
const CORS_PROXIES = [
    function (url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
    function (url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); },
    function (url) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url); },
    function (url) { return 'https://thingproxy.freeboard.io/fetch/' + url; }
];

const newsGrid = document.getElementById('news-grid');
const newsLoading = document.getElementById('news-loading');
const newsError = document.getElementById('news-error');
const categoryFiltersEl = document.getElementById('category-filters');
const languageFiltersEl = document.getElementById('language-filters');
const btnRefresh = document.getElementById('btn-refresh-news');
const btnRetry = document.getElementById('btn-retry-news');

let currentCategory = 'general';
let currentLang = 'en';
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
 * Maps NewsData.io results to the NewsAPI article format
 */
function mapNewsData(results) {
    if (!results) return [];
    return results.map(function (item) {
        return {
            title: item.title,
            url: item.link,
            description: item.description,
            urlToImage: item.image_url,
            publishedAt: item.pubDate,
            source: { name: item.source_id || 'NewsData' }
        };
    });
}

/**
 * Try fetching a URL through multiple CORS proxies
 */
async function fetchViaProxy(url) {
    // Attempt direct fetch first (works from localhost)
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' && data.articles && data.articles.length > 0) return data.articles;
            if (data.status === 'success' && data.results && data.results.length > 0) return mapNewsData(data.results);
        }
    } catch (e) {
        // CORS blocked — try proxies
    }

    // Try each CORS proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxyUrl = CORS_PROXIES[i](url);
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const text = await res.text();
                if (text.trim().startsWith('{')) {
                    const data = JSON.parse(text);
                    if (data.status === 'ok' && data.articles && data.articles.length > 0) return data.articles;
                    if (data.status === 'success' && data.results && data.results.length > 0) return mapNewsData(data.results);
                }
            }
        } catch (e) {
            // This proxy failed — try next
        }
    }

    return null;
}

/**
 * Fetch news from NewsAPI with multiple CORS proxy fallbacks
 */
async function fetchNews(category, lang) {
    // If language is Kannada, use the special NewsData API instead of NewsAPI
    if (lang === 'kn') {
        const query = category === 'general' ? '' : '&q=' + encodeURIComponent(category);
        const newsdataUrl = 'https://newsdata.io/api/1/latest?apikey=pub_39cbc54c45404b2684e33b692932588c&language=kn' + query;
        const result = await fetchViaProxy(newsdataUrl);
        if (result) return result;
        return null;
    }

    // Build the query
    let searchTerm = category === 'general' ? 'news' : category;

    // NewsAPI has limited support for Hindi (hi). We append native keywords for reliable results.
    let langParam = '';
    if (lang === 'hi') {
        searchTerm += ' समाचार'; // "news" in Hindi
    } else {
        langParam = '&language=en';
        searchTerm = category === 'general' ? 'world news today' : category;
    }

    // Use the "everything" endpoint to guarantee we get news, 
    // sorting by publishedAt to fetch the absolute latest articles.
    const url = NEWS_API_BASE + '/everything?q=' + encodeURIComponent(searchTerm) +
        '&sortBy=publishedAt&pageSize=12' + langParam + '&apiKey=' + NEWS_API_KEY;

    const result = await fetchViaProxy(url);
    if (result) return result;

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

    let imgHtml;
    if (article.urlToImage) {
        imgHtml = '<img class="news-card-img" src="' + escapeAttr(article.urlToImage) +
            '" alt="" loading="lazy" onerror="this.outerHTML=\'<div class=\\\'news-card-img no-image\\\'>\uD83D\uDCF0</div>\'">';
    } else {
        imgHtml = '<div class="news-card-img no-image">\uD83D\uDCF0</div>';
    }

    const source = (article.source && article.source.name) ? article.source.name : 'Unknown';
    const time = timeAgo(article.publishedAt);
    const rawTitle = article.title || 'Untitled';
    const cleanTitle = rawTitle.replace(/\s*-\s*[^-]+$/, '').trim();
    const desc = article.description || '';
    const analyzeContent = cleanTitle + (desc ? '. ' + desc : '');

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

            const input = document.getElementById('news-input');
            const counter = document.getElementById('char-count');

            input.value = text;
            counter.textContent = text.length + ' character' + (text.length !== 1 ? 's' : '');

            document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    const cacheKey = currentCategory + '-' + currentLang;

    showNewsLoading();
    btnRefresh.classList.add('spinning');

    const articles = await fetchNews(currentCategory, currentLang);

    btnRefresh.classList.remove('spinning');

    if (articles && articles.length > 0) {
        newsCache[cacheKey] = { data: articles, ts: Date.now() };
        showNewsGrid(articles);
    } else {
        showNewsError();
    }
}

// ===== Event Listeners =====

categoryFiltersEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    categoryFiltersEl.querySelectorAll('.category-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    loadNews(btn.getAttribute('data-category'));
});

if (languageFiltersEl) {
    languageFiltersEl.addEventListener('click', function (e) {
        const btn = e.target.closest('.lang-btn');
        if (!btn) return;

        languageFiltersEl.querySelectorAll('.lang-btn').forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        currentLang = btn.getAttribute('data-lang');
        loadNews(currentCategory);
    });
}

btnRefresh.addEventListener('click', function () {
    const cacheKey = currentCategory + '-' + currentLang;
    delete newsCache[cacheKey];
    loadNews(currentCategory);
});

btnRetry.addEventListener('click', function () {
    const cacheKey = currentCategory + '-' + currentLang;
    delete newsCache[cacheKey];
    loadNews(currentCategory);
});

// ===== Auto-load news on page load =====
loadNews('general');

// ===== Auto-refresh every 5 minutes =====
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
let refreshTimer = null;

function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(function () {
        const cacheKey = currentCategory + '-' + currentLang;
        delete newsCache[cacheKey];
        loadNews(currentCategory);
    }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

startAutoRefresh();

// Pause when tab is hidden, resume when visible
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        const cacheKey = currentCategory + '-' + currentLang;
        if (!newsCache[cacheKey] || (Date.now() - newsCache[cacheKey].ts >= AUTO_REFRESH_INTERVAL)) {
            delete newsCache[cacheKey];
            loadNews(currentCategory);
        }
        startAutoRefresh();
    }
});
