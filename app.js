/**
 * VeriFact — AI Fake News Detection Engine
 * ------------------------------------------
 * Client-side heuristic analysis engine that examines text across
 * six dimensions to classify news as Real, Fake, or Uncertain.
 */

// ===== DOM Elements =====
const newsInput = document.getElementById('news-input');
const charCount = document.getElementById('char-count');
const btnAnalyze = document.getElementById('btn-analyze');
const btnClear = document.getElementById('btn-clear');
const resultsPlaceholder = document.getElementById('results-placeholder');
const resultsLoading = document.getElementById('results-loading');
const resultsContent = document.getElementById('results-content');
const loadingSteps = document.getElementById('loading-steps');
const verdictCard = document.getElementById('verdict-card');
const verdictIcon = document.getElementById('verdict-icon');
const verdictText = document.getElementById('verdict-text');
const verdictScore = document.getElementById('verdict-score');
const confidenceValue = document.getElementById('confidence-value');
const confidenceFill = document.getElementById('confidence-fill');
const breakdownItems = document.getElementById('breakdown-items');
const findingsList = document.getElementById('findings-list');

// ===== Keyword & Pattern Dictionaries =====

const SENSATIONAL_WORDS = [
  'breaking', 'shocking', 'shocked', 'unbelievable', 'mind-blowing', 'jaw-dropping',
  'incredible', 'explosive', 'bombshell', 'devastating', 'earth-shattering',
  'catastrophic', 'unprecedented', 'miraculous', 'terrifying', 'outrageous',
  'horrifying', 'stunning', 'insane', 'epic', 'massive', 'huge', 'enormous',
  'amazing', 'astounding', 'alarming', 'urgent', 'emergency', 'crisis',
  'scandal', 'conspiracy', 'coverup', 'cover-up', 'exposed', 'revealed',
  'secret', 'hidden', 'banned', 'suppressed', 'censored', 'leaked',
  'groundbreaking', 'immortal', 'cure', 'destroy', 'obliterate'
];

const CLICKBAIT_PHRASES = [
  "you won't believe", "what happened next", "doctors hate", "one weird trick",
  "this is why", "the truth about", "they don't want you to know",
  "doesn't want you to know", "don't want you to know",
  "exposed", "gone wrong", "goes viral", "is dead", "will shock you",
  "nobody is talking about", "the real reason", "before it's too late",
  "this changes everything", "you need to see this", "share before",
  "big pharma", "mainstream media won't tell you", "wake up",
  "you've been lied to", "the government doesn't want", "exposed the truth",
  "what they're hiding", "the elite don't want", "you won't believe what"
];

const EMOTIONAL_TRIGGERS = [
  'outrage', 'furious', 'disgusting', 'heartbreaking', 'terrified',
  'betrayed', 'enraged', 'appalled', 'sickening', 'devastating',
  'shameful', 'disgraceful', 'horrible', 'nightmare', 'tragic',
  'pathetic', 'corrupt', 'evil', 'wicked', 'destroyed', 'ruined',
  'doomed', 'threat', 'danger', 'warning', 'beware', 'fear'
];

const CREDIBLE_SOURCE_INDICATORS = [
  'according to', 'study published in', 'research shows', 'data from',
  'peer-reviewed', 'journal of', 'university of', 'institute of',
  'department of', 'official statement', 'press release', 'reuters',
  'associated press', 'world health organization', 'centers for disease',
  'national science foundation', 'published in', 'cited by', 'confirmed by',
  'spokesperson said', 'report by', 'findings suggest', 'evidence shows',
  'analysis by', 'survey conducted', 'statistics show', 'according to data'
];

const VAGUE_ATTRIBUTION = [
  'sources say', 'experts say', 'people are saying', 'many believe',
  'some claim', 'reports suggest', 'it is believed', 'rumors say',
  'according to sources', 'insiders claim', 'anonymous sources',
  'word on the street', 'everyone knows', 'they say', 'some people think',
  'a friend told me', 'i heard that', 'someone said'
];

