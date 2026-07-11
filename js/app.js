import { systemProblems } from './data/problems.js';

// Language system IDs — determines which data module to lazy-load
const LANGUAGE_IDS = new Set(['rust']);

// ── Application State ──────────────────────────────────────
let _currentSys   = null;
let _activeSection = 'sysdesign';
let _systems       = null;   // lazy-loaded
let _systemExtras  = null;   // lazy-loaded

const _sectionPageMap = {
  sysdesign: 'home-page',
  devops:    'devops-page',
  languages: 'languages-page',
};

const _sectionLabels = {
  sysdesign: 'System Design',
  devops:    'DevOps & Cloud-Native',
  languages: 'Languages',
};

// ── Lazy Data Loading ──────────────────────────────────────
async function loadSystemData(id) {
  if (_systems?.[id]) return;

  if (!_systemExtras) {
    _systemExtras = (await import('./data/extras.js')).systemExtras;
  }

  if (LANGUAGE_IDS.has(id)) {
    const { languageSystems } = await import('./data/languages.js');
    _systems = { ...(_systems || {}), ...languageSystems };
  } else {
    const { systems } = await import('./data/systems.js');
    _systems = { ...(_systems || {}), ...systems };
  }
}

// ── Section Navigation ─────────────────────────────────────
function showSection(section, { push = true } = {}) {
  _activeSection = section;
  Object.values(_sectionPageMap).forEach(pageId => {
    document.getElementById(pageId).style.display = 'none';
  });
  const pageId = _sectionPageMap[section];
  if (pageId) document.getElementById(pageId).style.display = 'block';
  document.getElementById('detail-page').style.display = 'none';
  document.querySelectorAll('.nav-link[data-section]').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  document.title = 'DevLearn — System Design';
  window.scrollTo(0, 0);
  history[push ? 'pushState' : 'replaceState'](
    { type: 'section', section }, '', `#${section}`
  );
}

// ── System Detail ──────────────────────────────────────────
async function openSystem(id) {
  await loadSystemData(id);

  const base = _systems?.[id];
  if (!base) { console.error(`Unknown system: ${id}`); return; }

  const extras  = _systemExtras?.[id] || [];
  _currentSys   = { ...base, steps: [...base.steps, ...extras], _id: id };

  document.getElementById('detail-breadcrumb-name').textContent = _currentSys.name;
  document.getElementById('detail-section-label').textContent   = _sectionLabels[_activeSection] || 'System Design';
  document.title = `${_currentSys.name} — DevLearn`;

  renderSidebar(0);

  Object.values(_sectionPageMap).forEach(pageId => {
    document.getElementById(pageId).style.display = 'none';
  });
  document.getElementById('detail-page').style.display = 'block';
  window.scrollTo(0, 0);
  history.pushState({ type: 'system', id, step: 0 }, '', `#system/${id}/0`);
}

function renderSidebar(activeIdx) {
  const sys     = _currentSys;
  const problem = systemProblems[sys._id] || sys.sub;
  const sidebar = document.getElementById('detail-sidebar');

  // Build skeleton — textContent used below for all user-visible strings
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-sys-name"></div>
      <div class="sidebar-problem"></div>
    </div>
    <div class="sidebar-steps-label">Course Steps</div>
    <div class="sidebar-steps">
      ${sys.steps.map((_, i) => `
        <button class="sidebar-step ${i === activeIdx ? 'active' : ''}" type="button" data-step="${i}">
          <div class="sidebar-step-num">${i + 1}</div>
          <div class="sidebar-step-name"></div>
        </button>
      `).join('')}
    </div>
  `;

  sidebar.querySelector('.sidebar-sys-name').textContent  = sys.name;
  sidebar.querySelector('.sidebar-problem').textContent   = problem;
  sidebar.querySelectorAll('.sidebar-step').forEach((el, i) => {
    el.querySelector('.sidebar-step-name').textContent = sys.steps[i].name;
  });

  renderContent(activeIdx);
}

function selectStep(i) {
  if (!_currentSys || i < 0 || i >= _currentSys.steps.length) return;
  document.querySelectorAll('.sidebar-step').forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  renderContent(i);
  document.getElementById('detail-content').scrollTop = 0;
  history.replaceState(
    { type: 'system', id: _currentSys._id, step: i }, '',
    `#system/${_currentSys._id}/${i}`
  );
}

function renderContent(i) {
  if (!_currentSys || i < 0 || i >= _currentSys.steps.length) return;
  const step  = _currentSys.steps[i];
  const total = _currentSys.steps.length;
  const el    = document.getElementById('detail-content');

  // textContent for meta/title (safe); innerHTML only for vetted developer-authored HTML
  el.innerHTML = `
    <div class="content-step-meta"></div>
    <div class="content-step-title"></div>
    <div class="content-step-body">${step.content}</div>
  `;
  el.querySelector('.content-step-meta').textContent  = `Step ${i + 1} of ${total}`;
  el.querySelector('.content-step-title').textContent = step.name;

  addCapTooltips(el);
}

