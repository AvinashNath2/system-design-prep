// Application logic — navigation, rendering, utilities
let _currentSys = null;
let _activeSection = 'sysdesign';

const _sectionLabels = {
  sysdesign: 'System Design',
  devops:    'DevOps & Cloud-Native',
};

function showSection(section) {
  _activeSection = section;
  document.getElementById('home-page').style.display   = section === 'sysdesign' ? 'block' : 'none';
  document.getElementById('devops-page').style.display = section === 'devops'    ? 'block' : 'none';
  document.getElementById('detail-page').style.display = 'none';
  document.querySelectorAll('.nav-link[data-section]').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  window.scrollTo(0, 0);
}

function openSystem(id) {
  const extras = systemExtras[id] || [];
  _currentSys = { ...systems[id], steps: [...systems[id].steps, ...extras], _id: id };

  document.getElementById('detail-breadcrumb-name').textContent = _currentSys.name;
  document.getElementById('detail-section-label').textContent = _sectionLabels[_activeSection] || 'System Design';

  renderSidebar(0);

  document.getElementById('home-page').style.display   = 'none';
  document.getElementById('devops-page').style.display = 'none';
  document.getElementById('detail-page').style.display = 'block';
  window.scrollTo(0, 0);
}

function renderSidebar(activeIdx) {
  const sys = _currentSys;
  const problem = systemProblems[sys._id] || sys.sub;

  document.getElementById('detail-sidebar').innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-sys-name">${sys.name}</div>
      <div class="sidebar-problem">${problem}</div>
    </div>
    <div class="sidebar-steps-label">Course Steps</div>
    <div class="sidebar-steps">
      ${sys.steps.map((step, i) => `
        <div class="sidebar-step ${i === activeIdx ? 'active' : ''}" onclick="selectStep(${i})">
          <div class="sidebar-step-num">${i + 1}</div>
          <div class="sidebar-step-name">${step.name}</div>
        </div>
      `).join('')}
    </div>
  `;

  renderContent(activeIdx);
}

function selectStep(i) {
  document.querySelectorAll('.sidebar-step').forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  renderContent(i);
  document.getElementById('detail-content').scrollTop = 0;
}

function renderContent(i) {
  const step = _currentSys.steps[i];
  const total = _currentSys.steps.length;
  const el = document.getElementById('detail-content');
  el.innerHTML = `
    <div class="content-step-meta">Step ${i + 1} of ${total}</div>
    <div class="content-step-title">${step.name}</div>
    ${step.content}
  `;
  addCapTooltips(el);
}

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

function goHome() {
  showSection(_activeSection);
}

function switchTab(e, tabId) {
  e.target.closest('.tab-bar').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
}