const LOGICAL_FALLACY_PATTERNS = [
  'always', 'never', 'everyone', 'nobody', 'all of them', 'none of them',
  'proves that', 'guaranteed', '100%', 'definitely', 'absolutely certain',
  'no doubt', 'impossible', 'only explanation', 'must be true',
  'cannot be denied', 'undeniable proof', 'infallible'
];

const ALL_CAPS_REGEX = /\b[A-Z]{3,}\b/g;
const EXCLAMATION_REGEX = /!{2,}/g;
const QUESTION_MARKS_REGEX = /\?{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;

// ===== Analysis Functions =====

/**
 * 1. Language Analysis
 */
function analyzeLanguage(text) {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLen = words.length / Math.max(sentences.length, 1);

  // Check for all-caps words
  const capsMatches = text.match(ALL_CAPS_REGEX) || [];
  const capsRatio = capsMatches.length / Math.max(words.length, 1);

  // Check for excessive punctuation
  const exclCount = (text.match(EXCLAMATION_REGEX) || []).length;
  const questCount = (text.match(QUESTION_MARKS_REGEX) || []).length;
  const punctuationAbuse = exclCount + questCount;

  // Grammar quality heuristic (very short or very long sentences)
  const poorGrammar = sentences.filter(s => {
    const w = s.trim().split(/\s+/).length;
    return w < 3 || w > 60;
  }).length;

  let score = 100;
  const findings = [];

  if (capsRatio > 0.15) {
    score -= 25;
    findings.push({ text: `Excessive use of ALL CAPS (${capsMatches.length} words)`, type: 'red' });
  } else if (capsRatio > 0.05) {
    score -= 10;
    findings.push({ text: `Some ALL CAPS words detected (${capsMatches.length})`, type: 'yellow' });
  }

  if (punctuationAbuse > 3) {
    score -= 20;
    findings.push({ text: 'Excessive use of exclamation/question marks', type: 'red' });
  } else if (punctuationAbuse > 0) {
    score -= 5;
    findings.push({ text: 'Minor punctuation exaggeration detected', type: 'yellow' });
  }

  if (avgSentenceLen < 6) {
    score -= 10;
    findings.push({ text: 'Very short sentences — may indicate low-quality writing', type: 'yellow' });
  }

  if (poorGrammar > sentences.length * 0.4) {
    score -= 15;
    findings.push({ text: 'Inconsistent sentence structure detected', type: 'yellow' });
  }

  if (findings.length === 0) {
    findings.push({ text: 'Language patterns appear professional and consistent', type: 'green' });
  }

  return { score: Math.max(0, score), findings };
}

/**
 * 2. Sensationalism Detection
 */
function detectSensationalism(text) {
  const lowerText = text.toLowerCase();
  let score = 100;
  const findings = [];
  const foundWords = [];

  for (const word of SENSATIONAL_WORDS) {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }

  const wordCount = Math.max(text.split(/\s+/).length, 1);
  const sensationalRatio = foundWords.length / wordCount;

  if (foundWords.length > 4) {
    score -= 50;
    findings.push({ text: `High sensationalism: "${foundWords.slice(0, 4).join('", "')}" and ${foundWords.length - 4} more`, type: 'red' });
  } else if (foundWords.length > 2) {
    score -= 30;
    findings.push({ text: `Sensational words detected: "${foundWords.join('", "')}"`, type: 'red' });
  } else if (foundWords.length > 0) {
    score -= 12;
    findings.push({ text: `Minor sensational language: "${foundWords.join('", "')}"`, type: 'yellow' });
  }

  if (sensationalRatio > 0.08) {
    score -= 20;
    findings.push({ text: 'Very high density of sensational language', type: 'red' });
  }

  if (findings.length === 0) {
    findings.push({ text: 'No significant sensational language detected', type: 'green' });
  }

  return { score: Math.max(0, score), findings };
}

/**
 * 3. Source Credibility Check
 */
function checkSources(text) {
  const lowerText = text.toLowerCase();
  let score = 50; // Start neutral — need evidence to go up or down
  const findings = [];

  let credibleCount = 0;
  for (const phrase of CREDIBLE_SOURCE_INDICATORS) {
    if (lowerText.includes(phrase)) {
      credibleCount++;
    }
  }

  let vagueCount = 0;
  for (const phrase of VAGUE_ATTRIBUTION) {
    if (lowerText.includes(phrase)) {
      vagueCount++;
    }
  }

  const hasUrls = URL_REGEX.test(text);

  if (credibleCount >= 3) {
    score += 40;
    findings.push({ text: `Multiple credible source references found (${credibleCount})`, type: 'green' });
  } else if (credibleCount >= 1) {
    score += 20;
    findings.push({ text: `Some source references found (${credibleCount})`, type: 'green' });
  } else {
    score -= 15;
    findings.push({ text: 'No credible source references detected', type: 'red' });
  }

  if (vagueCount >= 2) {
    score -= 25;
    findings.push({ text: `Vague attributions found: relies on unnamed sources (${vagueCount})`, type: 'red' });
  } else if (vagueCount === 1) {
    score -= 10;
    findings.push({ text: 'Contains a vague source attribution', type: 'yellow' });
  }

  if (hasUrls) {
    score += 5;
    findings.push({ text: 'Contains URL links (potential references)', type: 'blue' });
  }

  return { score: Math.max(0, Math.min(100, score)), findings };
}

/**
 * 4. Emotional Manipulation Detection
 */
function detectEmotionalManipulation(text) {
  const lowerText = text.toLowerCase();
  let score = 100;
  const findings = [];
  const foundTriggers = [];
  const foundClickbait = [];

  for (const word of EMOTIONAL_TRIGGERS) {
    if (lowerText.includes(word)) {
      foundTriggers.push(word);
    }
  }

  for (const phrase of CLICKBAIT_PHRASES) {
    if (lowerText.includes(phrase)) {
      foundClickbait.push(phrase);
    }
  }

  if (foundClickbait.length > 0) {
    score -= 35 + (foundClickbait.length - 1) * 15;
    findings.push({ text: `Clickbait phrases detected: "${foundClickbait.slice(0, 3).join('", "')}"`, type: 'red' });
  }

  if (foundTriggers.length > 4) {
    score -= 30;
    findings.push({ text: `Heavy emotional manipulation (${foundTriggers.length} emotional trigger words)`, type: 'red' });
  } else if (foundTriggers.length > 1) {
    score -= 15;
    findings.push({ text: `Emotional trigger words found: "${foundTriggers.join('", "')}"`, type: 'yellow' });
  } else if (foundTriggers.length === 1) {
    score -= 5;
    findings.push({ text: `Minor emotional language: "${foundTriggers[0]}"`, type: 'yellow' });
  }

  if (findings.length === 0) {
    findings.push({ text: 'No emotional manipulation patterns identified', type: 'green' });
  }

  return { score: Math.max(0, score), findings };
}

/**
 * 5. Logical Consistency Analysis
 */
function analyzeLogic(text) {
  const lowerText = text.toLowerCase();
  let score = 100;
  const findings = [];
  const foundFallacies = [];

  for (const word of LOGICAL_FALLACY_PATTERNS) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundFallacies.push(word);
    }
  }

  // Check for contradictions (simple heuristic: "but" + absolute statements)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasContradiction = sentences.some(s => {
    const l = s.toLowerCase();
    return (l.includes(' but ') || l.includes(' however ')) &&
      LOGICAL_FALLACY_PATTERNS.some(f => l.includes(f));
  });

  if (foundFallacies.length > 4) {
    score -= 35;
    findings.push({ text: `Multiple absolute/overreaching statements detected (${foundFallacies.length})`, type: 'red' });
  } else if (foundFallacies.length > 1) {
    score -= 15;
    findings.push({ text: `Some absolute statements: "${foundFallacies.slice(0, 3).join('", "')}"`, type: 'yellow' });
  } else if (foundFallacies.length === 1) {
    score -= 5;
    findings.push({ text: `Minor absolute statement: "${foundFallacies[0]}"`, type: 'yellow' });
  }

  if (hasContradiction) {
    score -= 20;
    findings.push({ text: 'Potentially contradictory statements detected', type: 'red' });
  }

  // Very short text can't be verified well
  if (text.trim().split(/\s+/).length < 15) {
    score -= 10;
    findings.push({ text: 'Text is very short — limited logical analysis possible', type: 'yellow' });
  }

  if (findings.length === 0) {
    findings.push({ text: 'Statements appear logically consistent', type: 'green' });
  }

  return { score: Math.max(0, score), findings };
}