function goHome() {
  showSection(_activeSection);
}

// switchTab is called via onclick= inside developer-authored step content HTML.
// It must remain on window; this export is intentional and documented.
function switchTab(e, tabId) {
  const tabBar = e.target.closest('.tab-bar');
  tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  const container = tabBar.parentElement;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  container.querySelector('#tab-' + tabId)?.classList.add('active');
}
window.switchTab = switchTab;

// ── CAP Tooltips ───────────────────────────────────────────
function addCapTooltips(container) {
  const tips = {
    CP: `<span class="cap-tt">CP<span class="cap-tip">
      <span class="cap-tip-head">CP — Consistency + Partition Tolerance</span>
      <div class="cap-tip-row"><span class="cap-tip-label">During split:</span><span class="cap-tip-val">Returns error, never stale data</span></div>
      <div class="cap-tip-row"><span class="cap-tip-label">Prioritises:</span><span class="cap-tip-val">Correctness over uptime</span></div>
      <div class="cap-tip-row"><span class="cap-tip-label">Use for:</span><span class="cap-tip-val">Payments, bookings, auth, inventory</span></div>
      <div class="cap-tip-eg">Examples: PostgreSQL · MySQL · ZooKeeper · etcd</div>
    </span></span>`,
    AP: `<span class="cap-tt">AP<span class="cap-tip">
      <span class="cap-tip-head">AP — Availability + Partition Tolerance</span>
      <div class="cap-tip-row"><span class="cap-tip-label">During split:</span><span class="cap-tip-val">Stays up, may return stale data</span></div>
      <div class="cap-tip-row"><span class="cap-tip-label">Prioritises:</span><span class="cap-tip-val">Uptime over perfect consistency</span></div>
      <div class="cap-tip-row"><span class="cap-tip-label">Use for:</span><span class="cap-tip-val">Feeds, caches, search, vote counts</span></div>
      <div class="cap-tip-eg">Examples: Redis · Cassandra · DynamoDB · Elasticsearch</div>
    </span></span>`,
  };

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  nodes.forEach(node => {
    const tag = node.parentNode && node.parentNode.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE') return;
    if (node.parentNode && node.parentNode.closest && node.parentNode.closest('.cap-tt')) return;
    const txt = node.textContent;
    if (!/\bCP\b|\bAP\b/.test(txt)) return;
    const html = txt
      .replace(/\bCP\b/g, tips.CP)
      .replace(/\bAP\b/g, tips.AP);
    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    node.parentNode.replaceChild(wrap, node);
  });
}

// ── Hash Routing ───────────────────────────────────────────
async function handleRoute(hash) {
  const clean = (hash || '').replace(/^#\/?/, '');

  const sectionMatch = clean.match(/^(sysdesign|devops|languages)$/);
  if (!clean || sectionMatch) {
    showSection(sectionMatch ? sectionMatch[1] : 'sysdesign', { push: false });
    return;
  }

  const systemMatch = clean.match(/^system\/([^/]+)(?:\/(\d+))?$/);
  if (systemMatch) {
    const [, id, stepStr] = systemMatch;
    _activeSection = LANGUAGE_IDS.has(id) ? 'languages' : id === 'k8s' ? 'devops' : 'sysdesign';
    await openSystem(id);
    const step = stepStr ? parseInt(stepStr, 10) : 0;
    if (step > 0) selectStep(step);
    return;
  }

  showSection('sysdesign', { push: false });
}

// ── Event Delegation & Bootstrap ──────────────────────────
function init() {
  // Single source of truth: populate card problem text from systemProblems
  document.querySelectorAll('[data-system-id]').forEach(card => {
    const id = card.dataset.systemId;
    const el = card.querySelector('.card-problem');
    if (el) el.textContent = systemProblems[id] || '';
  });

  // Nav tabs
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', () => showSection(link.dataset.section));
  });

  // System cards — event delegation so it works for dynamically added cards too
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-system-id]');
    if (card) openSystem(card.dataset.systemId);
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', goHome);

  // Sidebar steps — delegated to sidebar container
  document.getElementById('detail-sidebar').addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) selectStep(parseInt(step.dataset.step, 10));
  });

  // Browser back / forward
  window.addEventListener('popstate', e => {
    const state = e.state;
    if (state?.type === 'system') {
      openSystem(state.id).then(() => {
        if (state.step > 0) selectStep(state.step);
      });
    } else if (state?.type === 'section') {
      showSection(state.section, { push: false });
    } else {
      handleRoute(location.hash);
    }
  });

  handleRoute(location.hash);
}

// Module scripts are deferred by default; DOM is always ready here.
// Guard retained for safety in edge-case embeddings.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