/**
 * 6. Overall Factual Assessment
 */
function assessFactuality(text, subScores) {
  const findings = [];

  // Weighted average
  const weights = {
    language: 0.15,
    sensationalism: 0.20,
    sources: 0.25,
    emotion: 0.20,
    logic: 0.20
  };

  const weightedScore = Math.round(
    subScores.language * weights.language +
    subScores.sensationalism * weights.sensationalism +
    subScores.sources * weights.sources +
    subScores.emotion * weights.emotion +
    subScores.logic * weights.logic
  );

  if (weightedScore >= 70) {
    findings.push({ text: 'Overall assessment: content appears factual and well-written', type: 'green' });
  } else if (weightedScore >= 45) {
    findings.push({ text: 'Overall assessment: content shows some red flags but is not definitively fake', type: 'yellow' });
  } else {
    findings.push({ text: 'Overall assessment: content exhibits multiple indicators of misinformation', type: 'red' });
  }

  return { score: weightedScore, findings };
}

// ===== Main Analysis Pipeline =====

function analyzeText(text) {
  const langResult = analyzeLanguage(text);
  const sensResult = detectSensationalism(text);
  const srcResult = checkSources(text);
  const emoResult = detectEmotionalManipulation(text);
  const logicResult = analyzeLogic(text);

  const subScores = {
    language: langResult.score,
    sensationalism: sensResult.score,
    sources: srcResult.score,
    emotion: emoResult.score,
    logic: logicResult.score
  };

  const overallResult = assessFactuality(text, subScores);

  // Determine verdict
  let verdict, verdictClass, confidence;
  if (overallResult.score >= 70) {
    verdict = 'Real News';
    verdictClass = 'real';
    confidence = Math.min(95, overallResult.score + Math.round(Math.random() * 5));
  } else if (overallResult.score >= 45) {
    verdict = 'Uncertain';
    verdictClass = 'uncertain';
    confidence = Math.max(40, Math.min(75, overallResult.score + Math.round(Math.random() * 10)));
  } else {
    verdict = 'Fake News';
    verdictClass = 'fake';
    confidence = Math.min(95, 100 - overallResult.score + Math.round(Math.random() * 5));
  }

  // Collect all findings
  const allFindings = [
    ...langResult.findings,
    ...sensResult.findings,
    ...srcResult.findings,
    ...emoResult.findings,
    ...logicResult.findings,
    ...overallResult.findings
  ];

  return {
    verdict,
    verdictClass,
    confidence,
    overallScore: overallResult.score,
    breakdown: [
      { name: 'Language Quality', desc: 'Writing style & professionalism', score: langResult.score, icon: '🔍' },
      { name: 'Sensationalism', desc: 'Exaggerated or misleading claims', score: sensResult.score, icon: '⚡' },
      { name: 'Source Credibility', desc: 'References & attribution quality', score: srcResult.score, icon: '📎' },
      { name: 'Emotional Integrity', desc: 'Manipulation & clickbait patterns', score: emoResult.score, icon: '🎭' },
      { name: 'Logical Consistency', desc: 'Internal logic & coherence', score: logicResult.score, icon: '🧠' }
    ],
    findings: allFindings
  };
}

// ===== UI Functions =====

function showPlaceholder() {
  resultsPlaceholder.classList.remove('hidden');
  resultsLoading.classList.add('hidden');
  resultsContent.classList.add('hidden');
}

function showLoading() {
  resultsPlaceholder.classList.add('hidden');
  resultsLoading.classList.remove('hidden');
  resultsContent.classList.add('hidden');

  // Reset all loading steps
  const steps = loadingSteps.querySelectorAll('.loading-step');
  steps.forEach(s => {
    s.classList.remove('active', 'done');
  });
}

function animateLoadingSteps() {
  return new Promise((resolve) => {
    const steps = loadingSteps.querySelectorAll('.loading-step');
    let i = 0;
    const interval = setInterval(() => {
      if (i > 0) {
        steps[i - 1].classList.remove('active');
        steps[i - 1].classList.add('done');
      }
      if (i < steps.length) {
        steps[i].classList.add('active');
        i++;
      } else {
        clearInterval(interval);
        setTimeout(resolve, 300);
      }
    }, 450);
  });
}

function showResults(result) {
  resultsPlaceholder.classList.add('hidden');
  resultsLoading.classList.add('hidden');
  resultsContent.classList.remove('hidden');

  // Verdict
  verdictCard.className = 'verdict-card ' + result.verdictClass;

  const icons = {
    real: '✅',
    fake: '❌',
    uncertain: '⚠️'
  };
  verdictIcon.textContent = icons[result.verdictClass];
  verdictText.textContent = result.verdict;
  verdictScore.textContent = result.overallScore + '/100';

  // Confidence
  confidenceValue.textContent = result.confidence + '%';
  const fillColors = {
    real: 'var(--gradient-real)',
    fake: 'var(--gradient-fake)',
    uncertain: 'var(--gradient-uncertain)'
  };
  confidenceFill.style.background = fillColors[result.verdictClass];
  // Animate fill
  requestAnimationFrame(() => {
    confidenceFill.style.width = '0%';
    requestAnimationFrame(() => {
      confidenceFill.style.width = result.confidence + '%';
    });
  });

  // Breakdown
  breakdownItems.innerHTML = '';
  result.breakdown.forEach(item => {
    let scoreClass = 'score-good';
    if (item.score < 50) scoreClass = 'score-danger';
    else if (item.score < 75) scoreClass = 'score-warning';

    const el = document.createElement('div');
    el.className = 'breakdown-item';
    el.innerHTML = `
      <span class="breakdown-item-icon">${item.icon}</span>
      <div class="breakdown-item-info">
        <span class="breakdown-item-name">${item.name}</span>
        <span class="breakdown-item-desc">${item.desc}</span>
      </div>
      <span class="breakdown-item-score ${scoreClass}">${item.score}/100</span>
    `;
    breakdownItems.appendChild(el);
  });

  // Findings
  findingsList.innerHTML = '';
  result.findings.forEach(f => {
    const li = document.createElement('li');
    li.className = 'finding-item';
    const bulletClass = {
      red: 'bullet-red',
      green: 'bullet-green',
      yellow: 'bullet-yellow',
      blue: 'bullet-blue'
    }[f.type] || 'bullet-blue';

    li.innerHTML = `
      <span class="finding-bullet ${bulletClass}"></span>
      <span>${f.text}</span>
    `;
    findingsList.appendChild(li);
  });
}

// ===== Event Listeners =====

newsInput.addEventListener('input', () => {
  const len = newsInput.value.length;
  charCount.textContent = len + ' character' + (len !== 1 ? 's' : '');
});

btnClear.addEventListener('click', () => {
  newsInput.value = '';
  charCount.textContent = '0 characters';
  showPlaceholder();
  newsInput.focus();
});

btnAnalyze.addEventListener('click', async () => {
  const text = newsInput.value.trim();
  if (!text) {
    newsInput.focus();
    // Shake animation
    newsInput.style.animation = 'none';
    requestAnimationFrame(() => {
      newsInput.style.animation = 'shake 0.4s ease';
    });
    return;
  }

  btnAnalyze.disabled = true;
  showLoading();

  // Run analysis in the background while showing loading animation
  const result = analyzeText(text);
  await animateLoadingSteps();

  showResults(result);
  btnAnalyze.disabled = false;

  // Scroll results into view
  document.getElementById('results-panel').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

// Add shake animation dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Header scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  const scrollY = window.scrollY;
  if (scrollY > 100) {
    header.style.borderBottomColor = 'rgba(99, 102, 241, 0.2)';
    header.style.background = 'rgba(10, 14, 26, 0.95)';
  } else {
    header.style.borderBottomColor = 'rgba(99, 102, 241, 0.15)';
    header.style.background = 'rgba(10, 14, 26, 0.8)';
  }
  lastScroll = scrollY;
});

// Intersection Observer for animate-on-scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeInUp 0.6s ease both';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step-card').forEach(card => {
  card.style.opacity = '0';
  observer.observe(card);
});

