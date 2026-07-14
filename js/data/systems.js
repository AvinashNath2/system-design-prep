// System Design + DevOps system data
export const systems = {
  reddit: {
    name: 'Reddit',
    sub: 'Social news aggregation & discussion',
    steps: [
      {
        name: 'Functional Requirements',
        content: `
          <div class="content-label">What the system must do</div>
          <ul class="req-list">
            <li><strong>Users</strong> can sign up, log in, manage their profile</li>
            <li><strong>Posts</strong> — create text, image, link, or video posts in subreddits</li>
            <li><strong>Subreddits</strong> — communities that organize posts (r/gaming, r/science)</li>
            <li><strong>Voting</strong> — upvote / downvote posts and comments</li>
            <li><strong>Comments</strong> — nested threaded replies on posts</li>
            <li><strong>Feed</strong> — ranked list of posts (Hot, New, Top, Rising)</li>
            <li><strong>Search</strong> — search posts, subreddits, users</li>
            <li><strong>Notifications</strong> — alerts on replies, mentions, awards</li>
            <li><strong>Moderation</strong> — mods can remove posts / ban users</li>
          </ul>
        `
      },
      {
        name: 'Non-Functional Requirements',
        content: `
          <div class="content-label">How well it must perform</div>
          <table class="nfr-table">
            <tr><td>High Availability</td><td>Reddit should almost never go down — 99.9% uptime</td></tr>
            <tr><td>Low Latency</td><td>Feed loads fast — under 200ms</td></tr>
            <tr><td>Scalability</td><td>Handle spikes during viral posts or breaking news</td></tr>
            <tr><td>Eventual Consistency</td><td>Vote counts can be slightly delayed — that's okay</td></tr>
            <tr><td>Durability</td><td>Posts and comments should never be lost</td></tr>
            <tr><td>Read Heavy</td><td>100:1 read-to-write ratio — optimize for reads</td></tr>
          </table>

          <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
          <div class="insight-box" style="margin-bottom:10px;">
            CAP Theorem: a distributed system can only guarantee <strong>2 of 3</strong> — Consistency, Availability, Partition Tolerance. Partition tolerance is always required (networks fail), so the real choice is <strong>CP vs AP</strong>.
          </div>
          <table class="nfr-table">
            <tr>
              <td><strong>Posts &amp; Comments</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td>
              <td>Need strong consistency — a comment must not disappear after being posted. Relational structure (posts → comments tree). Choose CP: never show corrupt data.</td>
            </tr>
            <tr>
              <td><strong>Vote Counts</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td>
              <td>High write volume, OK if count is slightly stale. Choose AP: availability + speed over exact count at every millisecond. Periodically sync to DB.</td>
            </tr>
            <tr>
              <td><strong>Search / Feed Ranking</strong><br><span style="color:#888;font-size:11px;">Elasticsearch (AP)</span></td>
              <td>Search index can be slightly behind (eventual consistency). Availability matters more than seeing the exact latest post. AP fits perfectly.</td>
            </tr>
            <tr>
              <td><strong>Media (images/videos)</strong><br><span style="color:#888;font-size:11px;">S3 + CDN</span></td>
              <td>Object storage — not a database choice per se, but AP-aligned. CDN may serve slightly stale images briefly after edits. That's acceptable.</td>
            </tr>
          </table>

          <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#15803d;">CQRS — Command Query Responsibility Segregation</div>
              <div style="font-size:12px;color:#555;margin-top:4px;">Separate the write path (post/vote) from the read path (feed/search). Writes go to PostgreSQL; reads come from Redis cache + Elasticsearch. Different models, different DBs, optimised for each purpose.</div>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#1d4ed8;">Cache-Aside (Lazy Loading)</div>
              <div style="font-size:12px;color:#555;margin-top:4px;">On a cache miss, fetch from DB → populate Redis → serve. On a write, invalidate the cache key. This pattern keeps Redis lean — only hot data lives there.</div>
            </div>
            <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#a16207;">Event-Driven Architecture</div>
              <div style="font-size:12px;color:#555;margin-top:4px;">Vote posted → Kafka event → Vote Counter updates Redis. Post created → Kafka → Search Indexer updates Elasticsearch. Services stay decoupled; each can scale independently.</div>
            </div>
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#7e22ce;">Read Replica Pattern</div>
              <div style="font-size:12px;color:#555;margin-top:4px;">PostgreSQL primary handles writes. Multiple read replicas handle SELECT queries. 100:1 read ratio means you need many more read replicas than write primaries.</div>
            </div>
          </div>
          <div class="insight-box" style="margin-top:12px;">💡 Reddit is <strong>read-heavy</strong>. Most users just scroll — they don't post. This shapes every design decision: use AP databases for reads, CP for writes, cache aggressively.</div>
        `
      },
      {
        name: 'Capacity Estimation',
        content: `
          <div class="content-label">Assumed: 100,000 DAU (1 lakh)</div>
          <div class="cap-calc">
            <div class="cap-calc-row">
              <div class="cap-calc-label">Reads / sec</div>
              <div class="cap-calc-math">100K users × 5 feed views/day = 500K reads/day<br>500K ÷ 86,400 sec/day</div>
              <div class="cap-calc-result">≈ 6/sec</div>
            </div>
            <div class="cap-calc-row">
              <div class="cap-calc-label">Writes / sec</div>
              <div class="cap-calc-math">100K × 2% active posters × 10 actions each = 20K/day<br>20K ÷ 86,400 sec/day</div>
              <div class="cap-calc-result">≈ 0.2/sec</div>
            </div>
            <div class="cap-calc-row">
              <div class="cap-calc-label">Storage / year</div>
              <div class="cap-calc-math">1K posts/day × 500 KB avg size × 365 days<br>= 182,500 MB</div>
              <div class="cap-calc-result">≈ 180 GB/yr</div>
            </div>
            <div class="cap-calc-row">
              <div class="cap-calc-label">Bandwidth out</div>
              <div class="cap-calc-math">6 reads/sec × 50 KB avg response payload</div>
              <div class="cap-calc-result">≈ 300 KB/s</div>
            </div>
          </div>
          <div class="insight-box">
            86,400 = seconds in a day (24 × 60 × 60). A single server handles this load easily — the exercise is to design for <strong>10–100× growth</strong> without rewriting everything.
          </div>
        `
      },
      {
        name: 'High Level Design (HLD)',
        content: `
          <div class="tab-bar">
            <button class="tab-btn active" onclick="switchTab(event,'traditional')">Traditional / VM-based</button>
            <button class="tab-btn" onclick="switchTab(event,'k8s')">Kubernetes / Cloud-Native</button>
          </div>

          <!-- ── TAB 1: TRADITIONAL ── -->
          <div class="tab-panel active" id="tab-traditional">

            <div class="content-label">Static Infrastructure — you manage every instance</div>
            <div class="hld-graph">

              <div class="layer-name">Client</div>
              <div class="hld-row">
                <div class="hld-node c-blue">📱 Client<div class="node-sub">Web / Mobile</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Edge</div>
              <div class="hld-row">
                <div class="hld-node c-orange">🌐 CDN<div class="node-sub">Static assets</div></div>
                <div style="width:16px"></div>
                <div class="hld-node c-orange">⚖️ LB Primary<div class="node-sub">Active</div></div>
                <div style="width:4px"></div>
                <div class="hld-node c-orange" style="opacity:0.5;">⚖️ LB Standby<div class="node-sub">Failover</div></div>
              </div>
              <div class="hld-arrow">↓ <span style="font-size:10px;color:#444;">heartbeat keeps standby ready</span></div>

              <div class="layer-name">Gateway — 3 instances, LB routes across all</div>
              <div class="hld-row">
                <div class="hld-node c-teal">🚪 API GW 1</div>
                <div style="width:6px"></div>
                <div class="hld-node c-teal">🚪 API GW 2</div>
                <div style="width:6px"></div>
                <div class="hld-node c-teal">🚪 API GW 3</div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Microservices — manually scaled VMs</div>
              <div class="hld-row">
                <div class="hld-multi">
                  <div class="hld-node c-green">📰 Feed<div class="node-sub">Rank posts</div></div>
                  <div class="hld-node c-green">📝 Post<div class="node-sub">Create / fetch</div></div>
                  <div class="hld-node c-green">👍 Vote<div class="node-sub">Up / down</div></div>
                  <div class="hld-node c-green">🔍 Search<div class="node-sub">Full-text</div></div>
                  <div class="hld-node c-green">🔔 Notify<div class="node-sub">Alerts</div></div>
                </div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Cache & Messaging</div>
              <div class="hld-row">
                <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Feed cache</div></div>
                <div style="width:16px"></div>
                <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Async events</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Storage</div>
              <div class="hld-row">
                <div class="hld-multi">
                  <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Primary + Replica</div></div>
                  <div class="hld-node c-red">🔎 Elasticsearch<div class="node-sub">Search index</div></div>
                  <div class="hld-node c-red">🪣 S3<div class="node-sub">Images, videos</div></div>
                </div>
              </div>
            </div>

            <div class="insight-box" style="margin-top:16px;">
              <strong>SPOF handling:</strong> LB Primary + Standby (Active-Passive). 3 API Gateway instances — LB health-checks and removes dead ones. PostgreSQL Primary + Replica — auto-promotes on failure.
            </div>

            <div style="margin-top:20px;">
              <div class="content-label">Service communication</div>
              <div class="comm-block">
                <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> User loads feed → Feed Service → Post Service <em>(user waiting)</em></div>
                <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> API Gateway → Auth check <em>(can't route without it)</em></div>
                <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Post created → Kafka → Search + Notify + Analytics <em>(background)</em></div>
                <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Vote cast → Redis batch → flush to DB every 10s <em>(eventual consistency)</em></div>
              </div>
            </div>
          </div>

          <!-- ── TAB 2: KUBERNETES ── -->
          <div class="tab-panel" id="tab-k8s">

            <div class="content-label">Cloud-Native — Kubernetes manages instances, healing, scaling</div>
            <div class="hld-graph">

              <div class="layer-name">Client</div>
              <div class="hld-row">
                <div class="hld-node c-blue">📱 Client<div class="node-sub">Web / Mobile</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Edge (outside cluster)</div>
              <div class="hld-row">
                <div class="hld-node c-orange">🌐 CDN<div class="node-sub">Static assets</div></div>
                <div style="width:16px"></div>
                <div class="hld-node c-orange">⚖️ Cloud LB<div class="node-sub">AWS ALB — multi-AZ</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name" style="color:#555;">┌──────────── Kubernetes Cluster ────────────┐</div>

              <div class="layer-name">Ingress Controller (replaces API Gateway)</div>
              <div class="hld-row">
                <div class="hld-node c-teal">🚦 Ingress (nginx)<div class="node-sub">Auth · routing · rate limit</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Services + Pods — k8s auto-heals & scales</div>
              <div class="hld-row">
                <div class="hld-multi">
                  <div class="hld-node c-green">📰 Feed<div class="node-sub">3 pods · HPA</div></div>
                  <div class="hld-node c-green">📝 Post<div class="node-sub">3 pods · HPA</div></div>
                  <div class="hld-node c-green">👍 Vote<div class="node-sub">2 pods · HPA</div></div>
                  <div class="hld-node c-green">🔍 Search<div class="node-sub">2 pods · HPA</div></div>
                  <div class="hld-node c-green">🔔 Notify<div class="node-sub">2 pods · HPA</div></div>
                </div>
              </div>
              <div class="hld-arrow">↓ <span style="font-size:10px;color:#444;">kube-proxy handles internal routing between pods</span></div>

              <div class="layer-name" style="color:#555;">└────────────────────────────────────────────┘</div>

              <div class="layer-name">Cache & Messaging (outside cluster)</div>
              <div class="hld-row">
                <div class="hld-node c-purple">⚡ Redis<div class="node-sub">ElastiCache</div></div>
                <div style="width:16px"></div>
                <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">MSK / Confluent</div></div>
              </div>
              <div class="hld-arrow">↓</div>

              <div class="layer-name">Storage (managed, outside cluster)</div>
              <div class="hld-row">
                <div class="hld-multi">
                  <div class="hld-node c-red">🗄️ RDS PostgreSQL<div class="node-sub">Multi-AZ managed</div></div>
                  <div class="hld-node c-red">🔎 Elasticsearch<div class="node-sub">OpenSearch</div></div>
                  <div class="hld-node c-red">🪣 S3<div class="node-sub">Images, videos</div></div>
                </div>
              </div>
            </div>

            <div class="insight-box" style="margin-top:16px;">
              <strong>What k8s replaces vs traditional:</strong><br><br>
              <strong style="color:#ccc;">Manual LB between services</strong> → kube-proxy + Service (automatic)<br>
              <strong style="color:#ccc;">Manual restart on crash</strong> → Self-healing — k8s restarts dead pods<br>
              <strong style="color:#ccc;">Manual scaling</strong> → HPA (Horizontal Pod Autoscaler) scales on CPU/traffic<br>
              <strong style="color:#ccc;">Hardcoded IPs</strong> → DNS-based discovery — feed-service:8080 just works<br>
              <strong style="color:#ccc;">Risky deploys</strong> → Rolling updates — zero downtime by default
            </div>

            <div style="margin-top:16px;">
              <div class="content-label">SPOF in k8s</div>
              <div class="insight-box">
                Node dies → k8s reschedules its pods onto healthy nodes automatically.<br>
                Control Plane runs across <strong>3 master nodes</strong> — even the orchestrator has no SPOF.<br>
                Cloud LB (AWS ALB) is multi-AZ by default — redundancy is handled for you.
              </div>
            </div>

            <div style="margin-top:16px;">
              <div class="content-label">When to use k8s</div>
              <div class="insight-box">
                Overkill at 100K DAU. Most teams adopt it around <strong>1M+ DAU</strong> or when managing 10+ microservices becomes painful. Good to mention in interviews — shows you know it exists and when it makes sense.
              </div>
            </div>

          </div>
        `
      },
      {
        name: 'Data Modeling',
        content: `
          <!-- TABLE NODES -->
          <div class="content-label">Tables</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">

            <div class="db-node">
              <div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;">
                <span class="db-node-icon">👤</span>
                <span class="db-node-name">users</span>
              </div>
              <div class="db-node-body">
                <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
                <div class="db-row">username <span>VARCHAR · UNIQUE</span></div>
                <div class="db-row">email <span>VARCHAR · UNIQUE</span></div>
                <div class="db-row">karma <span>INT</span></div>
                <div class="db-row">created_at <span>TIMESTAMP</span></div>
              </div>
            </div>

            <div class="db-node">
              <div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;">
                <span class="db-node-icon">🏘️</span>
                <span class="db-node-name">subreddits</span>
              </div>
              <div class="db-node-body">
                <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
                <div class="db-row fk">🔗 created_by <span>FK → users</span></div>
                <div class="db-row">name <span>VARCHAR · UNIQUE</span></div>
                <div class="db-row">member_count <span>INT</span></div>
                <div class="db-row">created_at <span>TIMESTAMP</span></div>
              </div>
            </div>

            <div class="db-node">
              <div class="db-node-header" style="background:#fefce8;border-color:#fef08a;">
                <span class="db-node-icon">📝</span>
                <span class="db-node-name">posts</span>
              </div>
              <div class="db-node-body">
                <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
                <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
                <div class="db-row fk">🔗 subreddit_id <span>FK → subreddits</span></div>
                <div class="db-row">title <span>VARCHAR</span></div>
                <div class="db-row">type <span>ENUM</span></div>
                <div class="db-row">score <span>INT · cached</span></div>
                <div class="db-row">created_at <span>TIMESTAMP</span></div>
              </div>
            </div>

            <div class="db-node">
              <div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;">
                <span class="db-node-icon">💬</span>
                <span class="db-node-name">comments</span>
              </div>
              <div class="db-node-body">
                <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
                <div class="db-row fk">🔗 post_id <span>FK → posts</span></div>
                <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
                <div class="db-row fk">🔗 parent_id <span>FK → comments (self)</span></div>
                <div class="db-row">body <span>TEXT</span></div>
                <div class="db-row">score <span>INT</span></div>
              </div>
            </div>

            <div class="db-node" style="grid-column:1/-1;">
              <div class="db-node-header" style="background:#fff7ed;border-color:#fed7aa;">
                <span class="db-node-icon">👍</span>
                <span class="db-node-name">votes</span>
                <span style="font-size:10px;color:#888;font-weight:400;margin-left:auto;">composite PK</span>
              </div>
              <div class="db-node-body" style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
                <div class="db-row pk">🔑 user_id <span>FK → users</span></div>
                <div class="db-row pk">🔑 target_id <span>post or comment id</span></div>
                <div class="db-row pk">🔑 target_type <span>ENUM (post, comment)</span></div>
                <div class="db-row">value <span>SMALLINT (+1 / -1)</span></div>
              </div>
            </div>

          </div>

          <!-- RELATIONSHIP GRAPH -->
          <div class="content-label">Relationship graph</div>
          <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
            <svg viewBox="0 0 560 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">

              <!-- Arrow marker -->
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#ccc"/>
                </marker>
              </defs>

              <!-- USERS (center top) -->
              <rect x="200" y="20" width="160" height="80" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
              <text x="280" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">👤 users</text>
              <line x1="200" y1="50" x2="360" y2="50" stroke="#bfdbfe" stroke-width="1"/>
              <text x="210" y="65" font-size="10" fill="#555">🔑 id · UUID · PK</text>
              <text x="210" y="80" font-size="10" fill="#888">username, email, karma</text>
              <text x="210" y="93" font-size="10" fill="#888">created_at</text>

              <!-- SUBREDDITS (top right) -->
              <rect x="390" y="20" width="160" height="80" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
              <text x="470" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">🏘️ subreddits</text>
              <line x1="390" y1="50" x2="550" y2="50" stroke="#bbf7d0" stroke-width="1"/>
              <text x="400" y="65" font-size="10" fill="#555">🔑 id · UUID · PK</text>
              <text x="400" y="80" font-size="10" fill="#888">🔗 created_by → users</text>
              <text x="400" y="93" font-size="10" fill="#888">name, member_count</text>

              <!-- POSTS (center) -->
              <rect x="200" y="145" width="160" height="95" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
              <text x="280" y="167" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">📝 posts</text>
              <line x1="200" y1="175" x2="360" y2="175" stroke="#fef08a" stroke-width="1"/>
              <text x="210" y="190" font-size="10" fill="#555">🔑 id · UUID · PK</text>
              <text x="210" y="204" font-size="10" fill="#888">🔗 user_id → users</text>
              <text x="210" y="218" font-size="10" fill="#888">🔗 subreddit_id → subreddits</text>
              <text x="210" y="232" font-size="10" fill="#888">title, score, type</text>

              <!-- COMMENTS (bottom left) -->
              <rect x="10" y="240" width="170" height="90" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
              <text x="95" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">💬 comments</text>
              <line x1="10" y1="270" x2="180" y2="270" stroke="#e9d5ff" stroke-width="1"/>
              <text x="20" y="285" font-size="10" fill="#555">🔑 id · UUID · PK</text>
              <text x="20" y="299" font-size="10" fill="#888">🔗 post_id → posts</text>
              <text x="20" y="313" font-size="10" fill="#888">🔗 user_id → users</text>
              <text x="20" y="327" font-size="10" fill="#888">🔗 parent_id → self</text>

              <!-- VOTES (bottom right) -->
              <rect x="390" y="240" width="160" height="90" rx="8" fill="#fff7ed" stroke="#fed7aa" stroke-width="1.5"/>
              <text x="470" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#c2410c">👍 votes</text>
              <line x1="390" y1="270" x2="550" y2="270" stroke="#fed7aa" stroke-width="1"/>
              <text x="400" y="285" font-size="10" fill="#555">🔑 user_id + target_id</text>
              <text x="400" y="299" font-size="10" fill="#888">🔗 user_id → users</text>
              <text x="400" y="313" font-size="10" fill="#888">target_type (post/comment)</text>
              <text x="400" y="327" font-size="10" fill="#888">value (+1 / -1)</text>

              <!-- ARROWS -->
              <!-- users → subreddits (created_by) -->
              <line x1="360" y1="45" x2="390" y2="45" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)" stroke-dasharray="4,2"/>

              <!-- users → posts (user_id) -->
              <line x1="280" y1="100" x2="280" y2="145" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)"/>
              <text x="286" y="128" font-size="9" fill="#aaa">writes</text>

              <!-- subreddits → posts (subreddit_id) -->
              <line x1="420" y1="100" x2="340" y2="150" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)" stroke-dasharray="4,2"/>

              <!-- posts → comments (post_id) -->
              <line x1="220" y1="240" x2="160" y2="240" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)"/>
              <text x="175" y="235" font-size="9" fill="#aaa">has</text>

              <!-- users → comments (user_id) -->
              <line x1="210" y1="100" x2="95" y2="240" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)" stroke-dasharray="4,2"/>

              <!-- users → votes (user_id) -->
              <line x1="340" y1="80" x2="430" y2="240" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr)" stroke-dasharray="4,2"/>

              <!-- comments self ref -->
              <path d="M10,295 Q-10,295 -10,310 Q-10,335 10,335 L10,330" stroke="#ccc" stroke-width="1.5" fill="none" marker-end="url(#arr)" stroke-dasharray="3,2"/>
              <text x="-8" y="318" font-size="8" fill="#aaa">self</text>

            </svg>

            <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#888;">
                <div style="width:20px;height:1.5px;background:#ccc;"></div> FK relationship
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#888;">
                <div style="width:20px;height:1.5px;background:#ccc;border-top:1.5px dashed #ccc;"></div> optional / derived
              </div>
              <div style="font-size:11px;color:#888;">🔑 Primary Key &nbsp; 🔗 Foreign Key</div>
            </div>
          </div>

          <div class="insight-box" style="margin-top:16px;">
            <strong>Key decisions:</strong><br><br>
            <strong style="color:#222;">comments.parent_id → self</strong> — self-referencing FK enables nested threads. NULL = top-level comment.<br><br>
            <strong style="color:#222;">posts.score cached</strong> — avoids COUNT(votes) on every feed load. Kafka batch updates it every 30s.<br><br>
            <strong style="color:#222;">votes composite PK</strong> — (user_id + target_id + target_type) enforces one vote per user per item at DB level.
          </div>

          <div style="margin-top:16px;">
            <div class="content-label">Indexes</div>
            <ul class="req-list">
              <li><strong>posts(subreddit_id, created_at)</strong> — fetch posts by subreddit, sorted by time</li>
              <li><strong>posts(subreddit_id, score)</strong> — fetch top posts in a subreddit</li>
              <li><strong>comments(post_id)</strong> — fetch all comments for a post</li>
              <li><strong>votes(user_id, target_id)</strong> — check if user already voted</li>
            </ul>
          </div>
        `
      },
      {
        name: 'Deep Dive — Feed Ranking',
        content: `
          <div class="content-label">How Reddit decides what you see first</div>

          <div class="insight-box">
            Reddit has 4 sort modes: <strong style="color:#222;">Hot, New, Top, Rising</strong>. The most interesting one is <strong style="color:#222;">Hot</strong> — it balances votes AND recency.
          </div>

          <div style="margin-top:20px;">
            <div class="content-label">The Hot Algorithm</div>
            <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:16px;font-family:monospace;font-size:13px;color:#333;line-height:2;">
              score = log₁₀(ups - downs) + (seconds since epoch / 45000)
            </div>
            <div class="insight-box" style="margin-top:10px;">
              Two forces pulling the score:<br><br>
              <strong style="color:#222;">log₁₀(votes)</strong> — more votes = higher score, but logarithmic so 1000 votes isn't 10x better than 100 votes<br><br>
              <strong style="color:#222;">time / 45000</strong> — every 12.5 hours, score gets +1 just from time passing. Newer posts naturally rise.
            </div>
          </div>

          <div style="margin-top:20px;">
            <div class="content-label">Example — which ranks higher?</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
                <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:8px;">Post A</div>
                <div style="font-size:12px;color:#555;">1,000 upvotes, posted 2 hours ago</div>
                <div style="font-family:monospace;font-size:11px;color:#888;margin-top:8px;">score = log(1000) + age_bonus<br>= 3.0 + small bonus</div>
              </div>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
                <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">Post B</div>
                <div style="font-size:12px;color:#555;">100 upvotes, posted 30 minutes ago</div>
                <div style="font-family:monospace;font-size:11px;color:#888;margin-top:8px;">score = log(100) + tiny age_bonus<br>= 2.0 + tiny bonus</div>
              </div>
            </div>
            <div class="insight-box" style="margin-top:10px;">Post A ranks higher — 1000 votes dominates. But if Post B keeps getting votes, it'll catch up quickly because it's new.</div>
          </div>

          <div style="margin-top:20px;">
            <div class="content-label">How the feed is built — step by step</div>
            <ul class="req-list">
              <li><strong>1. Check Redis</strong> — is a cached feed for this subreddit + sort already there? Return immediately if yes (TTL: 5 min)</li>
              <li><strong>2. Cache miss</strong> — query PostgreSQL for last 1000 posts in subreddit</li>
              <li><strong>3. Score each post</strong> — run Hot algorithm on all 1000 posts</li>
              <li><strong>4. Sort &amp; paginate</strong> — return top 25, store cursor for "next page"</li>
              <li><strong>5. Write to Redis</strong> — cache the ranked list so next 1000 users get it instantly</li>
            </ul>
          </div>

          <div style="margin-top:20px;">
            <div class="content-label">Fan-out problem — when a post goes viral</div>
            <div class="insight-box">
              A post gets 50,000 upvotes in 10 minutes. Redis cache expires. Suddenly 10,000 users hit the feed at the same time — all miss cache and hammer PostgreSQL.<br><br>
              This is called a <strong style="color:#222;">cache stampede</strong>.<br><br>
              Fix: <strong style="color:#222;">Mutex lock</strong> — only one request rebuilds the cache, others wait. Or <strong style="color:#222;">probabilistic early expiry</strong> — randomly refresh cache slightly before TTL expires.
            </div>
          </div>
        `
      },
      {
        name: 'Bottlenecks & Trade-offs',
        content: `
          <div class="content-label">What breaks at scale and how to fix it</div>

          <ul class="req-list" style="gap:10px;">

            <li>
              <strong>🔥 Hot Subreddits (r/worldnews during breaking news)</strong><br>
              <span style="color:#888;">Millions hit the same subreddit feed at once. Single Redis key gets hammered.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Fix: Shard the cache by subreddit ID. Use read replicas for PostgreSQL. Pre-compute feeds for top 1000 subreddits every minute.</span>
            </li>

            <li>
              <strong>📝 Write amplification on votes</strong><br>
              <span style="color:#888;">10M votes/day = 115 writes/sec to the votes table. Each vote also updates post score.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Fix: Batch votes in Redis, flush to DB every 30s. Use counter cache on post table instead of COUNT() query.</span>
            </li>

            <li>
              <strong>🔍 Search is slow and stale</strong><br>
              <span style="color:#888;">Elasticsearch index lags behind by a few seconds after a post is created.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Trade-off accepted: eventual consistency in search is fine. Users don't expect a post to be searchable the millisecond it's created.</span>
            </li>

            <li>
              <strong>💬 Deep comment threads</strong><br>
              <span style="color:#888;">Recursive SQL queries for nested comments (self-join) get slow beyond 5–6 levels deep.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Fix: Use Materialized Path or Closure Table pattern instead of recursive self-join. Or limit nesting depth to 8 levels (Reddit does this).</span>
            </li>

            <li>
              <strong>📸 Media storage costs</strong><br>
              <span style="color:#888;">Videos and images dominate storage. Serving raw from S3 is expensive at scale.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Fix: CDN caches media at edge. S3 lifecycle policies move old content to cheaper tiers (Glacier). Transcode video to multiple resolutions (360p / 720p) and serve lowest quality for slow connections.</span>
            </li>

            <li>
              <strong>🌍 Global latency</strong><br>
              <span style="color:#888;">DB is in US-East. Users in India/Europe get 200ms+ latency.</span><br>
              <span style="color:#555;margin-top:4px;display:block;">Fix: Multi-region deployment. Read replicas in each region. Writes still go to primary (US-East), reads served locally. CDN handles all static content globally.</span>
            </li>

          </ul>

          <div style="margin-top:20px;">
            <div class="content-label">Key trade-offs summary</div>
            <table class="nfr-table">
              <tr><td>Consistency vs Speed</td><td>Vote counts use eventual consistency — 30s delay is fine. Auth uses strong consistency — must be accurate.</td></tr>
              <tr><td>Storage vs Speed</td><td>Cache score on post row (redundant data) to avoid expensive COUNT() on every feed load.</td></tr>
              <tr><td>Simplicity vs Scale</td><td>Recursive comments are simple but slow at scale. Switch to Closure Table when needed.</td></tr>
              <tr><td>Cost vs Latency</td><td>CDN costs money but cuts latency from 200ms to 20ms for global users — worth it.</td></tr>
            </table>
          </div>
        `
      }
    ]
  }
};

// ── URL SHORTENER ──────────────────────────────────────
systems['urlshortener'] = {
  name: 'URL Shortener',
  sub: 'Link shortening service (like bit.ly)',
  steps: [
    {
      name: 'Functional Requirements',
      content: `
        <div class="content-label">What the system must do</div>
        <ul class="req-list">
          <li><strong>Shorten</strong> — given a long URL, return a short code (e.g. bit.ly/xK93p)</li>
          <li><strong>Redirect</strong> — visiting the short URL redirects to the original long URL</li>
          <li><strong>Custom alias</strong> — user can optionally choose their own short code</li>
          <li><strong>Expiry</strong> — links can have a TTL after which they stop working</li>
          <li><strong>Analytics</strong> — track clicks, referrer, location, device per link</li>
          <li><strong>User accounts</strong> — users can manage their links, see stats, delete them</li>
        </ul>
      `
    },
    {
      name: 'Non-Functional Requirements',
      content: `
        <div class="content-label">How well it must perform</div>
        <table class="nfr-table">
          <tr><td>Low Latency</td><td>Redirect must happen in &lt;10ms — user is waiting in browser</td></tr>
          <tr><td>High Availability</td><td>99.99% uptime — a dead short link is a broken experience</td></tr>
          <tr><td>Read Heavy</td><td>100:1 read-to-write — far more redirects than link creations</td></tr>
          <tr><td>Uniqueness</td><td>No two long URLs should produce the same short code</td></tr>
          <tr><td>Unpredictability</td><td>Short codes must not be guessable (sequential IDs are bad)</td></tr>
          <tr><td>Durability</td><td>Links should never be lost once created</td></tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
        <div class="insight-box" style="margin-bottom:10px;">
          CAP Theorem: pick <strong>CP</strong> (consistency + partition tolerance) or <strong>AP</strong> (availability + partition tolerance). Partition tolerance is always required.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>URL mappings</strong><br><span style="color:#888;font-size:11px;">PostgreSQL or DynamoDB (AP)</span></td>
            <td>Short code → long URL lookup. Eventual consistency is fine — if a newly created link takes 100ms to propagate, nobody notices. Choose AP: availability is critical. DynamoDB scales writes better here.</td>
          </tr>
          <tr>
            <td><strong>Redirect cache</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td>
            <td>99% of traffic is redirects for popular links. Redis Cache-Aside pattern: on hit → instant redirect; on miss → DB lookup → cache populate. Cache is AP by nature.</td>
          </tr>
          <tr>
            <td><strong>Analytics / Click counts</strong><br><span style="color:#888;font-size:11px;">Cassandra or ClickHouse (AP)</span></td>
            <td>Write-heavy append-only data (every click = a row). Cassandra is AP — highly available for writes, eventual consistency on reads. ClickHouse for analytical queries (top links, geographic data).</td>
          </tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;">Cache-Aside (Lazy Loading)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Check Redis first. Miss → fetch from DB → write to Redis → return. This pattern is perfect for URL shorteners because 80% of redirects are to the same popular links (hot keys in cache).</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;">Write-Ahead Log / Append-Only for Analytics</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Every click is appended to Kafka (never updated). Workers batch-insert into Cassandra/ClickHouse. Decouples the fast redirect path from slow analytics writes — redirect is never slowed down by analytics.</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#a16207;">Base62 Encoding + Snowflake ID (Unique ID Generation Pattern)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Generate a globally unique Snowflake ID → convert to Base62 → use as short code. Guarantees no collisions across distributed instances without coordination (no central lock needed).</div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:12px;">💡 Redirect latency is the most critical metric — every millisecond is felt by the user in their browser. The entire design optimizes for the <strong>read path</strong>.</div>
      `
    },
    {
      name: 'Capacity Estimation',
      content: `
        <div class="content-label">Assumed: 100K DAU</div>
        <div class="cap-calc">
          <div class="cap-calc-row">
            <div class="cap-calc-label">Links created / day</div>
            <div class="cap-calc-math">100K users × 1% actually create a link</div>
            <div class="cap-calc-result">1K / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Redirects / day</div>
            <div class="cap-calc-math">1K links × avg 100 clicks per link over its lifetime</div>
            <div class="cap-calc-result">100K / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Write speed</div>
            <div class="cap-calc-math">1K new links/day ÷ 86,400 sec/day (avg)<br>Peak ~10× avg during business hours</div>
            <div class="cap-calc-result">~0.01/sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Read speed</div>
            <div class="cap-calc-math">100K redirects/day ÷ 86,400 sec/day</div>
            <div class="cap-calc-result">~1.2/sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Storage / year</div>
            <div class="cap-calc-math">1K links/day × 500 bytes/record × 365 days = 182 MB</div>
            <div class="cap-calc-result">~180 MB/yr</div>
          </div>
        </div>
        <div class="insight-box">
          Storage is tiny — 180 MB for a whole year. The system is <strong>read-heavy (100:1)</strong>. The bottleneck is redirect latency, not compute or disk. That's why a Redis cache in front of the DB is the most important component.
        </div>
      `
    },
    {
      name: 'High Level Design (HLD)',
      content: `
        <div class="content-label">Architecture</div>
        <div class="hld-graph">
          <div class="layer-name">Client</div>
          <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">Browser / App</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Edge</div>
          <div class="hld-row">
            <div class="hld-node c-orange">⚖️ Load Balancer</div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Services</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-green">✂️ Shortener Service<div class="node-sub">Create short codes</div></div>
              <div class="hld-node c-green">↗️ Redirect Service<div class="node-sub">Resolve &amp; redirect</div></div>
              <div class="hld-node c-green">📊 Analytics Service<div class="node-sub">Track clicks async</div></div>
            </div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Cache & Messaging</div>
          <div class="hld-row">
            <div class="hld-node c-purple">⚡ Redis<div class="node-sub">shortcode → URL cache</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Click events async</div></div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Storage</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">URLs, users</div></div>
              <div class="hld-node c-red">📊 ClickHouse<div class="node-sub">Analytics (OLAP)</div></div>
            </div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:16px;">
          <strong>Redirect flow (hottest path):</strong> Browser hits Redirect Service → check Redis (cache hit ~1ms) → return 301/302 redirect → fire click event to Kafka async. The redirect never waits for analytics.
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">301 vs 302 redirect</div>
          <table class="nfr-table">
            <tr><td><strong>301 Permanent</strong></td><td>Browser caches it — future visits skip your server entirely. Faster for user, but you lose click analytics.</td></tr>
            <tr><td><strong>302 Temporary</strong></td><td>Browser always hits your server. Slower, but you capture every click for analytics.</td></tr>
          </table>
          <div class="insight-box" style="margin-top:8px;">bit.ly uses <strong>302</strong> — analytics is their product. Use 301 only if you don't need click tracking.</div>
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">Service communication</div>
          <div class="comm-block">
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Browser → Redirect Service → Redis → return redirect (user waiting)</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Redirect Service → Kafka → Analytics Service → ClickHouse (background)</div>
          </div>
        </div>
      `
    },
    {
      name: 'Data Modeling',
      content: `
        <div class="content-label">Tables</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <div class="db-node">
            <div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;">
              <span class="db-node-icon">👤</span><span class="db-node-name">users</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row">email <span>VARCHAR · UNIQUE</span></div>
              <div class="db-row">created_at <span>TIMESTAMP</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#fefce8;border-color:#fef08a;">
              <span class="db-node-icon">🔗</span><span class="db-node-name">urls</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 short_code <span>VARCHAR(8) · PK</span></div>
              <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
              <div class="db-row">long_url <span>TEXT · NOT NULL</span></div>
              <div class="db-row">expires_at <span>TIMESTAMP · nullable</span></div>
              <div class="db-row">created_at <span>TIMESTAMP</span></div>
            </div>
          </div>
          <div class="db-node" style="grid-column:1/-1;">
            <div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;">
              <span class="db-node-icon">📊</span><span class="db-node-name">clicks (ClickHouse — analytics)</span>
            </div>
            <div class="db-node-body" style="display:grid;grid-template-columns:1fr 1fr;">
              <div class="db-row fk">🔗 short_code <span>FK → urls</span></div>
              <div class="db-row">clicked_at <span>TIMESTAMP</span></div>
              <div class="db-row">country <span>VARCHAR</span></div>
              <div class="db-row">device <span>VARCHAR</span></div>
              <div class="db-row">referrer <span>VARCHAR</span></div>
              <div class="db-row">ip_hash <span>VARCHAR</span></div>
            </div>
          </div>
        </div>

        <div class="content-label">Relationship graph</div>
        <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
          <svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
            <rect x="20" y="50" width="150" height="100" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="95" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">👤 users</text>
            <line x1="20" y1="80" x2="170" y2="80" stroke="#bfdbfe" stroke-width="1"/>
            <text x="30" y="95" font-size="10" fill="#555">🔑 id · UUID · PK</text>
            <text x="30" y="110" font-size="10" fill="#888">email · UNIQUE</text>
            <text x="30" y="125" font-size="10" fill="#888">created_at</text>

            <rect x="210" y="20" width="150" height="110" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
            <text x="285" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">🔗 urls</text>
            <line x1="210" y1="50" x2="360" y2="50" stroke="#fef08a" stroke-width="1"/>
            <text x="220" y="65" font-size="10" fill="#555">🔑 short_code · VARCHAR · PK</text>
            <text x="220" y="79" font-size="10" fill="#0369a1">🔗 user_id → users</text>
            <text x="220" y="93" font-size="10" fill="#888">long_url · TEXT</text>
            <text x="220" y="107" font-size="10" fill="#888">expires_at · TIMESTAMP</text>
            <text x="220" y="121" font-size="10" fill="#888">created_at</text>

            <rect x="210" y="155" width="150" height="35" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <text x="285" y="172" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">📊 clicks</text>
            <text x="285" y="184" text-anchor="middle" font-size="10" fill="#888">short_code, clicked_at, country…</text>

            <line x1="170" y1="80" x2="210" y2="70" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr2)"/>
            <text x="178" y="68" font-size="9" fill="#aaa">creates</text>
            <line x1="285" y1="130" x2="285" y2="155" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr2)" stroke-dasharray="4,2"/>
            <text x="290" y="147" font-size="9" fill="#aaa">tracks</text>
          </svg>
        </div>

        <div class="insight-box" style="margin-top:16px;">
          <strong>Why short_code as PK?</strong> Every redirect lookup is <code>WHERE short_code = ?</code> — making it the PK gives O(1) lookup without a secondary index. No UUID needed for urls table.
        </div>
      `
    },
    {
      name: 'Deep Dive — Short Code Generation',
      content: `
        <div class="content-label">How do we generate unique short codes?</div>
        <div class="insight-box">The core challenge: generate a short (6–8 char), unique, unpredictable code for every URL. Three approaches — each with trade-offs.</div>

        <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
          <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:6px;">Option 1 — MD5 Hash (simple)</div>
            <div style="font-family:monospace;font-size:12px;color:#555;background:#fff;padding:8px;border-radius:4px;border:1px solid #eee;">
              hash = MD5("https://example.com/long")<br>
              short_code = first 7 chars of base62(hash)
            </div>
            <div style="font-size:12px;color:#888;margin-top:8px;">✅ Simple &nbsp; ❌ Hash collisions possible — two different URLs could produce the same 7 chars</div>
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:6px;">Option 2 — Snowflake ID + Base62 (recommended)</div>
            <div style="font-family:monospace;font-size:12px;color:#555;background:#fff;padding:8px;border-radius:4px;border:1px solid #eee;">
              id = Snowflake() &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // unique 64-bit int<br>
              short_code = Base62(id) &nbsp; // "xK93pZa"
            </div>
            <div style="font-size:12px;color:#888;margin-top:8px;">✅ Globally unique &nbsp; ✅ No collision &nbsp; ✅ No DB pre-check needed &nbsp; ✅ Unpredictable</div>
          </div>

          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#a16207;margin-bottom:6px;">Option 3 — Pre-generated Key Table</div>
            <div style="font-size:12px;color:#555;">Pre-generate millions of random codes offline, store in a <code>key_store</code> table. On each request, pop one out. Simple but needs key management.</div>
            <div style="font-size:12px;color:#888;margin-top:8px;">✅ No generation logic at runtime &nbsp; ❌ Key exhaustion, needs refill job</div>
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Base62 explained</div>
          <div class="insight-box">
            Base62 uses: <strong style="color:#222;">a-z + A-Z + 0-9 = 62 characters</strong><br><br>
            A 7-char Base62 code = 62⁷ = <strong style="color:#222;">3.5 trillion</strong> possible codes. You'll never run out.
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Redirect flow in detail</div>
          <ul class="req-list">
            <li><strong>1.</strong> Browser hits GET /xK93pZa</li>
            <li><strong>2.</strong> Redirect Service checks Redis → cache hit → return 302 to long URL (&lt;5ms)</li>
            <li><strong>3.</strong> Cache miss → query PostgreSQL → store in Redis (TTL 24h) → return 302</li>
            <li><strong>4.</strong> Async: fire click event to Kafka → Analytics Service writes to ClickHouse</li>
            <li><strong>5.</strong> Check expiry: if expires_at &lt; now → return 410 Gone</li>
          </ul>
        </div>
      `
    },
    {
      name: 'Bottlenecks & Trade-offs',
      content: `
        <div class="content-label">What breaks at scale</div>
        <ul class="req-list" style="gap:10px;">
          <li>
            <strong>🔥 Hot links (viral URLs)</strong><br>
            <span style="color:#888;">One short link shared on Twitter gets 1M hits in 10 min. Single Redis key gets hammered.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Redis cluster with read replicas. Popular links get extra TTL. CDN-level caching for the most viral links.</span>
          </li>
          <li>
            <strong>💥 Hash collisions</strong><br>
            <span style="color:#888;">MD5 approach: two URLs produce the same 7-char prefix.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Use Snowflake IDs — mathematically guaranteed unique. No collision possible.</span>
          </li>
          <li>
            <strong>📊 Analytics slowing down redirects</strong><br>
            <span style="color:#888;">Writing click data on every redirect would add 50ms+ of latency.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Fire-and-forget to Kafka. Redirect returns immediately, analytics processed in background.</span>
          </li>
          <li>
            <strong>🗑️ Expired link cleanup</strong><br>
            <span style="color:#888;">Millions of expired links pile up in the DB over time.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Background job runs nightly, deletes rows where expires_at &lt; now. Index on expires_at makes this fast.</span>
          </li>
        </ul>
        <div style="margin-top:20px;">
          <div class="content-label">Key trade-offs</div>
          <table class="nfr-table">
            <tr><td>301 vs 302</td><td>302 = analytics but slower. 301 = fast but no click data. Pick based on product need.</td></tr>
            <tr><td>Hash vs Snowflake</td><td>Hash is simpler but collision-prone. Snowflake is better but needs a distributed ID service.</td></tr>
            <tr><td>Redirect latency vs analytics</td><td>Always async analytics — redirect is the user-facing SLA, analytics is not.</td></tr>
          </table>
        </div>
      `
    }
  ]
};

// ── SPOTIFY ──────────────────────────────────────────────
systems['spotify'] = {
  name: 'Spotify',
  sub: 'Audio streaming platform',
  steps: [
    {
      name: 'Functional Requirements',
      content: `
        <div class="content-label">What the system must do</div>
        <ul class="req-list">
          <li><strong>Stream audio</strong> — play songs with minimal buffering on any device</li>
          <li><strong>Search</strong> — search songs, artists, albums, playlists</li>
          <li><strong>Playlists</strong> — create, edit, share playlists</li>
          <li><strong>Recommendations</strong> — personalized Discover Weekly, Daily Mix</li>
          <li><strong>Offline playback</strong> — download songs for offline listening (Premium)</li>
          <li><strong>Cross-device sync</strong> — pause on phone, resume on laptop</li>
          <li><strong>Podcasts</strong> — browse and play podcast episodes</li>
          <li><strong>Social</strong> — follow artists, see friends' activity</li>
        </ul>
      `
    },
    {
      name: 'Non-Functional Requirements',
      content: `
        <div class="content-label">How well it must perform</div>
        <table class="nfr-table">
          <tr><td>Low Latency</td><td>Song starts playing within 250ms of pressing play</td></tr>
          <tr><td>High Availability</td><td>99.9% uptime — music is an always-on experience</td></tr>
          <tr><td>Adaptive Streaming</td><td>Adjust bitrate automatically based on network speed</td></tr>
          <tr><td>Scalability</td><td>Handle global peak traffic (Monday morning, Friday releases)</td></tr>
          <tr><td>DRM</td><td>Audio files encrypted — only paying users can download and play</td></tr>
          <tr><td>Read Heavy</td><td>Streaming >> uploads. 400M listeners vs a few thousand artists uploading</td></tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
        <div class="insight-box" style="margin-bottom:10px;">
          CAP Theorem: pick <strong>CP</strong> or <strong>AP</strong>. Different parts of Spotify need different choices — there is no single right DB.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>Song metadata / Playlists</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td>
            <td>Track title, artist, album, playlist order — must be consistent. If you save a playlist, it must appear immediately. Relational data, strong consistency needed. CP.</td>
          </tr>
          <tr>
            <td><strong>User sessions / Playback state</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td>
            <td>Current playing track, position, device — changes every second. Available across devices quickly. Eventual consistency is fine (1–2 sec sync delay is invisible). AP.</td>
          </tr>
          <tr>
            <td><strong>Play history / Listening events</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td>
            <td>Every play = a row appended. Billions of events/day. Cassandra is AP and optimised for time-series write-heavy workloads. Powers Discover Weekly ML pipeline.</td>
          </tr>
          <tr>
            <td><strong>Audio files</strong><br><span style="color:#888;font-size:11px;">S3 + CDN</span></td>
            <td>Object storage — immutable files. Once uploaded, never changed. CDN serves from nearest edge node. Not a CP/AP choice — it's pure AP by nature (availability is key).</td>
          </tr>
          <tr>
            <td><strong>Search (songs, artists)</strong><br><span style="color:#888;font-size:11px;">Elasticsearch (AP)</span></td>
            <td>Full-text + fuzzy search. Index can be slightly behind (new songs take seconds to appear). AP is fine — availability matters more than seeing the song 2 seconds after upload.</td>
          </tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;">CDN Pre-warming (Hotspot Mitigation)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">New Taylor Swift album drops Friday → millions of streams in minutes. Pre-push those audio files to CDN edge nodes before release time. Prevents origin server overload at launch.</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;">Event Sourcing (Listening History)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Every play event is stored immutably in Cassandra (not updated). The full history IS the source of truth — ML models replay this stream to build recommendations. Classic event sourcing pattern.</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#a16207;">Presigned URL Pattern (Secure Content Delivery)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Audio files are private in S3. When user hits Play, backend issues a short-lived presigned URL (15 min expiry). Browser streams directly from CDN using that URL — API server never handles audio bytes.</div>
          </div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#7e22ce;">Offline-First + Sync Pattern</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Premium users download DRM-encrypted files locally. App stores last known state on device. On reconnect, syncs play position and queue changes back to server. Conflict resolution: last-write-wins by timestamp.</div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:12px;">💡 Spotify's key insight: serve audio from CDN close to the user. A song in Mumbai should come from a Mumbai CDN node, not Sweden.</div>
      `
    },
    {
      name: 'Capacity Estimation',
      content: `
        <div class="content-label">Assumed: 100K DAU</div>
        <div class="cap-calc">
          <div class="cap-calc-row">
            <div class="cap-calc-label">Concurrent listeners</div>
            <div class="cap-calc-math">100K DAU × 50% online at peak hour</div>
            <div class="cap-calc-result">50K streams</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Bandwidth per stream</div>
            <div class="cap-calc-math">320kbps (high quality) = 320,000 bits/sec ÷ 8<br>= 40 KB/s per stream</div>
            <div class="cap-calc-result">~40 KB/s</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Total outbound</div>
            <div class="cap-calc-math">50K concurrent streams × 40 KB/s per stream<br>= 2,000,000 KB/s = 2 GB/s</div>
            <div class="cap-calc-result">~2 GB/s</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Avg song size</div>
            <div class="cap-calc-math">3 min × 60 sec × 40 KB/s (320kbps)<br>= 7,200 KB ≈ 7 MB per track</div>
            <div class="cap-calc-result">~5–7 MB</div>
          </div>
        </div>
        <div class="insight-box">
          Bandwidth is the dominant cost — 2 GB/s outbound from origin. This is why <strong>CDN is non-negotiable</strong>: audio files are pushed to edge nodes near listeners, so most traffic never hits the origin at all.
        </div>
      `
    },
    {
      name: 'High Level Design (HLD)',
      content: `
        <div class="content-label">Architecture</div>
        <div class="hld-graph">
          <div class="layer-name">Client</div>
          <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">iOS / Android / Web</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Edge — audio served here, not from origin</div>
          <div class="hld-row">
            <div class="hld-node c-orange">🌐 CDN<div class="node-sub">Audio files at edge</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-orange">⚖️ Load Balancer<div class="node-sub">API traffic</div></div>
          </div>
          <div class="hld-arrow">↓ API only (audio goes directly CDN → client)</div>
          <div class="layer-name">API Gateway</div>
          <div class="hld-row"><div class="hld-node c-teal">🚪 API Gateway<div class="node-sub">Auth · Routing</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Microservices</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-green">▶️ Stream Service<div class="node-sub">Presigned URLs</div></div>
              <div class="hld-node c-green">🔍 Search Service<div class="node-sub">Elasticsearch</div></div>
              <div class="hld-node c-green">🎵 Playlist Service<div class="node-sub">CRUD playlists</div></div>
              <div class="hld-node c-green">🤖 Recommend Service<div class="node-sub">ML models</div></div>
              <div class="hld-node c-green">🔄 Sync Service<div class="node-sub">Cross-device state</div></div>
            </div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Cache & Messaging</div>
          <div class="hld-row">
            <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Sessions, play state</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Play events → ML</div></div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Storage</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Users, metadata</div></div>
              <div class="hld-node c-red">🔎 Elasticsearch<div class="node-sub">Song search</div></div>
              <div class="hld-node c-red">🪣 S3<div class="node-sub">Audio files (DRM)</div></div>
            </div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:16px;">
          <strong>Audio never goes through your API server.</strong> Client asks Stream Service for a presigned S3 URL → Stream Service returns a short-lived CDN URL → client streams directly from CDN. Your backend handles metadata, not megabytes.
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">Service communication</div>
          <div class="comm-block">
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Client → Stream Service → returns presigned CDN URL (user waiting to press play)</div>
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Client → Search Service → Elasticsearch results</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Every song play → Kafka → Recommendation engine (feeds ML model)</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Play state → Redis → Sync Service fans out to other devices</div>
          </div>
        </div>
      `
    },
    {
      name: 'Data Modeling',
      content: `
        <div class="content-label">Tables</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <div class="db-node">
            <div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;">
              <span class="db-node-icon">👤</span><span class="db-node-name">users</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row">email <span>VARCHAR · UNIQUE</span></div>
              <div class="db-row">plan <span>ENUM (free, premium)</span></div>
              <div class="db-row">country <span>VARCHAR</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#fefce8;border-color:#fef08a;">
              <span class="db-node-icon">🎵</span><span class="db-node-name">songs</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row fk">🔗 artist_id <span>FK → artists</span></div>
              <div class="db-row fk">🔗 album_id <span>FK → albums</span></div>
              <div class="db-row">title <span>VARCHAR</span></div>
              <div class="db-row">duration_sec <span>INT</span></div>
              <div class="db-row">s3_key <span>VARCHAR (audio file)</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;">
              <span class="db-node-icon">📋</span><span class="db-node-name">playlists</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
              <div class="db-row">name <span>VARCHAR</span></div>
              <div class="db-row">is_public <span>BOOLEAN</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;">
              <span class="db-node-icon">➕</span><span class="db-node-name">playlist_songs</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 playlist_id <span>FK → playlists</span></div>
              <div class="db-row pk">🔑 song_id <span>FK → songs</span></div>
              <div class="db-row">position <span>INT (ordering)</span></div>
              <div class="db-row">added_at <span>TIMESTAMP</span></div>
            </div>
          </div>
          <div class="db-node" style="grid-column:1/-1;">
            <div class="db-node-header" style="background:#fff7ed;border-color:#fed7aa;">
              <span class="db-node-icon">▶️</span><span class="db-node-name">play_events (Kafka → data warehouse)</span>
            </div>
            <div class="db-node-body" style="display:grid;grid-template-columns:1fr 1fr;">
              <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
              <div class="db-row fk">🔗 song_id <span>FK → songs</span></div>
              <div class="db-row">played_at <span>TIMESTAMP</span></div>
              <div class="db-row">percent_played <span>INT (0–100)</span></div>
              <div class="db-row">device_type <span>VARCHAR</span></div>
              <div class="db-row">skipped <span>BOOLEAN</span></div>
            </div>
          </div>
        </div>

        <div class="content-label">Relationship graph</div>
        <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
          <svg viewBox="0 0 560 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <defs><marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
            <rect x="10" y="80" width="130" height="80" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="75" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">👤 users</text>
            <line x1="10" y1="108" x2="140" y2="108" stroke="#bfdbfe" stroke-width="1"/>
            <text x="20" y="122" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="20" y="136" font-size="10" fill="#888">email, plan</text>
            <text x="20" y="150" font-size="10" fill="#888">country</text>

            <rect x="200" y="10" width="150" height="100" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
            <text x="275" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">🎵 songs</text>
            <line x1="200" y1="38" x2="350" y2="38" stroke="#fef08a" stroke-width="1"/>
            <text x="210" y="52" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="210" y="66" font-size="10" fill="#0369a1">🔗 artist_id, album_id</text>
            <text x="210" y="80" font-size="10" fill="#888">title, duration_sec</text>
            <text x="210" y="94" font-size="10" fill="#888">s3_key</text>

            <rect x="200" y="150" width="140" height="70" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <text x="270" y="170" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">📋 playlists</text>
            <line x1="200" y1="178" x2="340" y2="178" stroke="#bbf7d0" stroke-width="1"/>
            <text x="210" y="192" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="210" y="206" font-size="10" fill="#0369a1">🔗 user_id → users</text>

            <rect x="390" y="80" width="150" height="80" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
            <text x="465" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">➕ playlist_songs</text>
            <line x1="390" y1="108" x2="540" y2="108" stroke="#e9d5ff" stroke-width="1"/>
            <text x="400" y="122" font-size="10" fill="#555">🔑 playlist_id (FK)</text>
            <text x="400" y="136" font-size="10" fill="#555">🔑 song_id (FK)</text>
            <text x="400" y="150" font-size="10" fill="#888">position, added_at</text>

            <line x1="140" y1="120" x2="200" y2="175" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr3)"/>
            <text x="148" y="152" font-size="9" fill="#aaa">owns</text>
            <line x1="275" y1="110" x2="275" y2="150" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr3)" stroke-dasharray="4,2"/>
            <line x1="340" y1="185" x2="390" y2="135" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr3)"/>
            <line x1="350" y1="60" x2="390" y2="110" stroke="#ccc" stroke-width="1.5" marker-end="url(#arr3)" stroke-dasharray="4,2"/>
          </svg>
        </div>
        <div class="insight-box" style="margin-top:12px;">
          <strong>playlist_songs</strong> is a junction table — many-to-many between playlists and songs. The <code>position</code> column preserves song ordering within a playlist.
        </div>
      `
    },
    {
      name: 'Deep Dive — Audio Streaming',
      content: `
        <div class="content-label">How a song actually plays</div>
        <ul class="req-list">
          <li><strong>1. Press play</strong> — client calls Stream Service: GET /stream/song_id</li>
          <li><strong>2. Auth check</strong> — is user premium? Is song licensed in their country?</li>
          <li><strong>3. Presigned URL</strong> — Stream Service generates a short-lived CDN URL (expires in 60s)</li>
          <li><strong>4. Direct stream</strong> — client fetches audio directly from CDN. Your servers handle zero bytes of audio.</li>
          <li><strong>5. Play event</strong> — client fires play event to Kafka (async, doesn't block audio)</li>
        </ul>

        <div style="margin-top:20px;">
          <div class="content-label">Adaptive Bitrate Streaming (ABR)</div>
          <div class="insight-box">
            Each song is stored at <strong>3 quality levels</strong> in S3:<br><br>
            96 kbps — low quality, for slow connections (~700KB/min)<br>
            160 kbps — normal quality (~1.2MB/min)<br>
            320 kbps — high quality (Premium only, ~2.4MB/min)<br><br>
            The client monitors network speed and switches between qualities mid-stream without interruption. This is how Spotify plays smoothly on a 3G connection.
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Cross-device sync</div>
          <div class="insight-box">
            When you pause on your phone and open Spotify on your laptop, it resumes from the same position. How?<br><br>
            <strong style="color:#222;">Play state stored in Redis:</strong> { user_id, song_id, position_ms, device_id, is_playing }<br><br>
            Every 5 seconds, the active device writes its state to Redis. When another device opens, it reads from Redis and jumps to the same position.
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Recommendations — how Discover Weekly works</div>
          <div class="insight-box">
            Every play event goes to Kafka → ML pipeline. Spotify uses <strong>Collaborative Filtering</strong>: "users who listened to X also liked Y."<br><br>
            Discover Weekly runs as a batch job every Monday — processes the week's play events, generates a personalized 30-song playlist for each user, and writes it to their account.
          </div>
        </div>
      `
    },
    {
      name: 'Bottlenecks & Trade-offs',
      content: `
        <div class="content-label">What breaks at scale</div>
        <ul class="req-list" style="gap:10px;">
          <li>
            <strong>🌍 Global bandwidth cost</strong><br>
            <span style="color:#888;">Serving audio from a single origin = massive latency + cost.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: CDN with 200+ edge nodes globally. Audio cached close to listeners. Spotify negotiates ISP peering agreements to reduce costs.</span>
          </li>
          <li>
            <strong>🎸 New release spike (Taylor Swift drops an album)</strong><br>
            <span style="color:#888;">Millions hit play on the same song simultaneously. CDN cache is cold for the new file.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Pre-warm CDN before major releases. Spotify knows release dates in advance — push files to edge nodes before launch.</span>
          </li>
          <li>
            <strong>🔒 DRM complexity</strong><br>
            <span style="color:#888;">Offline downloads must be encrypted so they only play on the licensed device.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Audio files encrypted with Widevine/FairPlay DRM. Decryption key tied to user account + device ID. Key expires if subscription lapses.</span>
          </li>
          <li>
            <strong>🤖 Stale recommendations</strong><br>
            <span style="color:#888;">Batch ML runs weekly — new users get generic recommendations for their first week.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: "Taste profile" built in real-time after first 5 songs. Cold start problem solved by genre preferences at signup.</span>
          </li>
        </ul>
        <div style="margin-top:20px;">
          <div class="content-label">Key trade-offs</div>
          <table class="nfr-table">
            <tr><td>Audio via CDN vs API</td><td>CDN = fast but cold start latency on new files. API = slow and expensive. CDN always wins for audio.</td></tr>
            <tr><td>Batch vs real-time ML</td><td>Batch weekly = simpler, cheaper. Real-time = better recommendations but complex infra. Spotify uses both.</td></tr>
            <tr><td>Adaptive bitrate</td><td>Lower quality = worse experience. Higher quality = more bandwidth cost. ABR balances both dynamically.</td></tr>
          </table>
        </div>
      `
    }
  ]
};

// placeholder for all other systems
// ── AIRBNB ───────────────────────────────────────────────
systems['airbnb'] = {
  name: 'Airbnb',
  sub: 'Home rental marketplace',
  steps: [
    {
      name: 'Functional Requirements',
      content: `
        <div class="content-label">What the system must do</div>
        <ul class="req-list">
          <li><strong>List a property</strong> — hosts can add listings with photos, description, price, availability</li>
          <li><strong>Search</strong> — guests search by location, dates, guests, filters (price, amenities)</li>
          <li><strong>Availability calendar</strong> — real-time view of which dates are open/booked</li>
          <li><strong>Booking</strong> — guests can request or instantly book a listing for specific dates</li>
          <li><strong>Payments</strong> — process payment from guest, hold in escrow, release to host after check-in</li>
          <li><strong>Reviews</strong> — guests and hosts review each other after a stay</li>
          <li><strong>Messaging</strong> — guests and hosts communicate before/during booking</li>
          <li><strong>Notifications</strong> — booking requests, confirmations, reminders via email/push</li>
        </ul>
      `
    },
    {
      name: 'Non-Functional Requirements',
      content: `
        <div class="content-label">How well it must perform</div>
        <table class="nfr-table">
          <tr><td>Low Latency Search</td><td>Search results under 200ms — geo search with filters is expensive</td></tr>
          <tr><td>Strong Consistency</td><td>No double bookings — two guests cannot book same listing same dates</td></tr>
          <tr><td>High Availability</td><td>99.9% — a booking platform being down means lost revenue</td></tr>
          <tr><td>Scalability</td><td>Handle peak traffic (holidays, major events in a city)</td></tr>
          <tr><td>Fraud Prevention</td><td>Detect fake listings and fraudulent payments</td></tr>
          <tr><td>Read Heavy</td><td>Many more searches than bookings — 1000:1 ratio</td></tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
        <div class="insight-box" style="margin-bottom:10px;">
          Airbnb is unique: search needs <strong>AP</strong> (availability + speed), but bookings need <strong>CP</strong> (no double booking). You use different databases for different parts of the same system.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>Bookings &amp; Listings</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td>
            <td>Must be strongly consistent — double booking is a business disaster. Supports transactions + row-level locking (SELECT FOR UPDATE). Choose CP: never sacrifice consistency for availability here.</td>
          </tr>
          <tr>
            <td><strong>Search index</strong><br><span style="color:#888;font-size:11px;">Elasticsearch (AP)</span></td>
            <td>Geo-distance queries + filters. Slightly stale search results (a listing shows as available for 5s after being booked) is acceptable. AP: high availability for read-heavy search traffic.</td>
          </tr>
          <tr>
            <td><strong>Search cache / Sessions</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td>
            <td>Cache popular search queries (Mumbai, Dec 20–25). Session tokens. AP — availability matters, slight staleness is fine. TTL of 5 minutes on search results.</td>
          </tr>
          <tr>
            <td><strong>Listing photos</strong><br><span style="color:#888;font-size:11px;">S3 + CDN</span></td>
            <td>Immutable object storage. Listing photos never change once uploaded — perfect for CDN caching. AP by nature.</td>
          </tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#dc2626;">Pessimistic Locking (Critical Section)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Booking uses <code>SELECT ... FOR UPDATE</code> to lock the row before checking availability. Prevents race conditions when two users book simultaneously. Used where correctness > speed.</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#a16207;">Saga Pattern (Distributed Transaction)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Booking = multi-step: reserve dates → charge payment → send confirmation. If payment fails, a compensating transaction auto-releases the reservation. No two-phase commit needed — sagas handle failure gracefully.</div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;">CQRS — Separate Read and Write Models</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Writes (book listing) → PostgreSQL with strong consistency. Reads (search listings) → Elasticsearch + Redis cache. Completely different paths, different stores, different consistency guarantees.</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;">Geohashing (Spatial Indexing)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Earth divided into a grid of cells (geohash strings). Listings near each other share a geohash prefix. Search "within 5km of Mumbai" = find all listings whose geohash starts with the Mumbai cell prefix. Much faster than distance math on every listing.</div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:12px;">💡 The hardest problem: <strong>preventing double booking</strong>. Two users booking the same dates must be handled atomically — this requires strong consistency, not eventual consistency.</div>
      `
    },
    {
      name: 'Capacity Estimation',
      content: `
        <div class="content-label">Assumed: 100K DAU</div>
        <div class="cap-calc">
          <div class="cap-calc-row">
            <div class="cap-calc-label">Searches / day</div>
            <div class="cap-calc-math">100K users × 5 searches per session (browse, filter, refine)</div>
            <div class="cap-calc-result">500K / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Search / sec</div>
            <div class="cap-calc-math">500K searches/day ÷ 86,400 sec/day</div>
            <div class="cap-calc-result">~6 / sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Bookings / day</div>
            <div class="cap-calc-math">100K users × 1% conversion (browsing → booking)</div>
            <div class="cap-calc-result">~1K / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Listing payload</div>
            <div class="cap-calc-math">Text metadata ~2 KB + photos served via CDN separately<br>(10 photos × ~300KB each = 3 MB via CDN)</div>
            <div class="cap-calc-result">~10 KB API</div>
          </div>
        </div>
        <div class="insight-box">
          Search is the dominant load — each query hits Elasticsearch with geo + date + price + room-type filters. The DB write rate for bookings is tiny (1K/day = 0.01/sec), but each booking needs <strong>pessimistic locking</strong> to prevent double-booking.
        </div>
      `
    },
    {
      name: 'High Level Design (HLD)',
      content: `
        <div class="content-label">Architecture</div>
        <div class="hld-graph">
          <div class="layer-name">Client</div>
          <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">Web / Mobile</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Edge</div>
          <div class="hld-row">
            <div class="hld-node c-orange">🌐 CDN<div class="node-sub">Listing photos</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-orange">⚖️ Load Balancer</div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">API Gateway</div>
          <div class="hld-row"><div class="hld-node c-teal">🚪 API Gateway<div class="node-sub">Auth · Routing</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Microservices</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-green">🔍 Search Service<div class="node-sub">Geo + date filter</div></div>
              <div class="hld-node c-green">🏠 Listing Service<div class="node-sub">CRUD listings</div></div>
              <div class="hld-node c-green">📅 Booking Service<div class="node-sub">Reserve dates</div></div>
              <div class="hld-node c-green">💳 Payment Service<div class="node-sub">Escrow + payout</div></div>
              <div class="hld-node c-green">🔔 Notification Svc<div class="node-sub">Email / push</div></div>
            </div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Cache & Messaging</div>
          <div class="hld-row">
            <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Search cache, sessions</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Booking events async</div></div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Storage</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Listings, bookings</div></div>
              <div class="hld-node c-red">🔎 Elasticsearch<div class="node-sub">Geo search index</div></div>
              <div class="hld-node c-red">🪣 S3<div class="node-sub">Listing photos</div></div>
            </div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:16px;">
          <strong>Booking uses a DB transaction + pessimistic lock</strong> to prevent double booking: <code>SELECT ... FOR UPDATE</code> locks the availability row → check no conflict → insert booking → commit. Two simultaneous requests: second one waits, then sees conflict and fails cleanly.
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">Service communication</div>
          <div class="comm-block">
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Search → Elasticsearch → results (user waiting)</div>
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Booking → PostgreSQL (locked transaction, must be atomic)</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Booking confirmed → Kafka → Notification + Payment release (background)</div>
          </div>
        </div>
      `
    },
    {
      name: 'Data Modeling',
      content: `
        <div class="content-label">Tables</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <div class="db-node">
            <div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;">
              <span class="db-node-icon">👤</span><span class="db-node-name">users</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row">name <span>VARCHAR</span></div>
              <div class="db-row">email <span>VARCHAR · UNIQUE</span></div>
              <div class="db-row">role <span>ENUM (guest, host, both)</span></div>
              <div class="db-row">verified <span>BOOLEAN</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;">
              <span class="db-node-icon">🏠</span><span class="db-node-name">listings</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row fk">🔗 host_id <span>FK → users</span></div>
              <div class="db-row">title <span>VARCHAR</span></div>
              <div class="db-row">price_per_night <span>DECIMAL</span></div>
              <div class="db-row">lat / lng <span>FLOAT (geo index)</span></div>
              <div class="db-row">max_guests <span>INT</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#fefce8;border-color:#fef08a;">
              <span class="db-node-icon">📅</span><span class="db-node-name">bookings</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row fk">🔗 listing_id <span>FK → listings</span></div>
              <div class="db-row fk">🔗 guest_id <span>FK → users</span></div>
              <div class="db-row">check_in <span>DATE</span></div>
              <div class="db-row">check_out <span>DATE</span></div>
              <div class="db-row">status <span>ENUM (pending,confirmed,cancelled)</span></div>
              <div class="db-row">total_price <span>DECIMAL</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;">
              <span class="db-node-icon">⭐</span><span class="db-node-name">reviews</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row fk">🔗 booking_id <span>FK → bookings</span></div>
              <div class="db-row fk">🔗 reviewer_id <span>FK → users</span></div>
              <div class="db-row">rating <span>INT (1–5)</span></div>
              <div class="db-row">body <span>TEXT</span></div>
            </div>
          </div>
        </div>

        <div class="content-label">Relationship graph</div>
        <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
          <svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <defs><marker id="arrA" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
            <!-- users -->
            <rect x="170" y="10" width="140" height="80" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="240" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">👤 users</text>
            <line x1="170" y1="38" x2="310" y2="38" stroke="#bfdbfe" stroke-width="1"/>
            <text x="180" y="52" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="180" y="66" font-size="10" fill="#888">name, email</text>
            <text x="180" y="80" font-size="10" fill="#888">role (guest/host/both)</text>
            <!-- listings -->
            <rect x="10" y="140" width="140" height="80" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <text x="80" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">🏠 listings</text>
            <line x1="10" y1="168" x2="150" y2="168" stroke="#bbf7d0" stroke-width="1"/>
            <text x="20" y="182" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="20" y="196" font-size="10" fill="#0369a1">🔗 host_id → users</text>
            <text x="20" y="210" font-size="10" fill="#888">price, lat, lng</text>
            <!-- bookings -->
            <rect x="190" y="140" width="140" height="95" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
            <text x="260" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">📅 bookings</text>
            <line x1="190" y1="168" x2="330" y2="168" stroke="#fef08a" stroke-width="1"/>
            <text x="200" y="182" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="200" y="196" font-size="10" fill="#0369a1">🔗 listing_id → listings</text>
            <text x="200" y="210" font-size="10" fill="#0369a1">🔗 guest_id → users</text>
            <text x="200" y="224" font-size="10" fill="#888">check_in, check_out</text>
            <text x="200" y="238" font-size="10" fill="#888">status, total_price</text>
            <!-- reviews -->
            <rect x="370" y="140" width="140" height="80" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
            <text x="440" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">⭐ reviews</text>
            <line x1="370" y1="168" x2="510" y2="168" stroke="#e9d5ff" stroke-width="1"/>
            <text x="380" y="182" font-size="10" fill="#555">🔑 id · PK</text>
            <text x="380" y="196" font-size="10" fill="#0369a1">🔗 booking_id → bookings</text>
            <text x="380" y="210" font-size="10" fill="#888">rating, body</text>
            <!-- arrows -->
            <line x1="200" y1="90" x2="100" y2="140" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrA)"/>
            <text x="122" y="120" font-size="9" fill="#aaa">hosts</text>
            <line x1="240" y1="90" x2="240" y2="140" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrA)"/>
            <text x="244" y="120" font-size="9" fill="#aaa">books</text>
            <line x1="150" y1="185" x2="190" y2="185" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrA)" stroke-dasharray="4,2"/>
            <line x1="330" y1="185" x2="370" y2="185" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrA)" stroke-dasharray="4,2"/>
            <text x="340" y="180" font-size="9" fill="#aaa">reviewed</text>
          </svg>
        </div>
        <div class="insight-box" style="margin-top:12px;">
          <strong>Reviews are tied to bookings</strong> (not just listings) — this ensures only real guests who completed a stay can leave a review. Prevents fake reviews.
        </div>
      `
    },
    {
      name: 'Deep Dive — Search & Availability',
      content: `
        <div class="content-label">How search works</div>
        <ul class="req-list">
          <li><strong>1. Geo query</strong> — user enters "Mumbai". Elasticsearch finds listings within radius using geo_distance filter.</li>
          <li><strong>2. Date filter</strong> — exclude listings with conflicting bookings for chosen dates</li>
          <li><strong>3. Filters applied</strong> — price range, guests, amenities (pool, wifi, etc.)</li>
          <li><strong>4. Ranking</strong> — by relevance score: price, reviews, superhost status, distance</li>
          <li><strong>5. Cache</strong> — popular city+date combos cached in Redis (TTL 5 min)</li>
        </ul>

        <div style="margin-top:20px;">
          <div class="content-label">Double booking prevention</div>
          <div class="insight-box">
            Two guests try to book the same listing, same dates at the same time. Without locking, both succeed — double booking.<br><br>
            <strong style="color:#222;">Solution — Pessimistic Locking:</strong>
            <div style="font-family:monospace;font-size:12px;background:#fff;border:1px solid #eee;border-radius:6px;padding:10px;margin-top:8px;line-height:1.8;">
              BEGIN TRANSACTION;<br>
              SELECT * FROM bookings<br>
              &nbsp;&nbsp;WHERE listing_id = ? AND dates_overlap(?)<br>
              &nbsp;&nbsp;FOR UPDATE; &nbsp;&nbsp;&nbsp;&nbsp;← locks the rows<br>
              -- if no conflict → INSERT booking<br>
              COMMIT;
            </div>
            Second request waits at FOR UPDATE → sees the first booking → returns "dates unavailable". Atomically safe.
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Availability calendar</div>
          <div class="insight-box">
            Hosts block/open dates on a calendar. This is stored as date ranges in a separate <strong>availability</strong> table. Search joins this with bookings to show accurate open dates. Redis caches availability for popular listings.
          </div>
        </div>
      `
    },
    {
      name: 'Bottlenecks & Trade-offs',
      content: `
        <div class="content-label">What breaks at scale</div>
        <ul class="req-list" style="gap:10px;">
          <li>
            <strong>🔍 Slow geo search under load</strong><br>
            <span style="color:#888;">Elasticsearch geo queries with many filters get slow at scale.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Geohash-based partitioning in Elasticsearch. Cache top city searches in Redis. Pre-compute popular searches nightly.</span>
          </li>
          <li>
            <strong>📅 Availability race conditions</strong><br>
            <span style="color:#888;">High demand listings (holidays) get hammered with simultaneous bookings.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Pessimistic locking (FOR UPDATE) in PostgreSQL. Queue-based booking for extremely hot listings.</span>
          </li>
          <li>
            <strong>💳 Payment failures mid-booking</strong><br>
            <span style="color:#888;">Booking confirmed but payment fails — listing is blocked but no revenue.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Saga pattern — booking is "pending" until payment succeeds. If payment fails, booking auto-cancels and dates reopen.</span>
          </li>
          <li>
            <strong>🌍 Global photo delivery</strong><br>
            <span style="color:#888;">Listings have 20+ photos each — massive bandwidth for search results pages.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: CDN for all photos. Serve compressed thumbnails in search, full-res only on listing detail page. WebP format reduces size 30%.</span>
          </li>
        </ul>
        <div style="margin-top:20px;">
          <div class="content-label">Key trade-offs</div>
          <table class="nfr-table">
            <tr><td>Consistency vs Speed</td><td>Booking uses strong consistency (no double booking). Search uses eventual consistency (cached, slightly stale is fine).</td></tr>
            <tr><td>Pessimistic vs Optimistic locking</td><td>Pessimistic = safe but slower under contention. Optimistic = fast but needs retry logic. Airbnb uses pessimistic for bookings.</td></tr>
            <tr><td>Sync vs Async payment</td><td>Payment confirmation is async — user gets instant "booking confirmed" while payment processes in background via Saga.</td></tr>
          </table>
        </div>
      `
    }
  ]
};

// ── TWITTER TIMELINE ─────────────────────────────────────
systems['twitter'] = {
  name: 'Twitter Timeline',
  sub: 'Real-time social feed',
  steps: [
    {
      name: 'Functional Requirements',
      content: `
        <div class="content-label">What the system must do</div>
        <ul class="req-list">
          <li><strong>Post tweet</strong> — users post text (280 chars), images, videos</li>
          <li><strong>Follow</strong> — follow/unfollow other users</li>
          <li><strong>Home timeline</strong> — see tweets from people you follow, ranked by recency/relevance</li>
          <li><strong>User timeline</strong> — see all tweets by a specific user</li>
          <li><strong>Like / Retweet / Reply</strong> — interact with tweets</li>
          <li><strong>Search</strong> — search tweets, users, trending hashtags</li>
          <li><strong>Notifications</strong> — get notified on likes, replies, mentions, follows</li>
          <li><strong>Trending</strong> — show top hashtags and topics in real-time</li>
        </ul>
      `
    },
    {
      name: 'Non-Functional Requirements',
      content: `
        <div class="content-label">How well it must perform</div>
        <table class="nfr-table">
          <tr><td>Low Latency</td><td>Timeline loads in &lt;200ms — users expect instant feed</td></tr>
          <tr><td>High Availability</td><td>99.99% — Twitter going down is international news</td></tr>
          <tr><td>Eventual Consistency</td><td>A tweet reaching all followers in a few seconds is fine</td></tr>
          <tr><td>Scalability</td><td>Handle celebrity tweets — Lady Gaga has 80M followers</td></tr>
          <tr><td>Read Heavy</td><td>~100:1 reads to writes — more people reading than tweeting</td></tr>
          <tr><td>Real-time</td><td>New tweets should appear in followers' timelines within seconds</td></tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
        <div class="insight-box" style="margin-bottom:10px;">
          Twitter is <strong>AP-dominant</strong> — availability and speed trump strict consistency almost everywhere. A tweet appearing 2 seconds late is fine. A broken timeline page is not.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>Tweets &amp; Users</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP) — sharded</span></td>
            <td>Core data — once a tweet is saved, it must be consistent (you can't unsave it). Sharded by user_id to distribute write load. Within a shard, CP holds.</td>
          </tr>
          <tr>
            <td><strong>Timeline cache</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td>
            <td>Per-user Redis sorted set of tweet IDs. AP — if a replica is slightly behind, timeline is 1–2 tweets stale. Completely acceptable. Availability is critical: timeline must always load fast.</td>
          </tr>
          <tr>
            <td><strong>Follow graph</strong><br><span style="color:#888;font-size:11px;">Graph DB or Redis Sets (AP)</span></td>
            <td>Who follows whom. Read-heavy (fan-out workers query this constantly). Graph DB (like Neo4j) or Redis sets. AP — a new follow taking 1 second to reflect in fan-out is fine.</td>
          </tr>
          <tr>
            <td><strong>Search / Trending</strong><br><span style="color:#888;font-size:11px;">Elasticsearch + Redis (AP)</span></td>
            <td>Tweet search index (Elasticsearch AP). Trending hashtags stored in Redis sorted sets — ZINCRBY on every tweet, ZREVRANGE for top 10. AP — trending can lag by 60 seconds.</td>
          </tr>
        </table>

        <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;">Fan-out Pattern (Write vs Read)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;"><strong>Push (fan-out on write):</strong> regular users tweet → push to all follower timelines immediately. <strong>Pull (fan-out on read):</strong> celebrities tweet → fetch at read time. Hybrid of both = optimal. The celebrity exception is a classic design pattern for hotspot mitigation.</div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;">Consistent Hashing (DB Sharding)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Tweets DB is sharded by user_id using consistent hashing. Adding a new shard only moves a fraction of data, not everything. Prevents re-sharding pain as the system scales.</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#a16207;">Snowflake ID (Distributed Unique ID)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Tweet IDs encode timestamp + datacenter + machine + sequence. IDs are time-sorted — no ORDER BY on created_at needed. IDs generated independently on each machine with no central coordinator (no single point of failure).</div>
          </div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:700;color:#7e22ce;">Leaky Bucket / Token Bucket (Rate Limiting)</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Prevents tweet spam and API abuse. Each user has a token bucket — posting a tweet costs a token; tokens refill at 1/min. API has separate rate limits per endpoint. Critical for a public platform.</div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:12px;">💡 The hardest problem: a celebrity with 80M followers posts a tweet. How do you push it to 80M timelines in seconds? This is the <strong>fan-out problem</strong>.</div>
      `
    },
    {
      name: 'Capacity Estimation',
      content: `
        <div class="content-label">Assumed: 100K DAU</div>
        <div class="cap-calc">
          <div class="cap-calc-row">
            <div class="cap-calc-label">Tweets / day</div>
            <div class="cap-calc-math">100K users × 1 tweet/user/day (active users post daily)</div>
            <div class="cap-calc-result">100K / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Tweet writes / sec</div>
            <div class="cap-calc-math">100K tweets/day ÷ 86,400 sec/day</div>
            <div class="cap-calc-result">~1 / sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Timeline reads / day</div>
            <div class="cap-calc-math">100K users × 100 timeline reads per user/day<br>(refreshing, scrolling throughout day)</div>
            <div class="cap-calc-result">10M / day</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Read / write ratio</div>
            <div class="cap-calc-math">10M reads ÷ 100K writes = <strong>100:1</strong><br>10M/day ÷ 86,400 = ~115 reads/sec</div>
            <div class="cap-calc-result">~115 reads/sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Fan-out writes</div>
            <div class="cap-calc-math">1 tweet/sec × avg 1,000 followers = 1,000 inbox writes/sec<br>Celebrity with 10M followers = 10M writes per tweet!</div>
            <div class="cap-calc-result">1K–10M / tweet</div>
          </div>
        </div>
        <div class="insight-box">
          The fan-out problem is why Twitter chose pre-computed timelines (push model). At 1 tweet/sec × 1,000 followers = 1,000 writes/sec just for fan-out. That's why celebrities switch to <strong>pull model</strong> — pushing Lady Gaga's tweet to 100M followers takes too long.
        </div>
      `
    },
    {
      name: 'High Level Design (HLD)',
      content: `
        <div class="content-label">Architecture</div>
        <div class="hld-graph">
          <div class="layer-name">Client</div>
          <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">Web / Mobile</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Edge</div>
          <div class="hld-row">
            <div class="hld-node c-orange">🌐 CDN<div class="node-sub">Media files</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-orange">⚖️ Load Balancer</div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">API Gateway</div>
          <div class="hld-row"><div class="hld-node c-teal">🚪 API Gateway<div class="node-sub">Auth · Routing</div></div></div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Microservices</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-green">✍️ Tweet Service<div class="node-sub">Post tweets</div></div>
              <div class="hld-node c-green">📰 Timeline Service<div class="node-sub">Build &amp; read feed</div></div>
              <div class="hld-node c-green">👥 Follow Service<div class="node-sub">Follow graph</div></div>
              <div class="hld-node c-green">🔍 Search Service<div class="node-sub">Tweets, hashtags</div></div>
              <div class="hld-node c-green">🔔 Notification Svc<div class="node-sub">Likes, replies</div></div>
            </div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Fan-out layer</div>
          <div class="hld-row">
            <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">tweet.posted events</div></div>
            <div style="width:16px"></div>
            <div class="hld-node c-yellow">⚙️ Fan-out Workers<div class="node-sub">Push to timelines</div></div>
          </div>
          <div class="hld-arrow">↓</div>
          <div class="layer-name">Cache & Storage</div>
          <div class="hld-row">
            <div class="hld-multi">
              <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Timeline cache per user</div></div>
              <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Tweets, users</div></div>
              <div class="hld-node c-red">🪣 S3<div class="node-sub">Images, videos</div></div>
            </div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:16px;">
          <strong>Fan-out on write (Push model):</strong> When you tweet, Fan-out Workers immediately push your tweet ID into each follower's timeline cache in Redis. Reading the feed is instant — it's just reading a Redis list.<br><br>
          <strong>Fan-out on read (Pull model):</strong> Timeline is built live by fetching tweets from everyone you follow. Flexible but slow at read time.<br><br>
          Twitter uses a <strong>hybrid</strong>: push for regular users, pull for celebrities (too many followers to push to all).
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">Service communication</div>
          <div class="comm-block">
            <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Client reads timeline → Timeline Service → Redis cache (instant)</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Tweet posted → Kafka → Fan-out Workers push to follower timelines</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Tweet posted → Kafka → Notification Service → push alerts</div>
            <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Tweet posted → Kafka → Search indexer (Elasticsearch)</div>
          </div>
        </div>
      `
    },
    {
      name: 'Data Modeling',
      content: `
        <div class="content-label">Tables</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <div class="db-node">
            <div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;">
              <span class="db-node-icon">👤</span><span class="db-node-name">users</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>UUID · PK</span></div>
              <div class="db-row">username <span>VARCHAR · UNIQUE</span></div>
              <div class="db-row">follower_count <span>INT · cached</span></div>
              <div class="db-row">is_verified <span>BOOLEAN</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#fefce8;border-color:#fef08a;">
              <span class="db-node-icon">🐦</span><span class="db-node-name">tweets</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 id <span>BIGINT · Snowflake PK</span></div>
              <div class="db-row fk">🔗 user_id <span>FK → users</span></div>
              <div class="db-row fk">🔗 reply_to_id <span>FK → tweets (nullable)</span></div>
              <div class="db-row">body <span>VARCHAR(280)</span></div>
              <div class="db-row">like_count <span>INT · cached</span></div>
              <div class="db-row">created_at <span>TIMESTAMP</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;">
              <span class="db-node-icon">👥</span><span class="db-node-name">follows</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 follower_id <span>FK → users</span></div>
              <div class="db-row pk">🔑 followee_id <span>FK → users</span></div>
              <div class="db-row">created_at <span>TIMESTAMP</span></div>
            </div>
          </div>
          <div class="db-node">
            <div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;">
              <span class="db-node-icon">❤️</span><span class="db-node-name">likes</span>
            </div>
            <div class="db-node-body">
              <div class="db-row pk">🔑 user_id <span>FK → users</span></div>
              <div class="db-row pk">🔑 tweet_id <span>FK → tweets</span></div>
              <div class="db-row">created_at <span>TIMESTAMP</span></div>
            </div>
          </div>
        </div>

        <div class="content-label">Relationship graph</div>
        <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
          <svg viewBox="0 0 520 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <defs><marker id="arrT" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
            <!-- users -->
            <rect x="180" y="10" width="150" height="85" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="255" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">👤 users</text>
            <line x1="180" y1="38" x2="330" y2="38" stroke="#bfdbfe" stroke-width="1"/>
            <text x="190" y="52" font-size="10" fill="#555">🔑 id · BIGINT · PK</text>
            <text x="190" y="66" font-size="10" fill="#888">username · UNIQUE</text>
            <text x="190" y="80" font-size="10" fill="#888">follower_count (cached)</text>
            <!-- tweets -->
            <rect x="10" y="145" width="155" height="95" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
            <text x="87" y="165" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">🐦 tweets</text>
            <line x1="10" y1="173" x2="165" y2="173" stroke="#fef08a" stroke-width="1"/>
            <text x="20" y="187" font-size="10" fill="#555">🔑 id · Snowflake · PK</text>
            <text x="20" y="201" font-size="10" fill="#0369a1">🔗 user_id → users</text>
            <text x="20" y="215" font-size="10" fill="#888">body (280 chars)</text>
            <text x="20" y="229" font-size="10" fill="#888">🔗 reply_to_id (self)</text>
            <!-- follows -->
            <rect x="180" y="145" width="145" height="70" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <text x="253" y="165" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">👥 follows</text>
            <line x1="180" y1="173" x2="325" y2="173" stroke="#bbf7d0" stroke-width="1"/>
            <text x="190" y="187" font-size="10" fill="#555">🔑 follower_id (FK)</text>
            <text x="190" y="201" font-size="10" fill="#555">🔑 followee_id (FK)</text>
            <!-- likes -->
            <rect x="360" y="145" width="145" height="70" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
            <text x="432" y="165" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">❤️ likes</text>
            <line x1="360" y1="173" x2="505" y2="173" stroke="#e9d5ff" stroke-width="1"/>
            <text x="370" y="187" font-size="10" fill="#555">🔑 user_id (FK)</text>
            <text x="370" y="201" font-size="10" fill="#555">🔑 tweet_id (FK)</text>
            <!-- arrows -->
            <line x1="220" y1="95" x2="100" y2="145" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrT)"/>
            <text x="135" y="125" font-size="9" fill="#aaa">posts</text>
            <line x1="255" y1="95" x2="255" y2="145" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrT)" stroke-dasharray="4,2"/>
            <text x="260" y="125" font-size="9" fill="#aaa">follows</text>
            <line x1="300" y1="95" x2="400" y2="145" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrT)" stroke-dasharray="4,2"/>
            <text x="358" y="122" font-size="9" fill="#aaa">likes</text>
            <!-- tweet self-ref for reply -->
            <path d="M10,215 Q-10,215 -10,230 Q-10,240 10,240 L10,235" stroke="#ccc" stroke-width="1.5" fill="none" marker-end="url(#arrT)" stroke-dasharray="3,2"/>
            <text x="-12" y="228" font-size="8" fill="#aaa">reply</text>
          </svg>
        </div>
        <div class="insight-box" style="margin-top:12px;">
          <strong>Snowflake ID for tweets</strong> — auto-incrementing BIGINT generated by Twitter's Snowflake service. Encodes timestamp + machine ID + sequence. Tweets are naturally sorted by ID = sorted by time. No need for ORDER BY created_at index.
        </div>
      `
    },
    {
      name: 'Deep Dive — Fan-out',
      content: `
        <div class="content-label">The fan-out problem</div>
        <div class="insight-box">
          When you post a tweet, it needs to appear in every follower's timeline. With 80M followers, that's 80M writes. How do you do this in seconds?
        </div>

        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:6px;">Fan-out on Write (Push) — regular users</div>
            <div style="font-size:12px;color:#555;">When Alice (500 followers) tweets → Fan-out Worker pushes tweet ID to 500 Redis lists immediately. Reading timeline = instant Redis read.</div>
            <div style="font-size:12px;color:#888;margin-top:6px;">✅ Fast reads &nbsp; ❌ Expensive writes for celebrities</div>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#c2410c;margin-bottom:6px;">Fan-out on Read (Pull) — celebrities</div>
            <div style="font-size:12px;color:#555;">When you load your timeline, the system fetches latest tweets from celebrities you follow on-the-fly, merges with your cached feed. Celebrities are flagged — their tweets are NOT pre-pushed.</div>
            <div style="font-size:12px;color:#888;margin-top:6px;">✅ No write amplification &nbsp; ❌ Slightly slower reads (merge step)</div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">Hybrid (what Twitter actually uses)</div>
            <div style="font-size:12px;color:#555;">Regular users → push to follower timelines. Celebrities (verified, >1M followers) → pull at read time. Timeline Service merges both.</div>
            <div style="font-size:12px;color:#888;margin-top:6px;">✅ Best of both worlds</div>
          </div>
        </div>

        <div style="margin-top:20px;">
          <div class="content-label">Timeline Redis structure</div>
          <div class="insight-box">
            Each user's timeline is a <strong>Redis sorted set</strong>:<br><br>
            Key: <code>timeline:{user_id}</code><br>
            Value: tweet_id<br>
            Score: timestamp<br><br>
            ZREVRANGE gets the latest 20 tweets in O(log N). Capped at 800 tweets — oldest get trimmed automatically.
          </div>
        </div>
      `
    },
    {
      name: 'Bottlenecks & Trade-offs',
      content: `
        <div class="content-label">What breaks at scale</div>
        <ul class="req-list" style="gap:10px;">
          <li>
            <strong>🌟 Celebrity tweet storm</strong><br>
            <span style="color:#888;">Elon tweets → 100M followers → 100M Redis writes in seconds if using pure push.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Hybrid approach — celebrities use pull model. Their tweets are fetched at read time, not pre-pushed.</span>
          </li>
          <li>
            <strong>⚡ Timeline staleness</strong><br>
            <span style="color:#888;">Fan-out workers are async — there's a delay before a tweet reaches all followers.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Trade-off accepted: eventual consistency. A tweet arriving in your feed 2–3 seconds after posting is totally fine.</span>
          </li>
          <li>
            <strong>🔍 Trending hashtags at scale</strong><br>
            <span style="color:#888;">Counting hashtag frequency in real-time across millions of tweets is expensive.</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Redis sorted set for hashtag counts — ZINCRBY on every tweet. Top 10 from ZREVRANGE. Aggregated every 60 seconds not per-tweet.</span>
          </li>
          <li>
            <strong>🗄️ Hot partition in DB</strong><br>
            <span style="color:#888;">All recent tweets land on the same DB partition (time-ordered writes = hot write partition).</span><br>
            <span style="color:#555;margin-top:4px;display:block;">Fix: Shard tweets table by user_id, not time. Snowflake IDs distribute writes across shards naturally.</span>
          </li>
        </ul>
        <div style="margin-top:20px;">
          <div class="content-label">Key trade-offs</div>
          <table class="nfr-table">
            <tr><td>Push vs Pull fan-out</td><td>Push = fast reads, expensive writes. Pull = cheap writes, slower reads. Hybrid wins.</td></tr>
            <tr><td>Strong vs Eventual consistency</td><td>Timelines use eventual consistency (fine). Like counts use eventual consistency (fine). Authentication uses strong (required).</td></tr>
            <tr><td>Snowflake vs UUID</td><td>Snowflake IDs sort by time naturally — no ORDER BY index needed. UUID is random — needs explicit index for time sorting.</td></tr>
          </table>
        </div>
      `
    }
  ]
};

// ── SLACK ─────────────────────────────────────────────────
systems['slack'] = {
  name: 'Slack', sub: 'Team messaging',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Send messages</strong> — real-time text in channels and DMs</li>
        <li><strong>Channels</strong> — public/private channels within a workspace</li>
        <li><strong>Threads</strong> — reply to a message without cluttering the channel</li>
        <li><strong>File sharing</strong> — upload images, docs, code snippets</li>
        <li><strong>Search</strong> — full-text search across all messages and files</li>
        <li><strong>Notifications</strong> — desktop, mobile push, email digests</li>
        <li><strong>Presence</strong> — show who is online, away, or in a meeting</li>
        <li><strong>Reactions</strong> — emoji reactions on messages</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Real-time Delivery</td><td>Messages delivered in &lt;100ms — users feel it's instant</td></tr>
        <tr><td>High Availability</td><td>99.99% — teams depend on Slack for work; downtime = lost productivity</td></tr>
        <tr><td>At-least-once Delivery</td><td>A message must never be silently lost — retries with dedup are fine</td></tr>
        <tr><td>Eventual Consistency</td><td>Read receipts and reaction counts can lag slightly — that's fine</td></tr>
        <tr><td>Scalability</td><td>A single channel can have thousands of members (e.g., #general at a big company)</td></tr>
        <tr><td>Durability</td><td>Messages stored permanently (or until workspace retention policy)</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Slack's core need is <strong>availability + speed</strong> for messaging. Message history can be AP. Workspace/user data must be CP.</div>
      <table class="nfr-table">
        <tr><td><strong>Messages</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Append-only time-series writes — one row per message. Cassandra is optimised for high-throughput writes partitioned by channel_id + time. AP: availability over strict consistency.</td></tr>
        <tr><td><strong>Workspaces / Users / Channels</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Relational data with referential integrity. A user added to a channel must be consistent. CP.</td></tr>
        <tr><td><strong>Presence / Typing indicators</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>High-frequency ephemeral state — updated every few seconds per connected user. AP and TTL-based (presence expires if client disconnects).</td></tr>
        <tr><td><strong>Search</strong><br><span style="color:#888;font-size:11px;">Elasticsearch (AP)</span></td><td>Full-text index on message bodies. Slightly behind real-time writes. AP fine — search doesn't need the last 5 seconds of messages.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Pub/Sub per Channel</div><div style="font-size:12px;color:#555;margin-top:4px;">Each channel is a pub/sub topic. When a message is posted, all WebSocket connections subscribed to that channel receive it. Kafka or Redis Pub/Sub for fan-out.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">WebSocket Long-Lived Connection</div><div style="font-size:12px;color:#555;margin-top:4px;">Each client maintains a single WebSocket to a gateway server. On message, the server pushes to all subscribed connections. Connection state stored in Redis so any gateway server can handle any client.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Idempotency + At-least-once</div><div style="font-size:12px;color:#555;margin-top:4px;">Each message has a client-generated idempotency key. Client retries on failure. Server deduplicates using the key — message appears exactly once even if sent multiple times.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Messages / day</div>
          <div class="cap-calc-math">100K users × 10 messages sent per user per day</div>
          <div class="cap-calc-result">1M / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Messages / sec</div>
          <div class="cap-calc-math">1M messages/day ÷ 86,400 sec/day</div>
          <div class="cap-calc-result">~12 / sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">WebSocket fan-out</div>
          <div class="cap-calc-math">12 msg/sec × avg 100 members per channel<br>= each message pushed to 100 open connections</div>
          <div class="cap-calc-result">~1,200 pushes/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Storage / year</div>
          <div class="cap-calc-math">1M messages/day × 1 KB avg × 365 days<br>= 365,000 MB</div>
          <div class="cap-calc-result">~365 GB / yr</div>
        </div>
      </div>
      <div class="insight-box">
        The message write (12/sec) is manageable. The hard part is <strong>fan-out</strong>: a 500-person channel = 500 simultaneous WebSocket pushes per message. At peak that's thousands of concurrent deliveries — why Slack uses a pub/sub layer per channel rather than direct routing.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">💻 Client<div class="node-sub">Desktop / Mobile / Web</div></div></div>
        <div class="hld-arrow">↓ WebSocket</div>
        <div class="layer-name">Edge</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer<div class="node-sub">Sticky sessions</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Gateway</div>
        <div class="hld-row"><div class="hld-node c-teal">🔌 WebSocket Gateway<div class="node-sub">Maintains connections · Auth</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Microservices</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">💬 Message Service<div class="node-sub">Send / fetch messages</div></div>
          <div class="hld-node c-green">📢 Channel Service<div class="node-sub">CRUD channels</div></div>
          <div class="hld-node c-green">👁️ Presence Service<div class="node-sub">Online / Away status</div></div>
          <div class="hld-node c-green">🔔 Notification Svc<div class="node-sub">Push / email alerts</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Messaging</div>
        <div class="hld-row">
          <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">message.sent events</div></div>
          <div style="width:16px"></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Presence · WS routing</div></div>
        </div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Storage</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ Cassandra<div class="node-sub">Message history</div></div>
          <div class="hld-node c-red">🐘 PostgreSQL<div class="node-sub">Users / Workspaces</div></div>
          <div class="hld-node c-red">🔎 Elasticsearch<div class="node-sub">Full-text search</div></div>
          <div class="hld-node c-red">🪣 S3<div class="node-sub">Files / media</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Client sends message → Message Service → Cassandra (stored)</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Message saved → Kafka → Fan-out Workers → push to all channel WebSocket connections</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Message saved → Kafka → Search Indexer → Elasticsearch</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">🏢</span><span class="db-node-name">workspaces</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">domain <span>VARCHAR · UNIQUE</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📢</span><span class="db-node-name">channels</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 workspace_id <span>FK → workspaces</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">is_private <span>BOOLEAN</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">💬</span><span class="db-node-name">messages</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 channel_id <span>FK → channels</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row fk">🔗 thread_id <span>FK → messages (nullable)</span></div><div class="db-row">body <span>TEXT</span></div><div class="db-row">created_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">👥</span><span class="db-node-name">memberships</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id <span>FK → users</span></div><div class="db-row pk">🔑 channel_id <span>FK → channels</span></div><div class="db-row">last_read_at <span>TIMESTAMP</span></div></div></div>
      </div>
      <div class="content-label">Relationship graph</div>
      <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:24px;">
        <svg viewBox="0 0 520 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
          <defs><marker id="arrS" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
          <rect x="180" y="10" width="150" height="70" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
          <text x="255" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">🏢 workspaces</text>
          <line x1="180" y1="38" x2="330" y2="38" stroke="#bfdbfe" stroke-width="1"/>
          <text x="190" y="52" font-size="10" fill="#555">🔑 id · PK</text>
          <text x="190" y="66" font-size="10" fill="#888">name, domain</text>
          <rect x="10" y="130" width="145" height="80" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <text x="82" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">📢 channels</text>
          <line x1="10" y1="158" x2="155" y2="158" stroke="#bbf7d0" stroke-width="1"/>
          <text x="20" y="172" font-size="10" fill="#555">🔑 id · PK</text>
          <text x="20" y="186" font-size="10" fill="#0369a1">🔗 workspace_id</text>
          <text x="20" y="200" font-size="10" fill="#888">name, is_private</text>
          <rect x="185" y="130" width="145" height="85" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
          <text x="257" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">💬 messages</text>
          <line x1="185" y1="158" x2="330" y2="158" stroke="#fef08a" stroke-width="1"/>
          <text x="195" y="172" font-size="10" fill="#555">🔑 id · PK</text>
          <text x="195" y="186" font-size="10" fill="#0369a1">🔗 channel_id, user_id</text>
          <text x="195" y="200" font-size="10" fill="#888">body, created_at</text>
          <text x="195" y="214" font-size="10" fill="#0369a1">🔗 thread_id (self)</text>
          <rect x="360" y="130" width="145" height="70" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
          <text x="432" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">👥 memberships</text>
          <line x1="360" y1="158" x2="505" y2="158" stroke="#e9d5ff" stroke-width="1"/>
          <text x="370" y="172" font-size="10" fill="#555">🔑 user_id, channel_id</text>
          <text x="370" y="186" font-size="10" fill="#888">last_read_at</text>
          <line x1="210" y1="80" x2="90" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrS)"/>
          <line x1="255" y1="80" x2="255" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrS)"/>
          <line x1="290" y1="80" x2="420" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrS)" stroke-dasharray="4,2"/>
        </svg>
      </div>` },
    { name: 'Deep Dive — Real-time Messaging', content: `
      <div class="content-label">WebSocket connection lifecycle</div>
      <ul class="req-list">
        <li><strong>1. Connect</strong> — client opens WebSocket to load balancer (sticky session ensures same gateway server)</li>
        <li><strong>2. Auth</strong> — gateway validates JWT, looks up user's channels, subscribes to those channel topics in Redis Pub/Sub</li>
        <li><strong>3. Send message</strong> — client sends over WS → gateway → Message Service → Cassandra saved → Kafka event published</li>
        <li><strong>4. Fan-out</strong> — Kafka consumer looks up all channel members → pushes message to each member's gateway connection via Redis Pub/Sub</li>
        <li><strong>5. Offline users</strong> — if user has no active WS, fan-out sends push notification instead</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>The routing problem:</strong> User A is connected to Gateway Server 1. User B's message goes to Gateway Server 3. How does Server 3 send to A?<br><br>Solution: Redis Pub/Sub. Each gateway subscribes to channels its connected users care about. When a message arrives, Redis broadcasts to all interested gateways.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>📢 Hot channels (#general with 10K members)</strong><br><span style="color:#888;">One message = 10K WebSocket pushes instantly.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Batch pushes, rate-limit message frequency in large channels, use Kafka partitions to parallelise fan-out workers.</span></li>
        <li><strong>🔌 WebSocket connection scale</strong><br><span style="color:#888;">100K users × 1 WS each = 100K open connections. Each gateway server handles ~10K max.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Horizontal scale gateway servers. Connection state in Redis (not in-memory) so any server handles any user.</span></li>
        <li><strong>🔍 Search lag</strong><br><span style="color:#888;">Elasticsearch index is async — latest messages may not be searchable for a few seconds.</span><br><span style="color:#555;display:block;margin-top:4px;">Trade-off accepted: eventual consistency for search is fine. Slack shows "No results? Message may be indexing..."</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>At-least-once vs exactly-once</td><td>Slack uses at-least-once + client-side idempotency key dedup. Exactly-once delivery is expensive and not needed for chat.</td></tr>
        <tr><td>Cassandra vs PostgreSQL for messages</td><td>Cassandra: high write throughput, time-series optimised, scales horizontally. PostgreSQL: too slow for millions of msg/sec writes, harder to shard.</td></tr>
      </table>` }
  ]
};

// ── GOOGLE DOCS ───────────────────────────────────────────
systems['googledocs'] = {
  name: 'Google Docs', sub: 'Collaborative editing',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Create / Edit documents</strong> — rich text editing (bold, headings, lists, tables)</li>
        <li><strong>Real-time collaboration</strong> — multiple users edit the same doc simultaneously</li>
        <li><strong>Cursor presence</strong> — see other users' cursors and selections in real-time</li>
        <li><strong>Comments</strong> — add, resolve, reply to comments on text ranges</li>
        <li><strong>Version history</strong> — revert to any previous version</li>
        <li><strong>Sharing &amp; permissions</strong> — viewer, commenter, editor roles</li>
        <li><strong>Offline editing</strong> — edit without internet, sync on reconnect</li>
        <li><strong>Export</strong> — download as PDF, DOCX, etc.</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Real-time Sync</td><td>&lt;50ms latency for collaborative edits — any lag feels broken</td></tr>
        <tr><td>Conflict Resolution</td><td>Two users typing simultaneously must merge correctly — no data loss</td></tr>
        <tr><td>Strong Consistency</td><td>Final document state must be the same for all users</td></tr>
        <tr><td>Durability</td><td>Every keystroke saved — no data loss even on crash</td></tr>
        <tr><td>Availability</td><td>99.9% — documents must be accessible</td></tr>
        <tr><td>Scalability</td><td>Handle thousands of simultaneous editors per document</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Google Docs is unique — it needs <strong>strong eventual consistency</strong>: all users converge to the same document state, but may see slightly different intermediate states. This is neither pure CP nor pure AP.</div>
      <table class="nfr-table">
        <tr><td><strong>Document content / Operations</strong><br><span style="color:#888;font-size:11px;">Bigtable / Firestore (CP-ish)</span></td><td>Operations log stored in Bigtable (row key = doc_id + timestamp). Strongly consistent within a document. Google's internal Spanner gives globally consistent distributed writes.</td></tr>
        <tr><td><strong>Document metadata</strong><br><span style="color:#888;font-size:11px;">Cloud SQL / PostgreSQL (CP)</span></td><td>Title, owner, sharing settings, version pointers. Relational, must be consistent. CP.</td></tr>
        <tr><td><strong>Collaboration state</strong><br><span style="color:#888;font-size:11px;">Redis / in-memory (AP)</span></td><td>Active cursors, user colors, who is currently editing. Ephemeral — lost if server restarts. AP with TTL.</td></tr>
        <tr><td><strong>Version snapshots</strong><br><span style="color:#888;font-size:11px;">GCS / S3 (AP)</span></td><td>Periodic full document snapshots. Immutable blob storage. AP — slightly stale snapshot is fine, operations log fills the gap.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Operational Transformation (OT)</div><div style="font-size:12px;color:#555;margin-top:4px;">User A inserts "X" at position 5. User B deletes character at position 3 simultaneously. Without coordination, B's operation shifts A's position. OT transforms operations against each other so both apply correctly. Used by Google Docs historically.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">CRDT (Conflict-free Replicated Data Type)</div><div style="font-size:12px;color:#555;margin-top:4px;">Alternative to OT. Each character has a unique ID. Operations are designed to always merge correctly regardless of order. No central server needed to resolve conflicts. Used by newer collaborative editors (Notion, Figma).</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Event Sourcing (Operations Log)</div><div style="font-size:12px;color:#555;margin-top:4px;">Never store the document directly — store the sequence of operations (insert char X at pos 5, delete at pos 3...). The document is derived by replaying operations. Version history is free — just replay up to that point in time.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Optimistic UI (Latency Hiding)</div><div style="font-size:12px;color:#555;margin-top:4px;">Apply your own edits to local doc immediately (don't wait for server). Send op to server. If server rejects or reorders, rollback and re-apply. This makes the editor feel instant even on slow networks.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Concurrent sessions</div>
          <div class="cap-calc-math">100K users × 10% actively editing at peak hour</div>
          <div class="cap-calc-result">10K sessions</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Ops per session</div>
          <div class="cap-calc-math">Fast typist: ~5 keystrokes/sec × each keystroke = 1 op<br>(insert/delete operations streamed in real time)</div>
          <div class="cap-calc-result">~5–100 ops/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Peak total ops/sec</div>
          <div class="cap-calc-math">10K concurrent sessions × 100 ops/sec each<br>= 1,000,000 ops/sec at theoretical peak</div>
          <div class="cap-calc-result">~1M ops/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Size per op</div>
          <div class="cap-calc-math">{"op":"insert","pos":42,"char":"a"} ← a single operation<br>Tiny JSON payload, not the full doc</div>
          <div class="cap-calc-result">~50 bytes</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Bandwidth for ops</div>
          <div class="cap-calc-math">1M ops/sec × 50 bytes = 50 MB/sec of op traffic<br>(manageable — much less than video streaming)</div>
          <div class="cap-calc-result">~50 MB/sec</div>
        </div>
      </div>
      <div class="insight-box">
        Ops are tiny but frequent. Storage is cheap. The bottleneck is <strong>conflict resolution</strong>: when Alice and Bob both type at position 42 simultaneously, OT must reconcile both ops consistently on every client — without a central lock.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">🖥️ Browser / App<div class="node-sub">Local OT engine + optimistic UI</div></div></div>
        <div class="hld-arrow">↓ WebSocket</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer<div class="node-sub">Sticky by doc_id</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-teal">🔌 Collaboration Server<div class="node-sub">OT engine · cursor state</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">📝 Document Service<div class="node-sub">CRUD · permissions</div></div>
          <div class="hld-node c-green">🕰️ Version Service<div class="node-sub">Snapshots · history</div></div>
          <div class="hld-node c-green">💬 Comment Service<div class="node-sub">Comments · threads</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ Bigtable<div class="node-sub">Operations log</div></div>
          <div class="hld-node c-red">🐘 PostgreSQL<div class="node-sub">Metadata · sharing</div></div>
          <div class="hld-node c-red">🪣 GCS / S3<div class="node-sub">Snapshots</div></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Cursor state</div></div>
        </div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>Sticky load balancing by doc_id</strong> — all editors of the same document connect to the same collaboration server. This means OT can happen in-memory without distributed coordination. If that server fails, clients reconnect and replay operations from Bigtable.</div>
      <div class="comm-block" style="margin-top:12px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Client sends op → Collab Server → transforms → applies → fan-out to all co-editors</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Op stored in Bigtable operations log (periodic snapshots to GCS)</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📄</span><span class="db-node-name">documents</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 owner_id <span>FK → users</span></div><div class="db-row">title <span>VARCHAR</span></div><div class="db-row">snapshot_url <span>TEXT</span></div><div class="db-row">last_op_seq <span>BIGINT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">✏️</span><span class="db-node-name">operations</span></div><div class="db-node-body"><div class="db-row pk">🔑 doc_id + seq <span>Composite PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">op_type <span>ENUM (insert, delete, format)</span></div><div class="db-row">position <span>INT</span></div><div class="db-row">content <span>TEXT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🔐</span><span class="db-node-name">permissions</span></div><div class="db-node-body"><div class="db-row pk">🔑 doc_id <span>FK → documents</span></div><div class="db-row pk">🔑 user_id <span>FK → users</span></div><div class="db-row">role <span>ENUM (viewer, commenter, editor)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">💬</span><span class="db-node-name">comments</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 doc_id <span>FK → documents</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">anchor_range <span>JSON (start, end positions)</span></div><div class="db-row">body <span>TEXT</span></div></div></div>
      </div>
      <div class="content-label">Relationship graph</div>
      <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:20px;">
        <svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
          <defs><marker id="arrG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
          <rect x="175" y="10" width="155" height="70" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
          <text x="252" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">📄 documents</text>
          <line x1="175" y1="38" x2="330" y2="38" stroke="#bfdbfe" stroke-width="1"/>
          <text x="185" y="52" font-size="10" fill="#555">🔑 id · PK</text>
          <text x="185" y="66" font-size="10" fill="#888">title, owner_id, snapshot</text>
          <rect x="10" y="130" width="145" height="75" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
          <text x="82" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">✏️ operations</text>
          <line x1="10" y1="158" x2="155" y2="158" stroke="#fef08a" stroke-width="1"/>
          <text x="20" y="172" font-size="10" fill="#555">🔑 doc_id + seq</text>
          <text x="20" y="186" font-size="10" fill="#888">op_type, position</text>
          <text x="20" y="200" font-size="10" fill="#888">content, user_id</text>
          <rect x="180" y="130" width="145" height="60" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <text x="252" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">🔐 permissions</text>
          <line x1="180" y1="158" x2="325" y2="158" stroke="#bbf7d0" stroke-width="1"/>
          <text x="190" y="172" font-size="10" fill="#555">🔑 doc_id, user_id</text>
          <text x="190" y="186" font-size="10" fill="#888">role (viewer/editor)</text>
          <rect x="360" y="130" width="145" height="75" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
          <text x="432" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">💬 comments</text>
          <line x1="360" y1="158" x2="505" y2="158" stroke="#e9d5ff" stroke-width="1"/>
          <text x="370" y="172" font-size="10" fill="#555">🔑 id · PK</text>
          <text x="370" y="186" font-size="10" fill="#0369a1">🔗 doc_id, user_id</text>
          <text x="370" y="200" font-size="10" fill="#888">anchor_range, body</text>
          <line x1="215" y1="80" x2="90" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrG)"/>
          <line x1="252" y1="80" x2="252" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrG)"/>
          <line x1="290" y1="80" x2="415" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrG)"/>
        </svg>
      </div>` },
    { name: 'Deep Dive — OT Algorithm', content: `
      <div class="content-label">Why OT is needed</div>
      <div class="insight-box">
        Alice types "H" at position 0. Bob deletes the character at position 2. Both operations are generated at the same time (revision 5). Without OT, applying both in different orders gives different results.
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
          <div style="font-size:12px;font-weight:700;color:#15803d;">Step 1 — Server receives both ops</div>
          <div style="font-size:12px;color:#555;margin-top:4px;">Alice: Insert("H", pos=0, rev=5)<br>Bob: Delete(pos=2, rev=5)</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;">Step 2 — Server applies Alice's op first (arbitrary)</div>
          <div style="font-size:12px;color:#555;margin-top:4px;">Alice's insert shifts everything right by 1. So Bob's Delete(pos=2) must be transformed → Delete(pos=3). Now both ops applied → same result.</div>
        </div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;">
          <div style="font-size:12px;font-weight:700;color:#a16207;">Step 3 — Server sends transformed op to Bob</div>
          <div style="font-size:12px;color:#555;margin-top:4px;">Bob's client receives Alice's insert + transformed version of his own delete. Both clients converge to identical document state.</div>
        </div>
      </div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔀 OT complexity with many concurrent users</strong><br><span style="color:#888;">With 10+ simultaneous editors, OT graph becomes complex.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Stick to one collaboration server per document (sticky sessions). All ops pass through one OT engine — no distributed OT needed.</span></li>
        <li><strong>📡 Offline sync conflicts</strong><br><span style="color:#888;">User edits offline for 10 minutes. On reconnect, 50 pending ops must merge with 200 server ops.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: CRDT-based approach handles this better than OT — operations are commutative and can be merged in any order.</span></li>
        <li><strong>📸 Operations log grows forever</strong><br><span style="color:#888;">Storing every individual keystroke for 5 years is expensive.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Periodic compaction — take a full snapshot every N operations. Only keep snapshots + recent ops. Older individual ops are discarded.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>OT vs CRDT</td><td>OT: requires central server to order ops. Simple for documents. CRDT: fully decentralised, no server needed. Better for offline-first (Figma, Notion).</td></tr>
        <tr><td>Snapshot frequency</td><td>Too frequent: storage cost. Too infrequent: slow document load (must replay many ops). Google snapshots every 100–1000 ops.</td></tr>
      </table>` }
  ]
};

// ── BLUESKY ───────────────────────────────────────────────
systems['bluesky'] = {
  name: 'Bluesky', sub: 'Decentralized social',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Post (Skeet)</strong> — users post text, images, links</li>
        <li><strong>Follow</strong> — follow other users across any server (Personal Data Server)</li>
        <li><strong>Timeline / Feed</strong> — see posts from followed users; choose custom feed algorithms</li>
        <li><strong>Like / Repost / Reply</strong> — interactions on posts</li>
        <li><strong>Decentralised identity</strong> — your identity (DID) is portable across servers</li>
        <li><strong>Data portability</strong> — export your data and move to a different PDS</li>
        <li><strong>Moderation</strong> — labelling system; users choose which labellers to trust</li>
        <li><strong>Search</strong> — search posts, users, hashtags</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Decentralisation</td><td>No single company controls all data — anyone can run a PDS</td></tr>
        <tr><td>Data Portability</td><td>Users own their data — can migrate to any PDS with their history</td></tr>
        <tr><td>Eventual Consistency</td><td>Posts propagate across the network in seconds — lag is acceptable</td></tr>
        <tr><td>Availability</td><td>If one PDS goes down, rest of network continues</td></tr>
        <tr><td>Low Latency</td><td>Timeline loads fast — even if data spans multiple servers</td></tr>
        <tr><td>Censorship Resistance</td><td>No single party can delete all copies of content</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Bluesky is <strong>strongly AP</strong> across the federation — availability and partition tolerance are core to its decentralised ethos. Individual PDSes can choose their own CP vs AP trade-offs locally.</div>
      <table class="nfr-table">
        <tr><td><strong>User repository (posts, likes, follows)</strong><br><span style="color:#888;font-size:11px;">Merkle tree in SQLite / PostgreSQL on PDS (CP locally)</span></td><td>Each user's data is a content-addressed repository (like a git repo). Within one PDS, strongly consistent. Across federation, eventually consistent.</td></tr>
        <tr><td><strong>App View (aggregated feed)</strong><br><span style="color:#888;font-size:11px;">PostgreSQL + Redis (AP)</span></td><td>Bluesky's App View aggregates data from all PDSes into a queryable index. AP — shows the world as it was a few seconds ago. High availability is key.</td></tr>
        <tr><td><strong>DID / Identity</strong><br><span style="color:#888;font-size:11px;">Distributed DID registry (CP)</span></td><td>Decentralised Identifiers must be globally unique and consistent — otherwise identity theft. DID resolution goes to a CP registry (or blockchain).</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">AT Protocol (Federated Social)</div><div style="font-size:12px;color:#555;margin-top:4px;">Like ActivityPub (Mastodon) but with content-addressing. Each post has a permanent content-addressed URI. Posts can be verified to not have been tampered with. Works similarly to how email federation works.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Content Addressing (Merkle DAG)</div><div style="font-size:12px;color:#555;margin-top:4px;">Each user's repository is a Merkle tree — like a git commit tree. Any change produces a new root hash. Anyone can verify data integrity. Portable: move your repo to another PDS, the hashes still verify.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Relay + App View Pattern</div><div style="font-size:12px;color:#555;margin-top:4px;">Relay crawls all PDSes and aggregates the firehose of events. App View consumes the relay and builds a centralised queryable index (like a search engine for the federated network). Allows fast queries across decentralised data.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Events / day</div>
          <div class="cap-calc-math">100K users × 5 actions/day (post, like, follow, repost, reply)</div>
          <div class="cap-calc-result">500K / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Events / sec into relay</div>
          <div class="cap-calc-math">500K events/day ÷ 86,400 sec/day</div>
          <div class="cap-calc-result">~6 / sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Avg post record size</div>
          <div class="cap-calc-math">300-char text + CID hash + DID + timestamp + sig<br>~2KB JSON stored in user's PDS repo</div>
          <div class="cap-calc-result">~2 KB</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Relay ingestion</div>
          <div class="cap-calc-math">Relay crawls N PDSes (could be thousands of servers)<br>Each PDS pushes its firehose — relay merges all into one stream</div>
          <div class="cap-calc-result">Many PDSes → 1 stream</div>
        </div>
      </div>
      <div class="insight-box">
        The relay is the centralised aggregation bottleneck in an otherwise decentralised system. It must process 6 events/sec from potentially thousands of independent PDS servers — and must be <strong>horizontally scalable</strong> as the network grows.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Users</div>
        <div class="hld-row"><div class="hld-node c-blue">👤 User Client<div class="node-sub">Any AT Protocol app</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Personal Data Servers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-teal">🗃️ PDS A<div class="node-sub">Your data repo</div></div>
          <div class="hld-node c-teal">🗃️ PDS B<div class="node-sub">Another server</div></div>
          <div class="hld-node c-teal">🗃️ PDS C<div class="node-sub">Self-hosted</div></div>
        </div></div>
        <div class="hld-arrow">↓ firehose</div>
        <div class="layer-name">Relay</div>
        <div class="hld-row"><div class="hld-node c-orange">📡 Relay (BGS)<div class="node-sub">Crawls all PDSes · aggregates events</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">App View</div>
        <div class="hld-row"><div class="hld-node c-green">🖥️ App View<div class="node-sub">Queryable index · timelines · search</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Feed Generators</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-purple">📰 Following Feed</div>
          <div class="hld-node c-purple">🔥 Discover Feed</div>
          <div class="hld-node c-purple">🎯 Custom Algo</div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Identity</div>
        <div class="hld-row"><div class="hld-node c-yellow">🪪 DID Registry<div class="node-sub">Decentralised identity</div></div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>Key difference from centralised social:</strong> Your posts live on your PDS (which you can self-host). Bluesky's App View is just one of many possible frontends. Another company can build a different app on the same AT Protocol data.</div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">AT Protocol Record Types (stored in PDS repos)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">🪪</span><span class="db-node-name">identity (DID Doc)</span></div><div class="db-node-body"><div class="db-row pk">🔑 did <span>e.g. did:plc:abc123</span></div><div class="db-row">handle <span>e.g. alice.bsky.social</span></div><div class="db-row">pds_url <span>Where repo is hosted</span></div><div class="db-row">signing_key <span>Public key for verification</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📝</span><span class="db-node-name">post (app.bsky.feed.post)</span></div><div class="db-node-body"><div class="db-row pk">🔑 AT URI <span>at://did/collection/rkey</span></div><div class="db-row fk">🔗 author DID</div><div class="db-row">text <span>VARCHAR(300)</span></div><div class="db-row">reply_to <span>AT URI (nullable)</span></div><div class="db-row">createdAt <span>ISO 8601</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">❤️</span><span class="db-node-name">like (app.bsky.feed.like)</span></div><div class="db-node-body"><div class="db-row pk">🔑 AT URI</div><div class="db-row fk">🔗 subject <span>AT URI of liked post</span></div><div class="db-row">createdAt <span>ISO 8601</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">👥</span><span class="db-node-name">follow (app.bsky.graph.follow)</span></div><div class="db-node-body"><div class="db-row pk">🔑 AT URI</div><div class="db-row fk">🔗 subject <span>DID of followed user</span></div><div class="db-row">createdAt <span>ISO 8601</span></div></div></div>
      </div>
      <div class="insight-box">AT URI format: <code>at://did:plc:alice/app.bsky.feed.post/3k4hxyz</code> — self-describing, portable, content-addressable. The DID tells you which PDS to fetch it from.</div>` },
    { name: 'Deep Dive — Federation & Portability', content: `
      <div class="content-label">How data portability works</div>
      <ul class="req-list">
        <li><strong>1. Your repo</strong> — all your posts, likes, follows are stored as a Merkle tree on your PDS. The root hash changes with every new record.</li>
        <li><strong>2. Signed commits</strong> — each change is signed with your private key. Anyone can verify data wasn't tampered with.</li>
        <li><strong>3. Migration</strong> — want to move to a new PDS? Export your repo (a single file), import to new PDS, update your DID document to point to new PDS URL. Relay sees the update and starts crawling from the new PDS.</li>
        <li><strong>4. Followers keep following you</strong> — they follow your DID, not your PDS URL. DID resolves to wherever you are now.</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;">This is fundamentally different from Twitter/Instagram: your followers don't belong to the platform — they belong to your DID. The platform can't hold your social graph hostage.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>📡 Relay is a centralisation point</strong><br><span style="color:#888;">The Relay (BGS) crawls all PDSes — if the Relay is run by one company, it becomes a power centre.</span><br><span style="color:#555;display:block;margin-top:4px;">Trade-off: Bluesky plans multiple competing Relays. Anyone can run one. True decentralisation is a gradient.</span></li>
        <li><strong>🔍 Search across federated data is hard</strong><br><span style="color:#888;">Elasticsearch index is built from the Relay firehose. If a PDS is slow or down, its data lags in search.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: App View caches known-good data. Eventually consistent search is acceptable for social media.</span></li>
        <li><strong>🛡️ Spam / moderation in open system</strong><br><span style="color:#888;">Anyone can run a PDS and post spam. Centralised moderation is impossible.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Labelling system — trusted labellers flag content. Users choose which labellers to trust. No single moderation authority.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Centralised vs Federated</td><td>Centralised (Twitter): fast, easy to moderate, single company controls. Federated (Bluesky): resilient, user-owned data, harder to moderate at scale.</td></tr>
        <tr><td>AT Protocol vs ActivityPub</td><td>ActivityPub (Mastodon): server-centric, data lives on your server. AT Protocol: user-centric, data is portable across servers via DID.</td></tr>
      </table>` }
  ]
};

// ── STOCK EXCHANGE ────────────────────────────────────────
systems['stockexchange'] = {
  name: 'Stock Exchange', sub: 'Order matching engine',
  steps: [
    { name: 'Functional Requirements', content: `

      <div class="content-section">
        <div class="content-label">First — what actually is a stock exchange?</div>
        <div class="insight-box">
          Think of it like OLX or eBay — but for company shares, running at insane speed.<br><br>
          You want to <strong>buy</strong> 10 shares of Apple. Someone else wants to <strong>sell</strong> 10 shares of Apple.
          The stock exchange is the platform that finds you both, agrees on a price, and completes the deal — automatically,
          in under a millisecond, for millions of people at the same time.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">What users can do</div>
        <ul class="req-list">
          <li><strong>Place a Buy order</strong> — "I want to buy 100 Apple shares." You can say "at any price right now" (market order) or "only if the price is below $150" (limit order).</li>
          <li><strong>Place a Sell order</strong> — "I want to sell my 100 Apple shares." Same options — sell now at market price, or only at your target price.</li>
          <li><strong>Cancel an order</strong> — Changed your mind before it executed? You can cancel it as long as nobody has matched it yet.</li>
          <li><strong>See live prices</strong> — The price ticker you see on Zerodha, Groww, or Robinhood — that's the exchange broadcasting every trade that just happened.</li>
          <li><strong>See trade history</strong> — Every completed buy/sell is permanently recorded — price, quantity, timestamp. Both buyer and seller get a receipt.</li>
          <li><strong>Account balance &amp; portfolio</strong> — How much cash do you have? How many shares do you hold? This is tracked in real time.</li>
          <li><strong>Circuit breaker</strong> — If prices crash too fast (panic selling), trading automatically pauses for a few minutes to let people calm down.</li>
        </ul>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why can't buyers and sellers just find each other directly, like WhatsApp?</strong></td><td>Because at 9:30 AM market open, a million people are all trying to buy and sell simultaneously. There is no "finding each other" — you need a central system that holds all outstanding offers and automatically pairs them in microseconds. Direct peer-to-peer is just too slow and too chaotic.</td></tr>
          <tr><td><strong>Q: What's the difference between NSE, BSE, and a broker like Zerodha?</strong></td><td>NSE and BSE are the exchanges — they run the matching engine. Zerodha is a broker — it's just the app you use to send your orders to the exchange. Think of NSE as the stock exchange building and Zerodha as your agent who walks your order inside.</td></tr>
          <tr><td><strong>Q: What does "instrument" mean in trading systems?</strong></td><td>Just a fancy word for "anything you can trade." AAPL stock is an instrument. USD/INR currency pair is an instrument. Gold futures is an instrument. Each one has its own separate order book.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Non-Functional Requirements', content: `

      <div class="content-section">
        <div class="content-label">The scary one — why milliseconds matter here but not on Instagram</div>
        <div class="insight-box">
          When Instagram takes 200ms to load your feed — you don't care. You scroll on.<br><br>
          When a stock exchange takes 200ms to process your order — you lose money. In 200ms, a high-frequency trading algorithm has already bought and re-sold the shares you were trying to buy, at a better price. Your order lands late and fills at a worse price.<br><br>
          This is why the exchange obsesses over microseconds. <strong>Latency = money lost.</strong>
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The requirements, explained simply</div>
        <table class="nfr-table">
          <tr>
            <td><strong>Ultra-Low Latency</strong><br><span style="color:#6366f1;font-size:11px;">&lt; 1 millisecond</span></td>
            <td>From the moment your "buy" order arrives at the exchange to the moment it's matched — under 1ms. Top HFT exchanges (NYSE, NASDAQ) do it in microseconds. This is not a nice-to-have. It's the whole product.</td>
          </tr>
          <tr>
            <td><strong>No Duplicate Trades</strong><br><span style="color:#6366f1;font-size:11px;">Exactly-once guarantee</span></td>
            <td>The single scariest bug in exchange software: one order matches twice. You sold 100 shares but the exchange recorded 200 shares sold. Your money is gone. No bug in any other system — not Twitter, not Netflix — causes this kind of direct financial harm. Duplicates are existential.</td>
          </tr>
          <tr>
            <td><strong>High Throughput</strong><br><span style="color:#6366f1;font-size:11px;">Millions of orders/sec</span></td>
            <td>At 9:30 AM on a volatile day, every trader's algorithm fires simultaneously. The exchange must swallow 1M+ orders per second without slowing down. Not because it's cool — because if it slows down, prices get stale and the whole market breaks.</td>
          </tr>
          <tr>
            <td><strong>Fairness</strong><br><span style="color:#6366f1;font-size:11px;">Price-time priority</span></td>
            <td>Rule: best price gets priority. If two people offer the same price, whoever arrived first gets priority. This is not just good design — it's a legal requirement. Exchanges are regulated. Unfair matching = criminal charges.</td>
          </tr>
          <tr>
            <td><strong>Durability</strong><br><span style="color:#6366f1;font-size:11px;">No order lost on crash</span></td>
            <td>The matching engine lives in memory (fast). But memory disappears on a crash. Every single order must also be written to a durable log before processing. If the server crashes and restarts, it replays the log and recovers every order — zero loss.</td>
          </tr>
          <tr>
            <td><strong>Auditability</strong><br><span style="color:#6366f1;font-size:11px;">Full trail for regulators</span></td>
            <td>SEBI, SEC, and every regulator in the world can subpoena your exchange's logs. Every order, every match, every cancellation — timestamped to the nanosecond — must be stored for years. This is not optional.</td>
          </tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">Where do you use which database — and why</div>
        <div class="insight-box" style="margin-bottom:12px;">
          Stock exchange is <strong>always CP, never AP</strong>. You can halt trading (sacrifice availability) but you cannot show the wrong balance or create a duplicate trade (sacrifice consistency). Money is involved — correctness beats uptime.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>Order book (live, in-flight orders)</strong></td>
            <td><strong>Pure in-memory — no database at all.</strong> The matching engine holds the entire order book in RAM. Why? Because any disk read would cost ~1ms, and the engine needs to complete matching in under 1ms total. RAM access is ~100 nanoseconds. Disk is 10,000× slower.</td>
          </tr>
          <tr>
            <td><strong>Orders &amp; completed trades</strong></td>
            <td><strong>PostgreSQL (CP) + Kafka as a write-ahead log.</strong> Every order is appended to Kafka first (durable event log). After matching, the trade record is written to PostgreSQL. ACID guaranteed — no partial writes.</td>
          </tr>
          <tr>
            <td><strong>Live price ticker</strong></td>
            <td><strong>Redis broadcast (AP is fine here).</strong> The price you see on your trading app can be 10ms stale — that's acceptable. Redis pub/sub broadcasts each trade to all subscribers. The matching engine never waits for this — it fires and forgets.</td>
          </tr>
          <tr>
            <td><strong>Account balances</strong></td>
            <td><strong>PostgreSQL (CP) — row-level locks.</strong> You cannot sell shares you don't own. Balance must be strongly consistent. Two people cannot sell the same share simultaneously. Row-level locking in Postgres prevents this.</td>
          </tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: If the order book is only in memory, what happens when the server crashes?</strong></td><td>Every order is written to Kafka (a durable event log on disk) BEFORE the matching engine processes it. On restart, the engine replays all events from Kafka in order and rebuilds the exact same order book state. It's like Git — you can always reconstruct the current state by replaying history.</td></tr>
          <tr><td><strong>Q: Why not use a fast database like Redis for the order book instead of raw memory?</strong></td><td>Even Redis has network overhead — a Redis call takes ~0.5ms over localhost. The matching engine is on the same machine as the order book — it reads directly from a memory address. No network, no serialization, no overhead. ~10 nanoseconds vs ~500,000 nanoseconds. That's a 50,000× difference.</td></tr>
          <tr><td><strong>Q: What's a "write-ahead log" and why use Kafka for it?</strong></td><td>A write-ahead log (WAL) means: before you do anything, write what you're about to do to a log. If you crash mid-operation, replay the log on restart and finish the work. Kafka is perfect for this because it's append-only, fast, and replayed in exact order. PostgreSQL itself uses a WAL internally — Kafka is just doing the same thing at the distributed system level.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Capacity Estimation', content: `

      <div class="content-section">
        <div class="content-label">Let's think about the 9:30 AM problem first</div>
        <div class="insight-box">
          Imagine it's Tuesday morning. Market opens at 9:30 AM. Every algorithm trader, every retail investor, every institutional fund — they've all been preparing orders overnight. At exactly 9:30:00.000, they all hit "submit" simultaneously. This is the hardest moment for any exchange to handle — a massive burst of traffic compressed into one second.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The numbers</div>
        <div class="cap-calc">
          <div class="cap-calc-row">
            <div class="cap-calc-label">Active traders</div>
            <div class="cap-calc-math">Assume 100,000 active traders on a mid-size exchange<br>(NSE has ~50M registered, ~3M active on a typical day)</div>
            <div class="cap-calc-result">100K traders</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Peak burst at open</div>
            <div class="cap-calc-math">100K traders × 10 orders each, all hitting at 9:30 AM<br>All orders arrive in the same 1-second window</div>
            <div class="cap-calc-result">~1M orders/sec</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Target latency</div>
            <div class="cap-calc-math">Order arrives → matching engine → trade confirmed<br>No disk read allowed in this path — must be pure memory</div>
            <div class="cap-calc-result">&lt; 1ms end-to-end</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Size of one order</div>
            <div class="cap-calc-math">Stock symbol (8 bytes) + price (8B) + quantity (4B)<br>+ side buy/sell (1B) + timestamp (8B) + order ID (16B) + padding</div>
            <div class="cap-calc-result">~200 bytes per order</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Order book RAM needed</div>
            <div class="cap-calc-math">500K open (unmatched) orders × 200 bytes each<br>= 100MB for one stock. 500 stocks = 50GB — fits in a server</div>
            <div class="cap-calc-result">~50 GB RAM total</div>
          </div>
          <div class="cap-calc-row">
            <div class="cap-calc-label">Kafka log growth</div>
            <div class="cap-calc-math">1M orders/sec × 200 bytes = 200 MB/sec<br>= 12 GB/minute during peak. Retained for 7 days for replay.</div>
            <div class="cap-calc-result">~84 TB/week</div>
          </div>
        </div>
        <div class="insight-box" style="margin-top:4px;">
          <strong>The key insight:</strong> The matching engine is <strong>CPU-bound, not storage-bound</strong>. The bottleneck is not "can we store enough orders" — RAM is cheap. The bottleneck is "can we process each order in under 1 microsecond." That's the engineering challenge everything else is designed around.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why 200 bytes per order? That seems oddly small.</strong></td><td>Orders are designed to be tiny because they move at 1M/sec. A 200-byte order fits in a few CPU cache lines. The matching engine can load and compare an entire order without a single cache miss. If orders were 2KB, the cache pressure alone would add microseconds of latency per order.</td></tr>
          <tr><td><strong>Q: 50GB of RAM just for the order book — is that realistic?</strong></td><td>Absolutely. A modern server has 256GB–1TB of RAM. The order book for all active stocks fits comfortably. Remember — not all 500 stocks have 500K open orders simultaneously. Popular stocks (AAPL, TSLA) have deep books; obscure ones have thin books. 50GB is a safe upper bound.</td></tr>
          <tr><td><strong>Q: Why retain Kafka logs for 7 days?</strong></td><td>Two reasons. First, if the matching engine crashes, it replays Kafka to rebuild the order book — you need at least today's log. Second, regulators can ask "show me every order placed on Tuesday" — you need to have that data. 7 days is the typical retention window before logs are archived to cold storage.</td></tr>
        </table>
      </div>
    ` },
    { name: 'High Level Design (HLD)', content: `

      <div class="content-section">
        <div class="content-label">Follow one order — from your phone to a completed trade</div>
        <div class="insight-box">
          The best way to understand the architecture is to trace a single "Buy 10 shares of AAPL" order from the moment you tap "Submit" to the moment the trade completes. Every component exists to serve this journey.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The journey of one order</div>
        <div style="display:flex;flex-direction:column;gap:0;">

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-radius:10px 10px 0 0;border-bottom:none;">
            <div style="width:32px;height:32px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">1</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">You tap "Buy" on Zerodha / Groww</div>
              <div style="font-size:12px;color:#555;">Your broker app sends the order over the internet to the exchange's Order Gateway. Retail apps use REST. Professional trading firms use FIX protocol — a decades-old financial messaging standard designed for speed.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-left:1px solid #e0e7ff;border-right:1px solid #e0e7ff;">
            <div style="width:32px;height:32px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">2</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">Order Gateway checks: is this order even valid?</div>
              <div style="font-size:12px;color:#555;">Three quick checks: Are you logged in? Do you have enough money in your account to buy? Is the price you specified in a valid format (stocks trade in specific price increments called "tick sizes")? If any check fails → rejected instantly. No wasted time sending bad orders to the matching engine.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#fff8f0;border:1px solid #fed7aa;border-left:1px solid #fed7aa;border-right:1px solid #fed7aa;">
            <div style="width:32px;height:32px;background:#ea580c;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">3</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">Written to Kafka — the "save point" before anything happens</div>
              <div style="font-size:12px;color:#555;">Before touching the order book, the order is appended to a Kafka log on disk. This is the safety net. If the server crashes right now — after writing to Kafka but before matching — on restart the engine replays Kafka and processes this order as if nothing happened. <strong>No order is ever lost.</strong></div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#fff0f0;border:1px solid #fca5a5;border-left:1px solid #fca5a5;border-right:1px solid #fca5a5;">
            <div style="width:32px;height:32px;background:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">4</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">⚡ Matching Engine — the heart of the exchange</div>
              <div style="font-size:12px;color:#555;">The order enters a ring buffer (a fast in-memory queue). The matching engine picks it up and checks the order book: "Is there a seller willing to sell at or below the price this buyer wants?" If yes → trade. If no → the buy order sits in the book waiting. This happens in under 1 microsecond.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0 0 10px 10px;">
            <div style="width:32px;height:32px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">5</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">Trade confirmed — everything else happens in parallel, asynchronously</div>
              <div style="font-size:12px;color:#555;">The match is done. Now three things happen simultaneously — but the matching engine doesn't wait for any of them: (a) trade record written to PostgreSQL for permanent storage, (b) buyer's and seller's account balances updated, (c) new price broadcasted to all trading apps via WebSocket. You see "Order Filled" on your screen within milliseconds.</div>
            </div>
          </div>

        </div>
      </div>

      <div class="content-section">
        <div class="content-label">System diagram</div>
        <div class="hld-graph">
          <div class="layer-name">Your App (Zerodha / Bloomberg)</div>
          <div class="hld-row"><div class="hld-multi">
            <div class="hld-node c-blue">🏦 Broker API<div class="node-sub">FIX protocol (pro traders)</div></div>
            <div class="hld-node c-blue">📱 Retail App<div class="node-sub">REST / WebSocket</div></div>
          </div></div>
          <div class="hld-arrow">↓ your order travels here</div>
          <div class="hld-row"><div class="hld-node c-orange">🚪 Order Gateway<div class="node-sub">Auth · balance check · format validation</div></div></div>
          <div class="hld-arrow">↓ saved to Kafka first (safety net)</div>
          <div class="hld-row"><div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Durable event log — survives crashes</div></div></div>
          <div class="hld-arrow">↓ order enters ring buffer</div>
          <div class="hld-row"><div class="hld-node c-red" style="border-color:#fca5a5;background:#fff1f2;">⚡ Matching Engine<div class="node-sub">Single thread · in-memory order book · &lt;1μs per order</div></div></div>
          <div class="hld-arrow">↓ trade matched — now everything is async</div>
          <div class="hld-row"><div class="hld-multi">
            <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Permanent trade records</div></div>
            <div class="hld-node c-green">📊 Market Data<div class="node-sub">Price to all your apps</div></div>
            <div class="hld-node c-purple">💰 Settlement<div class="node-sub">Update balances</div></div>
          </div></div>
        </div>
        <div class="comm-block" style="margin-top:16px;">
          <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Your order → Gateway → Kafka → Matching Engine → trade result (under 1ms, you wait for this)</div>
          <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Trade done → PostgreSQL + Settlement + Market Data (happens in background, you don't wait)</div>
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why write to Kafka BEFORE the matching engine processes the order? Isn't that slower?</strong></td><td>Yes, it adds a tiny amount of time (~50 microseconds for a Kafka append). But without it, if the matching engine crashes between receiving an order and processing it, that order simply disappears — no record it ever existed. The trader thinks their order is pending; the exchange has no memory of it. That's a disaster. The 50μs is worth it.</td></tr>
          <tr><td><strong>Q: Why not just use a regular queue (like RabbitMQ) instead of a ring buffer?</strong></td><td>RabbitMQ and similar queues allocate memory for each message (malloc) and deallocate when consumed (free). At 1M orders/sec, malloc/free overhead alone adds milliseconds. The ring buffer is pre-allocated once at startup — it reuses the same fixed memory slots forever. No allocation, no deallocation, no garbage collector. 100× faster for this specific use case.</td></tr>
          <tr><td><strong>Q: What is FIX protocol and why do professional traders use it instead of REST?</strong></td><td>FIX (Financial Information eXchange) is a 30-year-old text-based protocol specifically designed for trading. It's not faster than REST in raw speed — it's actually similar. The reason pros use it: it's the industry standard, every exchange supports it, and it carries rich trading-specific metadata (order type, routing instructions, execution conditions) that REST APIs don't natively support.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Data Modeling', content: `

      <div class="content-section">
        <div class="content-label">Think of the database as a court of record</div>
        <div class="insight-box">
          The order book (inside the matching engine) is in memory — blazing fast, but gone on crash. The database is the <strong>permanent legal record</strong>. Every order ever placed, every trade ever executed, every balance ever changed — it lives here, immutable, auditable forever.<br><br>
          You only need four tables. But how they connect determines whether settlements work, whether a regulator can audit you, and whether the system recovers from a crash in 500ms or 3 hours.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The four tables, explained simply</div>

        <table class="nfr-table" style="margin-bottom:20px;">
          <tr>
            <td><strong>📊 instruments</strong></td>
            <td>The catalog of everything tradeable. AAPL, TSLA, NIFTY50, USD/INR. Each entry has a tick size (smallest price move — AAPL can't be priced at $152.003, only $152.00 or $152.01) and lot size (minimum quantity per order). This table rarely changes — maybe a few new entries per week.</td>
          </tr>
          <tr>
            <td><strong>📋 orders</strong></td>
            <td>Your Amazon orders page — but for the exchange. Every buy/sell request ever submitted by anyone, with its current status: open (waiting to match), filled (done), or cancelled. This is the paper trail. Even if an order never filled, it's recorded here so auditors can verify what traders tried to do.</td>
          </tr>
          <tr>
            <td><strong>🤝 trades</strong></td>
            <td>The executed deals ledger. One row per partial or full fill — it records <em>which buy order</em> matched <em>which sell order</em>, at what price, at what quantity, at exactly what nanosecond. This is what settlement runs on. The trades table is the money table.</td>
          </tr>
          <tr>
            <td><strong>💰 accounts</strong></td>
            <td>Each trader's wallet: how much cash they hold, how much margin is available (borrowed buying power). Updated atomically after each trade by the settlement service. The matching engine never reads this — only the risk engine checks it pre-trade, and the settlement service updates it post-trade.</td>
          </tr>
        </table>

        <div class="content-label">Schema — the actual columns</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📊</span><span class="db-node-name">instruments</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>VARCHAR · PK (e.g. AAPL)</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">lot_size <span>INT</span></div><div class="db-row">tick_size <span>DECIMAL</span></div></div></div>
          <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📋</span><span class="db-node-name">orders</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>BIGINT · Snowflake PK</span></div><div class="db-row fk">🔗 account_id <span>FK → accounts</span></div><div class="db-row fk">🔗 instrument_id <span>FK → instruments</span></div><div class="db-row">side <span>ENUM (buy, sell)</span></div><div class="db-row">type <span>ENUM (market, limit)</span></div><div class="db-row">price <span>DECIMAL (nullable for market)</span></div><div class="db-row">qty <span>INT</span></div><div class="db-row">status <span>ENUM (open, filled, cancelled)</span></div></div></div>
          <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🤝</span><span class="db-node-name">trades</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>BIGINT · PK</span></div><div class="db-row fk">🔗 buy_order_id <span>FK → orders</span></div><div class="db-row fk">🔗 sell_order_id <span>FK → orders</span></div><div class="db-row">price <span>DECIMAL</span></div><div class="db-row">qty <span>INT</span></div><div class="db-row">executed_at <span>TIMESTAMP (ns precision)</span></div></div></div>
          <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">💰</span><span class="db-node-name">accounts</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row">cash_balance <span>DECIMAL</span></div><div class="db-row">margin_available <span>DECIMAL</span></div></div></div>
        </div>

        <div class="content-label">How they connect</div>
        <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin-bottom:20px;">
          <svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <defs><marker id="arrE" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ccc"/></marker></defs>
            <rect x="90" y="10" width="140" height="70" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="1.5"/>
            <text x="160" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#a16207">📋 orders</text>
            <line x1="90" y1="38" x2="230" y2="38" stroke="#fef08a" stroke-width="1"/>
            <text x="100" y="52" font-size="10" fill="#555">🔑 id · Snowflake</text>
            <text x="100" y="66" font-size="10" fill="#0369a1">🔗 account_id, instrument_id</text>
            <rect x="290" y="10" width="140" height="70" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <text x="360" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">🤝 trades</text>
            <line x1="290" y1="38" x2="430" y2="38" stroke="#bbf7d0" stroke-width="1"/>
            <text x="300" y="52" font-size="10" fill="#0369a1">🔗 buy_order_id</text>
            <text x="300" y="66" font-size="10" fill="#0369a1">🔗 sell_order_id</text>
            <rect x="10" y="130" width="130" height="55" rx="8" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
            <text x="75" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#7e22ce">💰 accounts</text>
            <line x1="10" y1="158" x2="140" y2="158" stroke="#e9d5ff" stroke-width="1"/>
            <text x="20" y="172" font-size="10" fill="#555">🔑 id, cash_balance</text>
            <rect x="190" y="130" width="130" height="55" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="255" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="#1d4ed8">📊 instruments</text>
            <line x1="190" y1="158" x2="320" y2="158" stroke="#bfdbfe" stroke-width="1"/>
            <text x="200" y="172" font-size="10" fill="#555">🔑 id (AAPL), tick_size</text>
            <line x1="120" y1="80" x2="75" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
            <line x1="160" y1="80" x2="255" y2="130" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
            <line x1="230" y1="45" x2="290" y2="45" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
          </svg>
        </div>

        <div class="insight-box">
          Read it like this: one <strong>order</strong> belongs to one <strong>account</strong> and one <strong>instrument</strong>. One <strong>trade</strong> is born from exactly two orders — one buy, one sell. To reconstruct every trade in history, you only need these four tables. No external state required.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why is there a separate "trades" table? Can't we just mark orders as "filled" and store the price there?</strong></td><td>Because one order can produce multiple trades — called partial fills. If you buy 1000 shares and match 3 different sellers, that's 3 trade records but 1 order. If you merged them, you'd lose which sellers were involved, at what price each fill happened, and in what sequence. Settlement, tax reporting, and audits all need each individual fill as a separate row.</td></tr>
          <tr><td><strong>Q: Why Snowflake IDs for orders instead of auto-increment integers?</strong></td><td>Auto-increment needs a central counter — it becomes a bottleneck. Snowflake IDs are generated locally on each gateway server without coordination, yet they're globally unique and sortable by time. You can tell just by the ID number which order arrived first without querying a database. At 1M orders/sec, that matters.</td></tr>
          <tr><td><strong>Q: Why does executed_at need nanosecond precision? Milliseconds aren't enough?</strong></td><td>At 1M+ orders/second, thousands of events happen within the same millisecond. For regulatory audit trails and dispute resolution ("who got matched first?"), you need nanosecond resolution. Stock exchanges synchronize server clocks with GPS/PTP to within 100ns — the same technology used in global navigation systems.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Deep Dive — Matching Engine', content: `

      <div class="content-section">
        <div class="content-label">What is a Matching Engine — and why does it exist?</div>
        <div class="insight-box">
          Without a matching engine, a stock exchange is just a bulletin board. Buyers post what they want to pay. Sellers post what they want to receive. Nothing happens automatically.<br><br>
          The matching engine is the <strong>brain of the exchange</strong>. It is the single piece of software responsible for one job: given all outstanding buy orders and sell orders, find pairs that agree on price and create a trade between them — atomically, fairly, and in microseconds.<br><br>
          Every exchange in the world — NYSE, NASDAQ, BSE, NSE, CME — runs one. Without it, markets cannot function.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The Problem It Solves — Price Discovery</div>
        <table class="nfr-table">
          <tr><td><strong>Problem 1: What is the fair price?</strong></td><td>Nobody knows the "real" price of a stock at any moment. The matching engine reveals it in real time — the price at which a willing buyer and a willing seller agree is, by definition, the market price. This is called <strong>price discovery</strong>.</td></tr>
          <tr><td><strong>Problem 2: Fairness</strong></td><td>If 1,000 people all want to buy AAPL at the same price at the same moment, who gets it? The matching engine enforces <strong>price-time priority</strong>: best price first, earliest arrival first within the same price. No favouritism, no human judgement.</td></tr>
          <tr><td><strong>Problem 3: Atomicity</strong></td><td>A trade must happen completely or not at all. You cannot debit the buyer's account and then crash before crediting the seller. The matching engine creates a single atomic trade record that downstream systems (settlement, clearing) consume.</td></tr>
          <tr><td><strong>Problem 4: Speed at scale</strong></td><td>During market open (9:30 AM), 1M+ orders per second hit major exchanges. No human can process this. The matching engine does it in &lt;1 microsecond per order — faster than a camera shutter.</td></tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">The Order Book — The Matching Engine's Core Data Structure</div>
        <div class="insight-box" style="margin-bottom:14px;">
          Every instrument (AAPL, TSLA, BTC) has its own <strong>Order Book</strong> — two sorted lists maintained entirely in memory. All matching decisions are made by reading and writing this structure.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;">
            <div style="padding:10px 14px;border-bottom:1px solid #bbf7d0;font-size:12px;font-weight:700;color:#15803d;">📗 BID SIDE (Buy Orders)</div>
            <div style="padding:0;">
              <div style="display:grid;grid-template-columns:60px 60px 1fr;gap:0;font-size:11px;font-weight:700;color:#888;padding:6px 14px;border-bottom:1px solid #f0f0f0;">
                <span>PRICE</span><span>QTY</span><span>ORDERS</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;background:#dcfce7;">
                <span style="font-weight:700;color:#15803d;">$152.00</span><span>500</span><span style="color:#888;">← best bid</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;">
                <span style="font-weight:700;">$151.80</span><span>1,200</span><span style="color:#888;">3 orders</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;">
                <span style="font-weight:700;">$151.50</span><span>800</span><span style="color:#888;">2 orders</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;color:#ccc;">
                <span>$151.00</span><span>300</span><span></span>
              </div>
            </div>
            <div style="padding:8px 14px;font-size:10px;color:#888;border-top:1px solid #bbf7d0;">Sorted descending — highest bid first</div>
          </div>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;overflow:hidden;">
            <div style="padding:10px 14px;border-bottom:1px solid #fecaca;font-size:12px;font-weight:700;color:#dc2626;">📕 ASK SIDE (Sell Orders)</div>
            <div style="padding:0;">
              <div style="display:grid;grid-template-columns:60px 60px 1fr;gap:0;font-size:11px;font-weight:700;color:#888;padding:6px 14px;border-bottom:1px solid #f0f0f0;">
                <span>PRICE</span><span>QTY</span><span>ORDERS</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;background:#fee2e2;">
                <span style="font-weight:700;color:#dc2626;">$152.50</span><span>400</span><span style="color:#888;">← best ask</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;">
                <span style="font-weight:700;">$152.80</span><span>900</span><span style="color:#888;">2 orders</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;">
                <span style="font-weight:700;">$153.00</span><span>600</span><span style="color:#888;">1 order</span>
              </div>
              <div style="display:grid;grid-template-columns:60px 60px 1fr;padding:5px 14px;font-size:11.5px;border-top:1px solid #f0f0f0;color:#ccc;">
                <span>$153.50</span><span>200</span><span></span>
              </div>
            </div>
            <div style="padding:8px 14px;font-size:10px;color:#888;border-top:1px solid #fecaca;">Sorted ascending — lowest ask first</div>
          </div>
        </div>

        <div class="insight-box">
          <strong>Spread = Best Ask − Best Bid = $152.50 − $152.00 = $0.50</strong><br>
          The spread is the cost of immediate execution. A smaller spread = more liquid market. The matching engine's job is to find pairs where best_bid ≥ best_ask (a crossable spread) — when that happens, a trade occurs.<br><br>
          Right now these orders <em>don't</em> cross ($152.00 &lt; $152.50), so both sides wait.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Order Types — What the Engine Accepts</div>
        <table class="nfr-table">
          <tr>
            <td><strong>Market Order</strong></td>
            <td>"Buy 100 shares at whatever price is available right now." Guaranteed to execute immediately. No price specified — engine walks the ask side from best price upward until the order is fully filled. Risk: price may be worse than expected in thin markets (<em>slippage</em>).</td>
          </tr>
          <tr>
            <td><strong>Limit Order</strong></td>
            <td>"Buy 100 shares, but only at $152.00 or better." Price-capped. If best ask &gt; $152.00, order rests in the book until a seller comes down to that price. Guaranteed price — not guaranteed execution. Most common order type.</td>
          </tr>
          <tr>
            <td><strong>Stop Order</strong></td>
            <td>"Trigger a market order only when price hits $150.00." Used for stop-loss. The engine monitors price. When the trigger price is crossed, it converts to a market order and executes. The matching engine keeps a separate <em>stop book</em> for these.</td>
          </tr>
          <tr>
            <td><strong>IOC — Immediate or Cancel</strong></td>
            <td>"Fill whatever you can right now, cancel the rest." If only 60 of 100 shares can be filled immediately, 60 fill and 40 are cancelled. No resting in the book. Used by algorithmic traders who don't want market impact from a pending order.</td>
          </tr>
          <tr>
            <td><strong>FOK — Fill or Kill</strong></td>
            <td>"Fill the entire 100 shares immediately or cancel everything." All-or-nothing. If the full quantity isn't available at the specified price right now, the entire order is rejected. Used for large institutional orders.</td>
          </tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">The Matching Algorithm — Step by Step</div>
        <div style="display:flex;flex-direction:column;gap:0;margin-bottom:16px;">

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-radius:10px 10px 0 0;border-bottom:none;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">1</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Order arrives at the gateway</div>
              <div style="font-size:12px;color:#555;">Order Gateway validates: authenticated user, sufficient balance, instrument exists, price in valid tick increments. Risk engine checks position limits. If any check fails, order is rejected immediately.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-left:1px solid #e0e7ff;border-right:1px solid #e0e7ff;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">2</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Assigned a Snowflake ID + timestamp</div>
              <div style="font-size:12px;color:#555;">Every order gets a globally unique monotonic ID and a nanosecond-precision timestamp. This timestamp determines time priority — the tiebreaker when two orders have the same price. Clocks are synchronized with GPS/PTP to nanosecond accuracy.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-left:1px solid #e0e7ff;border-right:1px solid #e0e7ff;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">3</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Published to the ring buffer</div>
              <div style="font-size:12px;color:#555;">The validated order is placed into a lock-free ring buffer (LMAX Disruptor pattern). The matching engine reads from this buffer one order at a time — strictly sequential. No two orders are processed simultaneously. This eliminates all race conditions without a single lock.</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-left:1px solid #e0e7ff;border-right:1px solid #e0e7ff;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">4</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Match attempt against the opposite side</div>
              <div style="font-size:12px;color:#555;">
                Buy order arrives → look at the best ask.<br>
                <strong>Condition to match:</strong> order.price ≥ best_ask.price (for buy) — the buyer is willing to pay at least what the cheapest seller wants.<br>
                If yes → match. Trade executes at the <em>resting order's price</em> (the ask price). The aggressor (new order) gets price improvement if available.
              </div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f8faff;border:1px solid #e0e7ff;border-left:1px solid #e0e7ff;border-right:1px solid #e0e7ff;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">5</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Partial fills — when sizes don't align</div>
              <div style="font-size:12px;color:#555;">
                Buyer wants 1,000 shares. Best ask has only 400 shares available.<br>
                → 400 shares match at ask price. Buyer still needs 600.<br>
                → Move to next best ask level. Match 400 more. Buyer needs 200.<br>
                → Continue until the order is fully filled or no more matching orders exist.<br>
                If unfilled quantity remains and order is a limit order → it rests in the book. If market order → any unfilled quantity is cancelled.
              </div>
            </div>
          </div>

          <div style="display:flex;gap:14px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0 0 10px 10px;">
            <div style="width:28px;height:28px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">6</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:#111;margin-bottom:4px;">Trade event published — async from here</div>
              <div style="font-size:12px;color:#555;">The matching engine emits a Trade event: {buy_order_id, sell_order_id, price, qty, timestamp}. This goes to Kafka. From here, everything is async: settlement service updates balances, PostgreSQL persists the record, market data publisher broadcasts the new price. The engine never waits for any of this — it's already processing the next order.</div>
            </div>
          </div>

        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Worked Example — Full Matching Walkthrough</div>
        <div style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Fira Code',monospace;font-size:12px;padding:18px;border-radius:10px;line-height:1.9;overflow-x:auto;">
<span style="color:#94a3b8;">// AAPL order book state BEFORE the incoming order</span>
ASK side: $152.50 × 400 shares  (1 sell order, arrived at 09:30:00.000)
          $152.80 × 900 shares  (2 sell orders)

BID side: $152.00 × 500 shares  (2 buy orders)
          $151.80 × 1200 shares

<span style="color:#94a3b8;">// Incoming order: BUY 1,000 shares @ LIMIT $153.00</span>
<span style="color:#94a3b8;">// Buyer is willing to pay up to $153.00</span>

Step 1: best_ask = $152.50. Is $153.00 ≥ $152.50? YES → match
        Trade 1: 400 shares @ $152.50  (full ask level consumed)
        Remaining: 600 shares still needed

Step 2: next_ask = $152.80. Is $153.00 ≥ $152.80? YES → match
        Trade 2a: 500 shares @ $152.80  (first sell order, FIFO)
        Remaining: 100 shares still needed
        Trade 2b: 100 shares @ $152.80  (partial fill of second sell order)
        Remaining: 0 shares ← FULLY FILLED

<span style="color:#94a3b8;">// Result: 3 trade records created, buyer paid avg $152.65</span>
<span style="color:#94a3b8;">// Book now shows second sell order reduced from 400 to 300 shares</span>
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Why Single-Threaded? The LMAX Disruptor Architecture</div>
        <div class="insight-box" style="margin-bottom:14px;">
          The most counter-intuitive decision in exchange design: <strong>one CPU core, no parallelism, no locks</strong>. This is faster than a multi-threaded approach. Here is why.
        </div>
        <table class="nfr-table">
          <tr>
            <td><strong>Lock contention kills throughput</strong></td>
            <td>With multiple threads, every access to the order book requires a mutex lock. At 1M orders/sec, threads spend more time waiting for locks than doing work. Measured on real hardware: a lock acquisition takes ~100ns — the same time as processing an entire order.</td>
          </tr>
          <tr>
            <td><strong>Context switching costs microseconds</strong></td>
            <td>The OS scheduler switching between threads takes 1–10μs. For a matching engine targeting &lt;1μs latency, this is unacceptable. A pinned single thread that never gets preempted stays in L1 cache — orders are processed at cache speed.</td>
          </tr>
          <tr>
            <td><strong>Ring buffer replaces the queue</strong></td>
            <td>The LMAX Disruptor is a fixed-size ring buffer pre-allocated in memory. Producers (order gateways) write to it. The engine reads from it. No malloc, no GC, no locks — just sequential memory writes and reads. CPUs are optimised for this: hardware prefetcher loads the next cache line before it's needed.</td>
          </tr>
          <tr>
            <td><strong>Throughput numbers</strong></td>
            <td>LMAX Exchange processes 6M orders/sec on a single thread. The same workload on a multi-threaded design with locks achieves ~600K/sec. The single-threaded design is 10× faster despite using one core instead of many.</td>
          </tr>
        </table>
        <div style="margin-top:14px;background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:18px;">
          <svg viewBox="0 0 540 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
            <rect x="10" y="10" width="100" height="40" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="60" y="28" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">Order Gateway 1</text>
            <text x="60" y="42" text-anchor="middle" font-size="9" fill="#555">validates + writes</text>
            <rect x="10" y="70" width="100" height="40" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
            <text x="60" y="88" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">Order Gateway 2</text>
            <text x="60" y="102" text-anchor="middle" font-size="9" fill="#555">validates + writes</text>
            <rect x="155" y="20" width="170" height="80" rx="8" fill="#fefce8" stroke="#fef08a" stroke-width="2"/>
            <text x="240" y="45" text-anchor="middle" font-size="11" font-weight="700" fill="#a16207">Ring Buffer</text>
            <text x="240" y="60" text-anchor="middle" font-size="9" fill="#888">lock-free, pre-allocated</text>
            <text x="240" y="78" text-anchor="middle" font-size="9" fill="#555">[ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]...</text>
            <text x="240" y="92" text-anchor="middle" font-size="9" fill="#888">2^20 slots, ~1MB total</text>
            <line x1="110" y1="30" x2="155" y2="50" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
            <line x1="110" y1="90" x2="155" y2="80" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
            <rect x="380" y="20" width="150" height="80" rx="8" fill="#fee2e2" stroke="#fca5a5" stroke-width="2"/>
            <text x="455" y="45" text-anchor="middle" font-size="11" font-weight="700" fill="#dc2626">Matching Engine</text>
            <text x="455" y="60" text-anchor="middle" font-size="9" fill="#888">single thread, pinned core</text>
            <text x="455" y="76" text-anchor="middle" font-size="9" fill="#555">reads one order at a time</text>
            <text x="455" y="90" text-anchor="middle" font-size="9" fill="#888">&lt; 1μs per order</text>
            <line x1="325" y1="60" x2="380" y2="60" stroke="#ccc" stroke-width="1.5" marker-end="url(#arrE)"/>
          </svg>
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">Pre-Trade Risk Checks — What Happens Before Matching</div>
        <div class="insight-box" style="margin-bottom:12px;">The matching engine itself does no risk checks — it would add latency. Risk is enforced by a dedicated Risk Engine that sits <em>before</em> the ring buffer. Only validated orders enter the matching pipeline.</div>
        <table class="nfr-table">
          <tr><td><strong>Balance check</strong></td><td>Buy 1000 shares @ $152? You need $152,000. The risk engine checks your cash balance + margin before the order is accepted. If insufficient, reject immediately.</td></tr>
          <tr><td><strong>Position limits</strong></td><td>Regulators cap how much of a single stock one entity can hold. The risk engine checks current position + pending orders against this limit.</td></tr>
          <tr><td><strong>Price reasonableness</strong></td><td>Limit order priced 20% away from last trade? Probably a fat-finger error. The engine rejects orders outside a reasonable band to prevent accidental market crashes.</td></tr>
          <tr><td><strong>Duplicate order detection</strong></td><td>Network retries can cause the same order to arrive twice. The risk engine checks the client's order ID for duplicates within a short window and rejects repeats.</td></tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">Circuit Breakers — When the Engine Pauses Itself</div>
        <table class="nfr-table">
          <tr><td><strong>Level 1 (−7%)</strong></td><td>Market-wide halt for 15 minutes. Triggered when S&P 500 drops 7% from previous close. Orders queue but do not match. Example: March 2020 COVID crash triggered this 4 times in two weeks.</td></tr>
          <tr><td><strong>Level 2 (−13%)</strong></td><td>Another 15-minute halt if decline continues to 13% after market resumes.</td></tr>
          <tr><td><strong>Level 3 (−20%)</strong></td><td>Trading halted for the rest of the day. The exchange closes early.</td></tr>
          <tr><td><strong>Individual stock halt</strong></td><td>If a single stock moves &gt;10% in 5 minutes, that stock's matching engine pauses for 5 minutes. Implemented as a rolling price window per instrument. The matching engine checks this after every trade.</td></tr>
        </table>
        <div class="insight-box" style="margin-top:12px;">Circuit breakers don't lose your order — they pause matching. All open orders remain in the order book exactly as they were. When trading resumes, the engine continues from where it stopped.</div>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: If the matching engine is single-threaded, what happens during the microsecond it's processing one order? All other orders are just waiting?</strong></td><td>Yes — but the wait is so short it doesn't matter. The ring buffer holds all incoming orders. Gateways write to it at any time without blocking each other. The engine reads them one by one, each in under 1 microsecond. At 6M orders/second, an order waits in the buffer for an average of ~160 nanoseconds. The queue never builds up under normal load.</td></tr>
          <tr><td><strong>Q: What actually happens to my order if it only partially fills? Like I wanted 1000 shares but only 400 were available?</strong></td><td>For a limit order: the 400 shares execute immediately. The remaining 600 become a <em>resting order</em> — they stay in the order book and wait for a matching seller to arrive. You'll see the 600 as "open" in your brokerage app. For a market order: the 400 fill, and the remaining 600 continue walking up the ask side filling against the next available sellers until done. If the book runs out of sellers, the unfilled portion is cancelled.</td></tr>
          <tr><td><strong>Q: Why does the matching engine emit to Kafka and not write directly to PostgreSQL?</strong></td><td>Writing to PostgreSQL takes 1–10ms per row (disk I/O, network, ACID guarantee). The engine processes an order in under 1 microsecond. Writing directly to Postgres would slow the engine by 1,000–10,000x. Kafka is in-memory, append-only, and returns in microseconds. PostgreSQL writes happen asynchronously — the settlement service consumes from Kafka and persists at its own pace. The engine never blocks.</td></tr>
          <tr><td><strong>Q: How does the exchange guarantee no duplicate trades? What if the engine crashes mid-match?</strong></td><td>Every order is written to Kafka <em>before</em> it's placed in the ring buffer. If the engine crashes mid-match, it replays the Kafka log from the last committed offset — rebuilding the order book to its exact pre-crash state and re-processing all unconfirmed orders. The Kafka offset acts as a checkpoint. This is called a Write-Ahead Log pattern — the same technique PostgreSQL itself uses for crash recovery.</td></tr>
        </table>
      </div>

    ` },
    { name: 'Bottlenecks & Trade-offs', content: `

      <div class="content-section">
        <div class="content-label">What goes wrong — and why</div>
        <div class="insight-box">
          Most systems fail gradually. A stock exchange fails catastrophically — $1B+ can be lost in minutes when something breaks. These are the known failure modes, what causes them, and how real exchanges prevent them.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The three big breakdowns</div>

        <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;">

          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;">
            <div style="font-size:13px;font-weight:700;color:#c2410c;margin-bottom:8px;">Hot instruments — AAPL and TSLA receive 100× the orders of an average stock</div>
            <div style="font-size:12px;color:#555;margin-bottom:8px;">
              During earnings announcements, meme stock events, or major news, a single stock can receive orders faster than its matching engine core can process. The ring buffer fills. Newer orders wait behind millions of earlier ones. Latency explodes from microseconds to seconds.
            </div>
            <div style="font-size:12px;background:#fff;border:1px solid #fed7aa;border-radius:6px;padding:10px;">
              <strong>Fix:</strong> One matching engine instance per instrument, each pinned to its own CPU core. AAPL has its own engine. TSLA has its own. This isn't just load balancing — each engine has a completely independent order book in L2 cache. They never share memory. Add more instrument shards without touching existing ones.
            </div>
          </div>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;">
            <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px;">Matching engine crash — in-memory order book is gone</div>
            <div style="font-size:12px;color:#555;margin-bottom:8px;">
              The order book lives entirely in RAM for speed. Power cut, hardware failure, kernel panic — the book is gone. Without crash recovery, every open order disappears. Traders have pending orders they can't see or cancel. Chaos.
            </div>
            <div style="font-size:12px;background:#fff;border:1px solid #fecaca;border-radius:6px;padding:10px;">
              <strong>Fix:</strong> Every order is written to a Kafka topic <em>before</em> being added to the ring buffer. On restart, the engine replays the Kafka log from the last checkpoint, rebuilding the exact order book state in under 1 second. This is a Write-Ahead Log — the same crash-recovery pattern PostgreSQL uses, but over Kafka instead of disk.
            </div>
          </div>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;">
            <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:8px;">Market data fan-out — millions of subscribers per trade event</div>
            <div style="font-size:12px;color:#555;margin-bottom:8px;">
              Every trade creates a price update that must reach every Bloomberg terminal, trading app, and algorithmic trader simultaneously. There are potentially millions of subscribers. If the matching engine waits for even one slow subscriber, it stalls.
            </div>
            <div style="font-size:12px;background:#fff;border:1px solid #bae6fd;border-radius:6px;padding:10px;">
              <strong>Fix:</strong> Separate the market data path from the matching path. The engine writes one event to a Kafka topic. A dedicated market data publisher reads that topic and broadcasts to all subscribers in parallel. The engine never knows or cares who is listening. Slow subscribers just fall behind — they don't affect matching latency.
            </div>
          </div>

        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The Knight Capital story — what happens when you skip safeguards</div>
        <div class="insight-box">
          On August 1, 2012, Knight Capital deployed a software update to their trading system. A bug caused an old, dormant algorithm (called "Power Peg") to activate on live markets. In 45 minutes, the algorithm placed millions of unintended orders — buying high and selling low, the opposite of what it should do.<br><br>
          <strong>Result:</strong> Knight Capital lost $440 million in 45 minutes. The company was bankrupt by the end of the day and sold within weeks.<br><br>
          The safeguards that would have prevented it: a circuit breaker on order volume per minute, a position limit check ("you're now long $3B in stocks you didn't intend to hold"), and a kill switch that could halt all orders from a given source. Most exchanges now mandate all three.
        </div>
      </div>

      <div class="content-section">
        <div class="content-label">The fundamental design trade-offs</div>
        <table class="nfr-table">
          <tr>
            <td><strong>CP over AP</strong></td>
            <td>Unlike most web systems (which prefer availability), a stock exchange chooses consistency. A split-brain scenario where two matching engines both believe they're the primary = two engines both accepting and matching orders = duplicate trades = charging buyers twice = financial disaster. The exchange goes offline (unavailable) before it allows inconsistency.</td>
          </tr>
          <tr>
            <td><strong>In-memory order book vs database</strong></td>
            <td>In-memory: microsecond latency, but lost on crash. Database: millisecond latency (1,000× slower), unacceptable for matching. The answer is both: order book stays in memory for speed, Kafka acts as the write-ahead log for durability. You get speed <em>and</em> crash recovery without compromise.</td>
          </tr>
          <tr>
            <td><strong>Horizontal scaling by instrument</strong></td>
            <td>You can't shard the matching engine for one instrument across multiple servers — that would break price-time priority (two servers might match the same order simultaneously). Instead, each instrument has exactly one engine on exactly one server. Scale by adding more servers for more instruments, not by splitting one instrument across servers.</td>
          </tr>
          <tr>
            <td><strong>Latency vs fairness</strong></td>
            <td>Co-location services let high-frequency traders place their servers physically next to the exchange's matching engine — reducing network latency from ~10ms to ~50 microseconds. Some see this as unfair (buying speed). Exchanges permit it because HFTs also provide liquidity (they're often on the sell side, making it easier for retail traders to buy). Regulated co-location is a deliberate design choice, not an oversight.</td>
          </tr>
        </table>
      </div>

      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: If each instrument has its own matching engine, how many servers does a real exchange need?</strong></td><td>NSE India trades about 2,000 stocks. NASDAQ trades about 3,500. If each gets one dedicated engine with a hot standby, that's 4,000–7,000 cores just for matching. In practice, less-active stocks share physical servers with process-level isolation — only the top 500 or so get dedicated hardware. But the logical design is still "one engine per instrument."</td></tr>
          <tr><td><strong>Q: What happens to my order if the exchange has a circuit breaker halt? Is it safe?</strong></td><td>Yes. Your order stays in the order book exactly as it was — the engine pauses processing but doesn't flush or cancel anything. When the halt lifts, the engine resumes from the exact state it was in. Your order's position in the queue (its time priority) is preserved. You may actually <em>want</em> to cancel during a halt if you think prices will change — you have the full halt window to decide.</td></tr>
          <tr><td><strong>Q: Can I run my own matching engine at home and practice?</strong></td><td>Yes — a basic matching engine is surprisingly simple to write. The core is just two sorted data structures (a max-heap for bids, a min-heap for asks) and a loop that checks if the top of each side crosses. You can build one in ~200 lines of Python or Go. The complexity is in making it fast (ring buffer, cache pinning, CPU affinity) and safe (WAL, risk checks, duplicate detection) — not in the matching logic itself.</td></tr>
        </table>
      </div>
    ` }
  ]
};

// ── PAYMENT SYSTEM ────────────────────────────────────────
systems['payment'] = {
  name: 'Payment System', sub: 'Money movement',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Send money</strong> — transfer funds from one account to another</li>
        <li><strong>Receive money</strong> — accept incoming payments</li>
        <li><strong>Transaction history</strong> — view all past payments with status</li>
        <li><strong>Refunds</strong> — reverse a completed payment</li>
        <li><strong>Payment methods</strong> — credit card, bank transfer (ACH/NEFT), UPI, wallets</li>
        <li><strong>Currency conversion</strong> — cross-currency payments with exchange rate</li>
        <li><strong>Fraud detection</strong> — block suspicious transactions in real-time</li>
        <li><strong>Notifications</strong> — SMS/email on every transaction</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Exactly-once Processing</td><td>A payment must execute exactly once — no double charges, no missed payments</td></tr>
        <tr><td>Strong Consistency</td><td>Balance deducted from sender must = balance added to receiver, atomically</td></tr>
        <tr><td>High Availability</td><td>99.99% — payment downtime means lost revenue and broken trust</td></tr>
        <tr><td>Idempotency</td><td>Retrying a failed payment must not result in duplicate charges</td></tr>
        <tr><td>PCI-DSS Compliance</td><td>Card data must be encrypted, tokenized, never stored in plain text</td></tr>
        <tr><td>Auditability</td><td>Every state change in a transaction must be logged for regulators</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Payment system is <strong>CP</strong> for core transactions — consistency is non-negotiable. You can handle temporary unavailability (retry queues) but never incorrect money movement.</div>
      <table class="nfr-table">
        <tr><td><strong>Ledger / Balances</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Double-entry bookkeeping requires ACID transactions. Debit one account + credit another must be atomic. CP: never lose or duplicate money. PostgreSQL with serializable isolation.</td></tr>
        <tr><td><strong>Idempotency keys</strong><br><span style="color:#888;font-size:11px;">Redis or PostgreSQL (CP)</span></td><td>Key → transaction result mapping. Must be consistent — a retry must always return the same result. CP: check idempotency key before processing.</td></tr>
        <tr><td><strong>Transaction events</strong><br><span style="color:#888;font-size:11px;">Kafka (AP for delivery)</span></td><td>Payment events published to Kafka for downstream: notifications, fraud scoring, reconciliation. AP for delivery — Kafka guarantees at-least-once, consumers handle dedup.</td></tr>
        <tr><td><strong>Fraud signals</strong><br><span style="color:#888;font-size:11px;">Redis + ML model (AP)</span></td><td>Real-time fraud scoring from recent transaction patterns in Redis. AP — slightly stale signals are fine. Speed matters more than perfect freshness here.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#dc2626;">Idempotency Keys</div><div style="font-size:12px;color:#555;margin-top:4px;">Client generates a UUID for each payment attempt. Server stores: idempotency_key → result. If the same key arrives again (retry), return the stored result without re-executing. Prevents double charges on network failures.</div></div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Double-Entry Bookkeeping</div><div style="font-size:12px;color:#555;margin-top:4px;">Every payment creates two ledger entries: debit (sender) + credit (receiver). The sum of all ledger entries always = 0. Makes reconciliation trivial — any discrepancy is immediately detectable. Used by every bank since the 15th century.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Saga Pattern (Distributed Transactions)</div><div style="font-size:12px;color:#555;margin-top:4px;">A payment spans: validate → reserve funds → process with bank → confirm. Each step is a separate service. If bank processing fails, a compensating transaction releases the reserved funds. No two-phase commit needed.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Tokenisation (PCI-DSS)</div><div style="font-size:12px;color:#555;margin-top:4px;">Card numbers are never stored — immediately replaced with a token (random string). The token maps to the real card number only in a separate, heavily isolated vault. Your payment service stores only tokens.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Transactions / day</div>
          <div class="cap-calc-math">100K users × 10% make a payment today<br>(not everyone pays every day)</div>
          <div class="cap-calc-result">10K / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Avg transactions / sec</div>
          <div class="cap-calc-math">10K transactions/day ÷ 86,400 sec/day</div>
          <div class="cap-calc-result">~0.12 / sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Peak transactions / sec</div>
          <div class="cap-calc-math">Lunch hour, paydays, Black Friday: ~40× avg<br>0.12 × 40 = ~5/sec during peaks</div>
          <div class="cap-calc-result">~5 / sec peak</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Record size</div>
          <div class="cap-calc-math">tx_id + amount + currency + sender + receiver + status<br>+ timestamp + idempotency_key + metadata ≈ 1 KB</div>
          <div class="cap-calc-result">~1 KB</div>
        </div>
      </div>
      <div class="insight-box">
        Payment systems at this scale are <strong>not high-throughput — they're high-stakes</strong>. 0.12/sec is trivial for any database. The design challenge is correctness: idempotency (no double charges), double-entry bookkeeping (no money appears/disappears), and auditability. Stripe processes ~1M transactions/day globally — correctness, not throughput, is the hard problem.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">📱 Client App<div class="node-sub">Web / Mobile</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer + API Gateway<div class="node-sub">Auth · TLS · Rate limiting</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">💳 Payment Service<div class="node-sub">Orchestrates Saga</div></div>
          <div class="hld-node c-green">📒 Ledger Service<div class="node-sub">Double-entry writes</div></div>
          <div class="hld-node c-green">🔍 Fraud Service<div class="node-sub">ML scoring</div></div>
          <div class="hld-node c-green">🏦 Bank Connector<div class="node-sub">PSP / gateway calls</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row">
          <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">payment.events</div></div>
          <div style="width:16px"></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Idempotency keys · fraud signals</div></div>
        </div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Ledger · transactions</div></div>
          <div class="hld-node c-red">🔒 Card Vault<div class="node-sub">Token ↔ card mapping</div></div>
          <div class="hld-node c-red">🔔 Notification Svc<div class="node-sub">SMS / email</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Payment request → Fraud check → Bank PSP → Ledger update (user waits)</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Payment completed → Kafka → Notification Service → SMS/email</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Payment completed → Kafka → Reconciliation Service (end-of-day batch)</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">💰</span><span class="db-node-name">accounts</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">balance <span>DECIMAL(19,4)</span></div><div class="db-row">currency <span>VARCHAR(3) e.g. USD</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">💳</span><span class="db-node-name">transactions</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 from_account <span>FK → accounts</span></div><div class="db-row fk">🔗 to_account <span>FK → accounts</span></div><div class="db-row">amount <span>DECIMAL(19,4)</span></div><div class="db-row">status <span>ENUM (pending,completed,failed)</span></div><div class="db-row">idempotency_key <span>VARCHAR · UNIQUE</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📒</span><span class="db-node-name">ledger_entries</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>BIGINT · PK</span></div><div class="db-row fk">🔗 transaction_id <span>FK → transactions</span></div><div class="db-row fk">🔗 account_id <span>FK → accounts</span></div><div class="db-row">type <span>ENUM (debit, credit)</span></div><div class="db-row">amount <span>DECIMAL(19,4)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">🔑</span><span class="db-node-name">idempotency_keys</span></div><div class="db-node-body"><div class="db-row pk">🔑 key <span>VARCHAR · PK</span></div><div class="db-row fk">🔗 transaction_id <span>FK → transactions</span></div><div class="db-row">created_at <span>TIMESTAMP</span></div><div class="db-row">expires_at <span>TIMESTAMP (24h TTL)</span></div></div></div>
      </div>
      <div class="insight-box"><strong>Double-entry rule:</strong> For every transaction, there are always exactly 2 ledger_entries: one DEBIT (sender) and one CREDIT (receiver). SUM of all ledger entries = 0. This is how you detect any bugs or fraud.</div>` },
    { name: 'Deep Dive — Idempotency & Saga', content: `
      <div class="content-label">Idempotency in practice</div>
      <ul class="req-list">
        <li><strong>1.</strong> Client sends payment with idempotency_key: <code>"pay_abc123"</code></li>
        <li><strong>2.</strong> Server checks Redis: key not found → process payment → store result against key</li>
        <li><strong>3.</strong> Network timeout — client retries with same key <code>"pay_abc123"</code></li>
        <li><strong>4.</strong> Server finds key in Redis → returns stored result without re-processing → no double charge</li>
      </ul>
      <div class="content-label" style="margin-top:16px;">Saga for cross-system payments</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Step 1 — Validate &amp; Reserve</div><div style="font-size:12px;color:#555;margin-top:4px;">Check sender has funds → mark balance as "reserved" (not yet deducted). Status = pending.</div></div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Step 2 — Call Bank PSP</div><div style="font-size:12px;color:#555;margin-top:4px;">Send payment request to external bank. Await confirmation. If timeout → retry with idempotency key.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:10px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Step 3 — Commit Ledger</div><div style="font-size:12px;color:#555;margin-top:4px;">Bank confirms → write ledger entries (debit + credit) atomically → release reservation → status = completed.</div></div>
        <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px;"><div style="font-size:12px;font-weight:700;color:#dc2626;">Failure path — Compensating Transaction</div><div style="font-size:12px;color:#555;margin-top:4px;">Bank returns error → release reservation → status = failed → refund if already partially processed. Saga rolls back each completed step.</div></div>
      </div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🏦 External PSP latency</strong><br><span style="color:#888;">Bank/card network calls take 500ms–3s. User is waiting.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Show "Payment processing..." immediately. Use async Saga — reserve funds instantly, confirm in background. User gets a fast UX while bank processes.</span></li>
        <li><strong>🔄 Idempotency key storage</strong><br><span style="color:#888;">Redis is AP — key might be lost if Redis crashes before persistence.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Write idempotency key to PostgreSQL atomically with the transaction record. Redis is a fast-path cache; PostgreSQL is the source of truth.</span></li>
        <li><strong>📊 Reconciliation discrepancies</strong><br><span style="color:#888;">Bank's records and your ledger may diverge due to network failures.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Nightly reconciliation batch — compare your ledger against bank's statement. Flag any discrepancy &gt;$0.01 for manual review.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Sync vs Async payment</td><td>Sync: user waits for full bank confirmation (3s UX). Async: instant "pending" status, confirm in background (better UX, harder to handle failures).</td></tr>
        <tr><td>DECIMAL precision</td><td>Always use DECIMAL(19,4), never FLOAT for money. Float has rounding errors — $10.00 stored as 9.9999999 is a disaster.</td></tr>
      </table>` }
  ]
};

// ── TINDER ───────────────────────────────────────────────
systems['tinder'] = {
  name: 'Tinder', sub: 'Geo-based matching',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Profile setup</strong> — photos, bio, age, gender preferences</li>
        <li><strong>Discovery (card deck)</strong> — see profiles of nearby people matching your preferences</li>
        <li><strong>Swipe</strong> — swipe right (like) or left (pass) on profiles</li>
        <li><strong>Match</strong> — when two users both like each other → it's a match</li>
        <li><strong>Messaging</strong> — matched users can chat</li>
        <li><strong>Boosts &amp; Super Likes</strong> — premium features to increase visibility</li>
        <li><strong>Location update</strong> — update user's location for geo-based discovery</li>
        <li><strong>Notifications</strong> — new match, new message alerts</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Low Latency</td><td>Card deck loads instantly — swiping should feel fluid</td></tr>
        <tr><td>Geo Accuracy</td><td>Profiles shown must actually be within set distance</td></tr>
        <tr><td>Privacy</td><td>Never show exact location — only approximate distance</td></tr>
        <tr><td>High Availability</td><td>99.9% — users swipe at all hours globally</td></tr>
        <tr><td>Eventual Consistency</td><td>A match notification arriving 1–2 seconds late is fine</td></tr>
        <tr><td>Write Heavy (swipes)</td><td>Billions of swipes/day — swipe storage must be scalable</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Tinder is <strong>AP-dominant</strong>. Discovery and swipes can be eventually consistent. Only match creation benefits from strong consistency (avoid double-notifying).</div>
      <table class="nfr-table">
        <tr><td><strong>User profiles</strong><br><span style="color:#888;font-size:11px;">MongoDB / DynamoDB (AP)</span></td><td>Document model fits profiles naturally (variable fields, nested preferences). AP — showing a slightly stale profile is fine.</td></tr>
        <tr><td><strong>Geo index / Discovery</strong><br><span style="color:#888;font-size:11px;">Redis GEO (AP)</span></td><td>Redis GEOADD stores lat/lng per user. GEORADIUS fetches users within X km in O(N+log M). In-memory = microsecond geo queries. AP is fine for discovery.</td></tr>
        <tr><td><strong>Swipes</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Billions of swipe events appended daily. Cassandra is optimised for high-volume time-series writes. AP — swipe data consistency is not critical.</td></tr>
        <tr><td><strong>Matches</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>A match must be created exactly once — both users get notified. CP with a unique constraint on (user_a, user_b) pair prevents duplicate matches.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Geohashing (Spatial Indexing)</div><div style="font-size:12px;color:#555;margin-top:4px;">World divided into a grid. Each cell has a geohash string. Users in the same cell share a geohash prefix. Discovery queries users in nearby cells — much faster than computing distance to every user.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Pre-computed Card Deck</div><div style="font-size:12px;color:#555;margin-top:4px;">Don't compute recommendations at swipe time. A background job runs every few minutes, builds a card deck of 50 profiles for each user, stores it in Redis. Swipe just pops from the pre-built deck — instant response.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">ELO-like Desirability Score</div><div style="font-size:12px;color:#555;margin-top:4px;">Each profile has a hidden score (like chess ELO). Getting swiped right by high-score users increases your score. Score determines who sees your profile first. Prevents popular profiles from always appearing — spreads visibility fairly.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU (our scale) · Tinder real scale shown for context</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Swipes / day (our scale)</div>
          <div class="cap-calc-math">100K users × 50 swipes per session (typical usage)<br>= 5M swipes/day ÷ 86,400 = ~58/sec</div>
          <div class="cap-calc-result">~5M / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Swipes at Tinder scale</div>
          <div class="cap-calc-math">Tinder: ~65M DAU × ~15 swipes/user/day<br>≈ 1 billion swipes/day globally</div>
          <div class="cap-calc-result">~1B / day globally</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Per swipe record size</div>
          <div class="cap-calc-math">swiper_id (16B) + swiped_id (16B) + direction (1B) + timestamp (8B)<br>+ geo_hash (8B) ≈ 100 bytes</div>
          <div class="cap-calc-result">~100 bytes</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Daily swipe storage</div>
          <div class="cap-calc-math">1B swipes/day × 100 bytes = 100,000 MB = 100 GB/day<br>(only keep 30 days → ~3 TB rolling)</div>
          <div class="cap-calc-result">~100 GB / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Match rate</div>
          <div class="cap-calc-math">~1% of swipes are right-swipes, and mutual right = match<br>1B × 1% × 1% = 100K matches/day globally</div>
          <div class="cap-calc-result">~1% → match</div>
        </div>
      </div>
      <div class="insight-box">
        Cassandra is chosen for swipe storage — write-heavy, partition by user_id + date, no complex queries needed. Card deck for each user is <strong>pre-computed every 5 minutes</strong> by a background job, so the swipe action itself is just a fast write — no geo query at swipe time.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">📱 Mobile App<div class="node-sub">iOS / Android</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer + API Gateway</div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">👤 Profile Service<div class="node-sub">CRUD profiles</div></div>
          <div class="hld-node c-green">🔍 Discovery Service<div class="node-sub">Card deck</div></div>
          <div class="hld-node c-green">👆 Swipe Service<div class="node-sub">Like / pass</div></div>
          <div class="hld-node c-green">💕 Match Service<div class="node-sub">Create matches</div></div>
          <div class="hld-node c-green">💬 Chat Service<div class="node-sub">Messaging</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row">
          <div class="hld-node c-purple">⚡ Redis GEO<div class="node-sub">User locations + card decks</div></div>
          <div style="width:16px"></div>
          <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">swipe.events → match check</div></div>
        </div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ Cassandra<div class="node-sub">Swipe history</div></div>
          <div class="hld-node c-red">🐘 PostgreSQL<div class="node-sub">Matches</div></div>
          <div class="hld-node c-red">🍃 MongoDB<div class="node-sub">Profiles</div></div>
          <div class="hld-node c-red">🪣 S3 + CDN<div class="node-sub">Profile photos</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Load card deck → Redis pre-built list → instant</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Right swipe → Kafka → Match Service checks if other user also liked → if yes → create match + notify both</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">👤</span><span class="db-node-name">profiles</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id <span>UUID · PK</span></div><div class="db-row">name, age <span>VARCHAR, INT</span></div><div class="db-row">bio <span>TEXT</span></div><div class="db-row">photos <span>JSON array of S3 URLs</span></div><div class="db-row">gender_pref <span>ENUM</span></div><div class="db-row">elo_score <span>INT (hidden)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">👆</span><span class="db-node-name">swipes</span></div><div class="db-node-body"><div class="db-row pk">🔑 swiper_id <span>FK → profiles</span></div><div class="db-row pk">🔑 swiped_id <span>FK → profiles</span></div><div class="db-row">direction <span>ENUM (like, pass)</span></div><div class="db-row">created_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">💕</span><span class="db-node-name">matches</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_a_id <span>FK → profiles</span></div><div class="db-row fk">🔗 user_b_id <span>FK → profiles</span></div><div class="db-row">matched_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">💬</span><span class="db-node-name">messages</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 match_id <span>FK → matches</span></div><div class="db-row fk">🔗 sender_id <span>FK → profiles</span></div><div class="db-row">body <span>TEXT</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Discovery & Matching', content: `
      <div class="content-label">How card deck is built</div>
      <ul class="req-list">
        <li><strong>1. Location filter</strong> — GEORADIUS on Redis GEO index → user IDs within X km</li>
        <li><strong>2. Preference filter</strong> — filter by age range, gender — fetched from profile cache</li>
        <li><strong>3. Already-seen filter</strong> — remove user IDs in this user's swipe history (Cassandra lookup or Bloom filter)</li>
        <li><strong>4. Rank by ELO</strong> — sort remaining candidates by desirability score</li>
        <li><strong>5. Cache deck</strong> — store top 50 in Redis list with key <code>deck:{user_id}</code></li>
        <li><strong>6. Swipe</strong> — pop from Redis list, no computation needed at swipe time</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>Bloom filter for seen users:</strong> Storing every swipe in a lookup for billions of users is expensive. A Bloom filter per user (space-efficient probabilistic set) tells you "definitely not seen" or "probably seen." Occasional false positive = showing a seen profile again → harmless.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🌆 City hotspots (NYC, Mumbai)</strong><br><span style="color:#888;">Millions of active users in one geo cell = massive GEORADIUS results to filter.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Use smaller geohash cells in dense cities. Pre-filter by finer preferences before geo expansion.</span></li>
        <li><strong>😴 Rural cold start</strong><br><span style="color:#888;">User in a village — only 3 profiles within 10km, all already swiped.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Expand radius progressively (10km → 50km → 100km). Show "Expand your distance?" prompt.</span></li>
        <li><strong>⭐ Popular profile storm</strong><br><span style="color:#888;">A celebrity joins Tinder — millions of right swipes in minutes. Match Service overwhelmed.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Rate-limit match checks per user. Cap how many active right-swipes a profile has in queue at once.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Pre-compute vs on-demand deck</td><td>Pre-compute: fast swipe UX, slightly stale deck. On-demand: always fresh, 200ms+ latency per swipe. Pre-compute wins for UX.</td></tr>
        <tr><td>ELO vs simple ranking</td><td>ELO: fair, distributes visibility. But gameable if users swipe right on everyone. Tinder uses a proprietary desirability model now.</td></tr>
      </table>` }
  ]
};

// ── AMAZON LAMBDA ─────────────────────────────────────────
systems['lambda'] = {
  name: 'Amazon Lambda', sub: 'Serverless compute',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Deploy function</strong> — upload code (zip/container), set runtime (Node, Python, Java...)</li>
        <li><strong>Invoke function</strong> — trigger via API Gateway, S3 event, SQS, schedule, etc.</li>
        <li><strong>Auto-scale</strong> — spin up as many instances as needed automatically</li>
        <li><strong>Execution isolation</strong> — each invocation runs in its own sandbox</li>
        <li><strong>Billing per execution</strong> — charge based on invocations × duration × memory</li>
        <li><strong>Logs &amp; monitoring</strong> — stream execution logs to CloudWatch</li>
        <li><strong>Versioning &amp; aliases</strong> — deploy new version without affecting production</li>
        <li><strong>Concurrency limits</strong> — set max concurrent executions per function</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Low Cold Start</td><td>&lt;100ms cold start latency — longer is noticeable to users</td></tr>
        <tr><td>Strong Isolation</td><td>One customer's function must never affect another's — security boundary</td></tr>
        <tr><td>High Availability</td><td>99.99% — Lambda is foundational infrastructure</td></tr>
        <tr><td>Scale to Zero</td><td>No invocations = no cost — must spin down completely</td></tr>
        <tr><td>Horizontal Scale</td><td>From 0 to thousands of concurrent executions in seconds</td></tr>
        <tr><td>Stateless</td><td>Each invocation gets a clean environment — no shared state between calls</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Lambda itself doesn't have a persistent DB — it's stateless compute. The infrastructure managing Lambda's metadata needs to be CP (function configs must be consistent) while execution is AP (fast, available).</div>
      <table class="nfr-table">
        <tr><td><strong>Function metadata / config</strong><br><span style="color:#888;font-size:11px;">DynamoDB (CP for critical, AP for rest)</span></td><td>Function name → code location, runtime, memory, timeout. Must be consistent — wrong config = wrong function executed. Strongly consistent reads for invocations.</td></tr>
        <tr><td><strong>Worker pool state</strong><br><span style="color:#888;font-size:11px;">In-memory + Redis (AP)</span></td><td>Which workers are warm, which are free. AP — slightly stale is fine; worst case a warm worker is double-assigned (handled by local check).</td></tr>
        <tr><td><strong>Function code</strong><br><span style="color:#888;font-size:11px;">S3 (AP)</span></td><td>Code zip/container stored in S3. Immutable objects — once uploaded, never changed. AP fine; code is fetched once on cold start and cached.</td></tr>
        <tr><td><strong>Execution logs</strong><br><span style="color:#888;font-size:11px;">CloudWatch / Kinesis (AP)</span></td><td>Log stream per function. AP — logs can be slightly delayed. High-throughput append-only write pattern.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">MicroVM Isolation (Firecracker)</div><div style="font-size:12px;color:#555;margin-top:4px;">Each function runs in a Firecracker microVM — a lightweight VM that boots in &lt;125ms, has its own kernel, provides hardware-level isolation between tenants. Much faster than full VMs, safer than containers.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Warm Pool (Cold Start Mitigation)</div><div style="font-size:12px;color:#555;margin-top:4px;">Pre-warm N execution environments for popular functions. When invocation arrives, assign from warm pool instantly (no cold start). After execution completes, keep the environment warm for ~15 minutes — if another invocation arrives, reuse it.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Execution Environment Reuse</div><div style="font-size:12px;color:#555;margin-top:4px;">Warm execution environment: container/microVM already loaded with your code + runtime. Second invocation on the same environment skips initialization → warm start (~1ms vs cold start ~100ms). This is why Lambda warns against mutable global state.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Lambda is infrastructure — no single DAU figure applies</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Cold start time</div>
          <div class="cap-calc-math">Firecracker microVM boot: ~125ms (vs Docker: ~500ms, VM: ~1–2s)<br>Key innovation: lightweight KVM virtualization, minimal kernel</div>
          <div class="cap-calc-result">&lt; 125ms</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Warm invocation overhead</div>
          <div class="cap-calc-math">Existing execution environment reused (no boot)<br>Container already loaded, code already in memory</div>
          <div class="cap-calc-result">~1ms overhead</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Concurrency per function</div>
          <div class="cap-calc-math">Default limit = 1,000 concurrent executions per function<br>Each invocation gets its own isolated microVM — no sharing</div>
          <div class="cap-calc-result">1,000 concurrent</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Max execution time</div>
          <div class="cap-calc-math">15 min hard cap per invocation<br>Forces stateless design — no long-running processes</div>
          <div class="cap-calc-result">15 min max</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">AWS Lambda at scale</div>
          <div class="cap-calc-math">Trillions of invocations per month globally<br>Millions of different customer functions on shared hardware</div>
          <div class="cap-calc-result">Trillions / month</div>
        </div>
      </div>
      <div class="insight-box">
        The scale challenge isn't per-function throughput — it's <strong>multiplexing millions of different customer functions on shared hardware</strong> safely. Each function must be isolated (no cross-tenant data access), yet sharing a physical host is required for cost efficiency. Firecracker solves this with hardware-level isolation at near-container speed.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Triggers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">🌐 API Gateway</div>
          <div class="hld-node c-blue">🪣 S3 Event</div>
          <div class="hld-node c-blue">📨 SQS / SNS</div>
          <div class="hld-node c-blue">⏰ EventBridge</div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">🚪 Lambda Invoke API<div class="node-sub">Auth · throttle · route</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-teal">🎛️ Assignment Service<div class="node-sub">Finds warm or cold worker</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">♨️ Warm Worker Pool<div class="node-sub">Pre-initialised envs</div></div>
          <div class="hld-node c-orange">❄️ Cold Start Worker<div class="node-sub">Boot Firecracker microVM</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-red">⚡ Firecracker microVM<div class="node-sub">Isolated execution · your code runs here</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-purple">📊 CloudWatch Logs</div>
          <div class="hld-node c-purple">📈 Metrics</div>
          <div class="hld-node c-red">🗄️ DynamoDB<div class="node-sub">Function config</div></div>
        </div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>The cold start path:</strong> No warm worker → Assignment Service creates new Firecracker microVM → downloads code from S3 → initialises runtime → runs your init code → invokes handler. All in &lt;1 second for small functions.</div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">⚡</span><span class="db-node-name">functions</span></div><div class="db-node-body"><div class="db-row pk">🔑 function_arn <span>VARCHAR · PK</span></div><div class="db-row fk">🔗 account_id <span>FK → accounts</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">runtime <span>ENUM (nodejs, python...)</span></div><div class="db-row">memory_mb <span>INT</span></div><div class="db-row">timeout_sec <span>INT</span></div><div class="db-row">code_s3_key <span>VARCHAR</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🏷️</span><span class="db-node-name">versions</span></div><div class="db-node-body"><div class="db-row pk">🔑 function_arn + version <span>Composite PK</span></div><div class="db-row">code_sha256 <span>VARCHAR (integrity)</span></div><div class="db-row">published_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📋</span><span class="db-node-name">invocations</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 function_arn <span>FK → functions</span></div><div class="db-row">start_time <span>TIMESTAMP</span></div><div class="db-row">duration_ms <span>INT</span></div><div class="db-row">billed_duration_ms <span>INT (rounded up to 1ms)</span></div><div class="db-row">status <span>ENUM (success, error, timeout)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">🔀</span><span class="db-node-name">aliases</span></div><div class="db-node-body"><div class="db-row pk">🔑 function_arn + alias <span>Composite PK</span></div><div class="db-row">version <span>VARCHAR (e.g. "3")</span></div><div class="db-row">description <span>VARCHAR</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Cold Start', content: `
      <div class="content-label">Cold vs Warm start breakdown</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#dc2626;">Cold Start (~100–1000ms)</div><div style="font-size:12px;color:#555;margin-top:4px;">1. Boot Firecracker microVM (~125ms)<br>2. Download code from S3 (~50–500ms depending on size)<br>3. Start runtime (Node/Python/JVM)<br>4. Run your <code>init</code> code (DB connections, imports)<br>5. Invoke handler<br><br>JVM (Java) has the worst cold start (~1–3s) because JVM startup is slow. Node.js is fastest (~50ms).</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Warm Start (~1ms)</div><div style="font-size:12px;color:#555;margin-top:4px;">MicroVM already running, code loaded, runtime initialised. Lambda just calls your handler function. This is why you should put DB connections outside your handler — they persist across warm invocations.</div></div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Mitigation Strategies</div><div style="font-size:12px;color:#555;margin-top:4px;">Provisioned Concurrency: pre-warm N environments always on (costs money but zero cold starts). SnapStart (Java): snapshot initialised JVM state, restore instead of re-init (reduces cold start 10x). Keep functions small and dependencies minimal.</div></div>
      </div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>❄️ Cold start latency</strong><br><span style="color:#888;">First invocation after idle period always cold — bad for latency-sensitive APIs.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Provisioned Concurrency (costly), scheduled ping to keep warm (hacky), or accept cold starts for non-latency-critical code.</span></li>
        <li><strong>📦 Concurrency limits</strong><br><span style="color:#888;">Default 1000 concurrent executions per account per region. Spike in traffic → throttling.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Request limit increase. Use reserved concurrency per function to protect critical functions from others consuming all capacity.</span></li>
        <li><strong>🔌 VPC cold start penalty</strong><br><span style="color:#888;">Lambda in a VPC needs to attach a network interface — adds 10+ seconds to cold start.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Lambda now reuses Hyperplane ENIs (improved VPC cold starts to ~1s). Avoid VPC unless you need to access private RDS/ElastiCache.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Lambda vs Containers</td><td>Lambda: zero infra management, scale to zero, cold start. Containers: consistent latency, always warm, higher cost baseline. Lambda wins for bursty/infrequent workloads.</td></tr>
        <tr><td>Stateless constraint</td><td>No shared memory between invocations. Forces clean architecture — all state in DB/cache. Makes testing and debugging easier but requires external state stores.</td></tr>
      </table>` }
  ]
};

// ── LLMs / ChatGPT ────────────────────────────────────────
systems['chatgpt'] = {
  name: 'LLMs / ChatGPT', sub: 'AI inference at scale',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Chat interface</strong> — user sends a message, gets a streamed response</li>
        <li><strong>Context window</strong> — remember the conversation history within a session</li>
        <li><strong>Streaming response</strong> — tokens appear as they're generated (not all at once)</li>
        <li><strong>Multiple models</strong> — GPT-4, GPT-3.5, etc. — route to appropriate model</li>
        <li><strong>System prompts</strong> — operators configure model behaviour via system instructions</li>
        <li><strong>Rate limiting</strong> — limit tokens/minute per user/API key</li>
        <li><strong>Conversation history</strong> — save and resume past conversations</li>
        <li><strong>Tool calling</strong> — model can call external functions/APIs</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Low TTFT</td><td>Time To First Token &lt;500ms — user should see response starting quickly</td></tr>
        <tr><td>Streaming</td><td>Tokens must stream continuously — no long pause then dump of text</td></tr>
        <tr><td>High Availability</td><td>99.9% — API being down breaks millions of dependent apps</td></tr>
        <tr><td>GPU Efficiency</td><td>GPUs are expensive — maximise utilisation through batching</td></tr>
        <tr><td>Context Length</td><td>Handle 128K+ token contexts efficiently</td></tr>
        <tr><td>Scalability</td><td>Handle millions of concurrent conversations</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">The inference pipeline is stateless per token — no DB involved. The surrounding infrastructure (conversations, billing, auth) follows standard CP/AP splits.</div>
      <table class="nfr-table">
        <tr><td><strong>Conversation history</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Messages must be stored consistently — if you refresh the page, history must be there. CP.</td></tr>
        <tr><td><strong>Session / KV cache state</strong><br><span style="color:#888;font-size:11px;">GPU HBM memory (CP per request)</span></td><td>KV cache (attention keys/values) lives on GPU VRAM during generation. Strongly consistent within one request — no DB involved, pure compute.</td></tr>
        <tr><td><strong>Rate limiting counters</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>Token usage counters per API key. AP — slightly stale count is fine. Redis atomic INCR for fast rate limit checks.</td></tr>
        <tr><td><strong>Model weights</strong><br><span style="color:#888;font-size:11px;">S3 → GPU VRAM (immutable)</span></td><td>Model weights are immutable large files. Loaded from S3 once on GPU server startup, kept in VRAM. Not a traditional DB — object storage for distribution.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Request Batching (GPU Efficiency)</div><div style="font-size:12px;color:#555;margin-top:4px;">GPUs are most efficient when processing multiple requests in parallel. Continuous batching: as soon as one request in a batch finishes, add a new request into that slot. Maximises GPU utilisation (A100 can process 100+ requests in one forward pass).</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">KV Cache (Attention Optimisation)</div><div style="font-size:12px;color:#555;margin-top:4px;">In a transformer, attention scores for all previous tokens are recomputed at every step. KV Cache stores the key/value matrices for all previous tokens — reuses them for the next token. Reduces computation from O(n²) to O(n) per step.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Server-Sent Events (Streaming)</div><div style="font-size:12px;color:#555;margin-top:4px;">Each generated token is pushed to the client immediately via SSE (or WebSocket). Client renders tokens as they arrive. This is why responses "type out" — not a UX trick, it's the actual generation sequence. TTFT matters more than total latency.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Model Routing</div><div style="font-size:12px;color:#555;margin-top:4px;">Different models on different GPU clusters. A router directs: simple questions → GPT-3.5 (cheap, fast). Complex tasks → GPT-4 (expensive, slow). Users and operators can specify model preference. Cost-optimised routing is a significant revenue lever.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">GPU compute is the bottleneck — not servers or bandwidth</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Generation speed</div>
          <div class="cap-calc-math">1 A100 GPU running GPT-3.5 generates ~20 tokens/sec per request<br>(each token ≈ 0.75 words — "hello world" ≈ 3 tokens)</div>
          <div class="cap-calc-result">~20 tokens/sec/GPU</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Avg conversation size</div>
          <div class="cap-calc-math">~500 tokens input (your prompt + history)<br>+ ~500 tokens output = ~1,000 tokens total ≈ 4 KB</div>
          <div class="cap-calc-result">~4 KB / conversation</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Time to generate response</div>
          <div class="cap-calc-math">500 output tokens ÷ 20 tokens/sec = 25 sec without KV Cache<br>With continuous batching + KV cache: much faster for common prefixes</div>
          <div class="cap-calc-result">~5–25 sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Concurrent requests/GPU</div>
          <div class="cap-calc-math">Continuous batching lets 1 GPU serve ~100 streaming users<br>(while one token generates, others wait — shared GPU time)</div>
          <div class="cap-calc-result">~100 concurrent</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Cost per 1K tokens</div>
          <div class="cap-calc-math">A100 GPU ~$3/hr, 20 tok/sec = 72K tok/hr per GPU<br>$3 ÷ 72K × 1000 ≈ $0.042 raw; optimised → ~$0.002</div>
          <div class="cap-calc-result">~$0.002 / 1K tokens</div>
        </div>
      </div>
      <div class="insight-box">
        Scaling = buying more GPUs. There's no clever software trick that replaces compute. GPT-4 is ~8× more compute than GPT-3.5 per token — same architecture, much bigger model. OpenAI reportedly runs thousands of A100s. KV Cache is the key optimisation: reuse computed key-value pairs across the context instead of recomputing from scratch each token.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">🌐 ChatGPT Web</div>
          <div class="hld-node c-blue">📱 Mobile App</div>
          <div class="hld-node c-blue">🔌 API (developers)</div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">🚪 API Gateway<div class="node-sub">Auth · rate limit · model routing</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">💬 Chat Service<div class="node-sub">Context assembly</div></div>
          <div class="hld-node c-green">🔧 Tool Service<div class="node-sub">Function calling</div></div>
        </div></div>
        <div class="hld-arrow">↓ prompt + history</div>
        <div class="hld-row"><div class="hld-node c-red" style="border-color:#fca5a5;background:#fff1f2;">🧠 Inference Cluster<div class="node-sub">GPU servers · continuous batching · KV cache</div></div></div>
        <div class="hld-arrow">↓ token stream (SSE)</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Conversation history</div></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">Rate limit counters</div></div>
          <div class="hld-node c-yellow">📊 Usage Service<div class="node-sub">Billing counters</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> User sends message → Context assembled → Inference → tokens stream back via SSE</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Conversation saved to PostgreSQL after completion</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Token usage counted → Kafka → Billing service</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">💬</span><span class="db-node-name">conversations</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">title <span>VARCHAR (auto-generated)</span></div><div class="db-row">model <span>VARCHAR (gpt-4, gpt-3.5...)</span></div><div class="db-row">created_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🗨️</span><span class="db-node-name">messages</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 conversation_id <span>FK → conversations</span></div><div class="db-row">role <span>ENUM (user, assistant, system)</span></div><div class="db-row">content <span>TEXT</span></div><div class="db-row">token_count <span>INT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🔑</span><span class="db-node-name">api_keys</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">key_hash <span>VARCHAR (never store plain)</span></div><div class="db-row">tokens_per_min_limit <span>INT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">📊</span><span class="db-node-name">usage</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 api_key_id <span>FK → api_keys</span></div><div class="db-row">prompt_tokens <span>INT</span></div><div class="db-row">completion_tokens <span>INT</span></div><div class="db-row">model <span>VARCHAR</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Transformer Inference', content: `
      <div class="content-label">How a response is generated</div>
      <ul class="req-list">
        <li><strong>1. Tokenise</strong> — "Hello world" → [15496, 995] (token IDs). Tokens ≠ words (subword units, ~4 chars/token avg).</li>
        <li><strong>2. Embed</strong> — each token ID → 4096-dimensional vector (model's vocabulary lookup)</li>
        <li><strong>3. Transformer layers</strong> — 96 layers of attention + feedforward. Each layer attends to all previous tokens (via KV cache), produces next representation.</li>
        <li><strong>4. Predict next token</strong> — final layer outputs probability distribution over 50K vocab. Sample from distribution (temperature controls randomness).</li>
        <li><strong>5. Append + repeat</strong> — append predicted token to context, run forward pass again for next token. Repeat until EOS token or max length.</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>Why GPU?</strong> Step 3 is massively parallel matrix multiplications. A single forward pass through GPT-4 requires ~trillions of floating-point operations. A100 GPU does 312 TFLOPS. CPU would take minutes; GPU takes milliseconds.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>💰 GPU cost</strong><br><span style="color:#888;">A100 GPU costs $2–3/hour. GPT-4 requires 8 GPUs for model parallelism. At scale, GPU cost dominates OpEx.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Quantisation (reduce model precision from FP32 → INT8 → 4-bit), model distillation (smaller models that match GPT-4 quality), speculative decoding (use small model to draft, large model to verify).</span></li>
        <li><strong>🧠 Context window memory</strong><br><span style="color:#888;">128K token context = massive KV cache. Each token in a GPT-4 context needs ~MB of GPU memory for its K/V matrices.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: PagedAttention (vLLM) — manage KV cache like OS virtual memory. Pages are non-contiguous in VRAM, enabling more concurrent requests on the same GPU.</span></li>
        <li><strong>⏱️ TTFT for long prompts</strong><br><span style="color:#888;">Sending a 50-page document as context → prefill takes 3–5 seconds before first token.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Prompt caching — if the system prompt is the same across requests (common for API operators), cache its KV representation. Skip recomputing it for every request.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Streaming vs batch response</td><td>Streaming: better perceived UX, TTFT matters most. Batch: simpler client, must wait for full completion. All production LLM APIs stream.</td></tr>
        <tr><td>Model size vs speed</td><td>GPT-4 (1.8T params): most capable, slowest, expensive. GPT-3.5 (175B): fast, cheap, less capable. Haiku/Gemini Flash: optimised for speed and cost.</td></tr>
      </table>` }
  ]
};

// ── UBER ──────────────────────────────────────────────────
systems['uber'] = {
  name: 'Uber', sub: 'Nearby driver matching',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Request ride</strong> — rider sets pickup and destination</li>
        <li><strong>Find nearby drivers</strong> — show drivers within radius on map</li>
        <li><strong>Match driver</strong> — assign nearest available driver</li>
        <li><strong>Real-time tracking</strong> — rider tracks driver's location live</li>
        <li><strong>ETA calculation</strong> — show accurate arrival time</li>
        <li><strong>Surge pricing</strong> — increase price when demand &gt; supply</li>
        <li><strong>Payment</strong> — charge rider automatically after trip</li>
        <li><strong>Rating</strong> — rider and driver rate each other after trip</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Real-time Location</td><td>Driver location updates every 4 seconds — map must feel live</td></tr>
        <tr><td>Low Matching Latency</td><td>Ride matched within 5 seconds of request</td></tr>
        <tr><td>High Availability</td><td>99.99% — Uber down = stranded riders</td></tr>
        <tr><td>Geo Accuracy</td><td>Driver assigned must actually be nearby — wrong match wastes time</td></tr>
        <tr><td>Scalability</td><td>Handle peak demand (Saturday night, big events)</td></tr>
        <tr><td>Eventual Consistency</td><td>Surge pricing can lag by ~30 seconds — acceptable</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Uber is <strong>AP for location and discovery</strong>, <strong>CP for trip state and payments</strong>. A slightly stale driver position is fine. A trip record that loses money is not.</div>
      <table class="nfr-table">
        <tr><td><strong>Driver locations</strong><br><span style="color:#888;font-size:11px;">Redis GEO (AP)</span></td><td>Updated every 4s per driver. In-memory GEORADIUS queries in &lt;1ms. AP — 4-second stale position is by design. Redis clusters handle millions of location updates/sec.</td></tr>
        <tr><td><strong>Trips / Bookings</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Trip state (requested → accepted → started → completed) must be strongly consistent. Payment is tied to trip record. CP — no ambiguity about whether a trip happened.</td></tr>
        <tr><td><strong>Ride history</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Append-only time-series of all rides per user. Read: "show my last 20 rides." Cassandra partitioned by user_id, sorted by time. AP fine — history doesn't need to be real-time.</td></tr>
        <tr><td><strong>Surge pricing</strong><br><span style="color:#888;font-size:11px;">Redis + in-memory (AP)</span></td><td>Count of active ride requests vs available drivers per geohash cell. AP — 30-second lag in surge calculation is acceptable. Fast reads for every price quote.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Geohash Grid (Spatial Indexing)</div><div style="font-size:12px;color:#555;margin-top:4px;">City divided into geohash cells (e.g. 1km × 1km). Each driver's location maps to a geohash. Finding nearby drivers = query drivers in current cell + adjacent 8 cells. Much faster than computing Haversine distance to all drivers.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">WebSocket for Real-time Push</div><div style="font-size:12px;color:#555;margin-top:4px;">Driver app maintains WebSocket to location server — sends GPS update every 4 seconds. Rider app maintains WebSocket — receives driver location updates every 4 seconds. Server bridges the two. No polling = no wasted requests.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Supply-Demand Surge Algorithm</div><div style="font-size:12px;color:#555;margin-top:4px;">Per geohash cell: count ride_requests / available_drivers. Ratio &gt; threshold → surge multiplier (1.2x, 1.5x, 2x...). Recalculated every 30 seconds. High surge → more drivers move to the cell → surge reduces. Self-balancing market mechanism.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU (riders + drivers)</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Active drivers at peak</div>
          <div class="cap-calc-math">100K DAU, assume 50% are drivers, ~100% online at evening peak<br>(drivers stay online for their shift)</div>
          <div class="cap-calc-result">~50K active drivers</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Location updates / sec</div>
          <div class="cap-calc-math">Each driver app pings GPS every 4 seconds<br>50K drivers ÷ 4 sec = 12,500 updates/sec</div>
          <div class="cap-calc-result">~12.5K / sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Location payload size</div>
          <div class="cap-calc-math">driver_id (16B) + lat (8B) + lng (8B) + timestamp (8B)<br>+ heading (4B) + speed (4B) ≈ ~100 bytes</div>
          <div class="cap-calc-result">~100 bytes</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Total location bandwidth</div>
          <div class="cap-calc-math">12.5K updates/sec × 100 bytes = 1,250,000 bytes/sec<br>= 1.25 MB/sec flowing into Redis GEO</div>
          <div class="cap-calc-result">~1.25 MB/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Rider request rate</div>
          <div class="cap-calc-math">50K riders × 1 trip per 2 hours = 25K trips/2hr<br>= ~3.5 ride requests/sec to dispatch service</div>
          <div class="cap-calc-result">~3.5 req/sec</div>
        </div>
      </div>
      <div class="insight-box">
        Location updates are the dominant write workload — 12.5K/sec. Redis GEO handles this easily (GEOADD is O(log N)). The hard problem is <strong>dispatch matching</strong>: for each ride request, find all drivers within radius X, rank by ETA, and assign — all in under 1 second while drivers are continuously moving.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Clients</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">📱 Rider App</div>
          <div class="hld-node c-blue">🚗 Driver App</div>
        </div></div>
        <div class="hld-arrow">↓ WebSocket</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer + API Gateway</div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">📍 Location Service<div class="node-sub">Driver GPS updates</div></div>
          <div class="hld-node c-green">🚗 Dispatch Service<div class="node-sub">Match rider to driver</div></div>
          <div class="hld-node c-green">🗺️ Maps / ETA Service<div class="node-sub">Routing, arrival time</div></div>
          <div class="hld-node c-green">💹 Pricing Service<div class="node-sub">Surge calculation</div></div>
          <div class="hld-node c-green">💳 Payment Service<div class="node-sub">Post-trip charge</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row">
          <div class="hld-node c-purple">⚡ Redis GEO<div class="node-sub">Driver locations</div></div>
          <div style="width:16px"></div>
          <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Location + trip events</div></div>
        </div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ PostgreSQL<div class="node-sub">Trips · users</div></div>
          <div class="hld-node c-red">🗂️ Cassandra<div class="node-sub">Ride history</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Rider requests ride → Dispatch queries Redis GEO → finds drivers → sends offer to nearest driver</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Driver GPS update → Location Service → GEOADD to Redis → Kafka (for analytics, surge calc)</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">👤</span><span class="db-node-name">drivers</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">vehicle_info <span>JSON</span></div><div class="db-row">status <span>ENUM (offline, online, on_trip)</span></div><div class="db-row">rating <span>DECIMAL</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🚗</span><span class="db-node-name">trips</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 rider_id <span>FK → users</span></div><div class="db-row fk">🔗 driver_id <span>FK → drivers</span></div><div class="db-row">pickup_lat/lng <span>FLOAT</span></div><div class="db-row">dropoff_lat/lng <span>FLOAT</span></div><div class="db-row">status <span>ENUM (requested…completed)</span></div><div class="db-row">fare <span>DECIMAL</span></div><div class="db-row">surge_multiplier <span>DECIMAL</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📍</span><span class="db-node-name">location_history</span></div><div class="db-node-body"><div class="db-row pk">🔑 driver_id + ts <span>Composite PK</span></div><div class="db-row">lat, lng <span>FLOAT</span></div><div class="db-row">speed <span>FLOAT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">⭐</span><span class="db-node-name">ratings</span></div><div class="db-node-body"><div class="db-row pk">🔑 trip_id <span>FK → trips · PK</span></div><div class="db-row">rider_rating <span>INT (1–5)</span></div><div class="db-row">driver_rating <span>INT (1–5)</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Driver Matching', content: `
      <div class="content-label">How dispatch works</div>
      <ul class="req-list">
        <li><strong>1. Rider requests</strong> — pickup at lat/lng, destination set</li>
        <li><strong>2. Geohash lookup</strong> — compute geohash for pickup. Query Redis GEORADIUS for drivers within 2km in status=online</li>
        <li><strong>3. Score candidates</strong> — rank by ETA (not raw distance — a driver 500m away in traffic might be slower than one 1km away on a clear road)</li>
        <li><strong>4. Offer to nearest</strong> — send push notification to top driver. Wait 10 seconds for accept</li>
        <li><strong>5. Fallback</strong> — if driver doesn't accept, offer to next candidate. Expand radius if needed.</li>
        <li><strong>6. Trip created</strong> — write to PostgreSQL with status=accepted</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>Why not just pick the physically closest driver?</strong> Traffic, one-way streets, and driver orientation matter. A driver 800m away facing the wrong way on a one-way street has a worse ETA than one 1.2km away. Uber runs routing queries to compute actual ETA for top candidates.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🎭 Event hotspot (concert ends)</strong><br><span style="color:#888;">50K people leave a venue simultaneously. Demand spikes 100x in one geohash cell.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Surge pricing to attract more drivers. Pre-position drivers near known events. Redis handles the geo query load — single cell query is still O(log N).</span></li>
        <li><strong>🔌 Driver WebSocket scale</strong><br><span style="color:#888;">1M active drivers worldwide × 1 WebSocket = 1M open connections.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Dedicated location server fleet (just GPS updates, nothing else). Each server handles ~50K connections. Consistent hashing assigns driver to server — location server writes to Redis, Kafka.</span></li>
        <li><strong>⏱️ ETA accuracy</strong><br><span style="color:#888;">ETA shown at request time vs actual arrival often diverges (traffic changes).</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Continuous ETA recalculation as driver moves. ML model trained on historical trip data for that route/time/day. Not just Google Maps API — Uber has proprietary routing.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Redis vs PostGIS for geo</td><td>Redis: in-memory, microseconds, simpler. PostGIS: SQL, precise, slower. For real-time 4s updates, Redis wins. PostGIS for historical analytics.</td></tr>
        <tr><td>Push vs poll for driver location</td><td>Driver pushes every 4s (WebSocket) — server always has fresh state. Rider polls every 4s (or WebSocket push) — flexible. Push wins for mobile battery.</td></tr>
      </table>` }
  ]
};

// ── APACHE KAFKA ──────────────────────────────────────────
systems['kafka'] = {
  name: 'Apache Kafka', sub: 'Event streaming platform',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Publish messages</strong> — producers write messages to named topics</li>
        <li><strong>Subscribe &amp; consume</strong> — consumers read messages from topics in order</li>
        <li><strong>Consumer groups</strong> — multiple consumers share the work of processing a topic</li>
        <li><strong>Replay</strong> — consumers can re-read old messages from any offset</li>
        <li><strong>Partitioning</strong> — topics split into partitions for parallel processing</li>
        <li><strong>Replication</strong> — each partition copied to N brokers for fault tolerance</li>
        <li><strong>Retention</strong> — keep messages for a configurable duration (7 days default)</li>
        <li><strong>Exactly-once delivery</strong> — optional transactional producers for financial use cases</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>High Throughput</td><td>Millions of messages/sec — Kafka is built for I/O throughput above all</td></tr>
        <tr><td>Low Latency</td><td>&lt;10ms end-to-end in typical deployment</td></tr>
        <tr><td>Durability</td><td>Messages written to disk — survive broker restarts</td></tr>
        <tr><td>Fault Tolerance</td><td>A broker can die without message loss — replication protects data</td></tr>
        <tr><td>Scalability</td><td>Scale by adding partitions and brokers — no downtime</td></tr>
        <tr><td>Ordering</td><td>Messages within a partition are strictly ordered</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">Kafka itself IS the storage layer — it doesn't use a separate DB. Its design choices map to CAP as follows.</div>
      <table class="nfr-table">
        <tr><td><strong>Message log</strong><br><span style="color:#888;font-size:11px;">Append-only log on disk (CP within partition)</span></td><td>Within a single partition, Kafka is CP — strict ordering guaranteed. A message written to the leader is not acknowledged until replicated to ISR (In-Sync Replicas). CP for durability.</td></tr>
        <tr><td><strong>Consumer offsets</strong><br><span style="color:#888;font-size:11px;">__consumer_offsets internal topic (CP)</span></td><td>Tracks where each consumer group is in each partition. Stored in a special Kafka topic with high replication. CP — losing offset = reprocessing or skipping messages.</td></tr>
        <tr><td><strong>Cluster metadata / coordination</strong><br><span style="color:#888;font-size:11px;">KRaft (Kafka Raft) — formerly ZooKeeper (CP)</span></td><td>Who is the controller, which broker leads which partition. CP — inconsistent metadata = split-brain. KRaft uses Raft consensus for leader election.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Log-based Architecture (Append-only)</div><div style="font-size:12px;color:#555;margin-top:4px;">Kafka's core insight: treat the log as the primary data structure. Messages are appended sequentially to a file. Sequential disk I/O is nearly as fast as memory (100s of MB/s). Multiple consumers read from the same log independently — no contention.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Consumer Group Pattern</div><div style="font-size:12px;color:#555;margin-top:4px;">A topic has N partitions. A consumer group has M consumers (M ≤ N). Each partition is assigned to exactly one consumer in the group. Want more throughput? Add consumers up to the partition count. Want fan-out? Use separate consumer groups — each gets all messages.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">At-least-once + Idempotent Consumer</div><div style="font-size:12px;color:#555;margin-top:4px;">Kafka guarantees at-least-once delivery by default. A consumer may receive a message multiple times if it crashes before committing the offset. Design consumers to be idempotent — processing the same message twice produces the same result (use idempotency keys or check-and-skip logic).</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Kafka is infrastructure — numbers reflect broker capacity, not a single app's DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Throughput / broker</div>
          <div class="cap-calc-math">1 broker = sequential disk writes to a single partition log<br>Sequential I/O on SSD: ~1 GB/s → at 1KB/msg = 1M msg/sec</div>
          <div class="cap-calc-result">~1M msg/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Avg message size</div>
          <div class="cap-calc-math">Depends on use case: user events ~100B, logs ~500B, DB CDC ~1–10KB<br>Commonly assumed: ~1 KB average</div>
          <div class="cap-calc-result">~1 KB avg</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Retention storage (raw)</div>
          <div class="cap-calc-math">1M msg/sec × 1 KB × 86,400 sec × 7 days<br>= 604,800,000 MB = ~600 TB for 7 days at 1M msg/s</div>
          <div class="cap-calc-result">~600 TB (7 days)</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">After compression</div>
          <div class="cap-calc-math">Snappy or LZ4 compression achieves 5–10× ratio on log data<br>600 TB ÷ 7 ≈ 85 TB actual disk usage</div>
          <div class="cap-calc-result">~85 TB (compressed)</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Replication overhead</div>
          <div class="cap-calc-math">Replication factor 3 = each message written to 3 brokers<br>85 TB × 3 = ~255 TB total disk across cluster</div>
          <div class="cap-calc-result">3× multiplier</div>
        </div>
      </div>
      <div class="insight-box">
        Kafka's speed secret: <strong>sequential disk writes</strong>. Appending to a log is as fast as RAM for SSDs. Random writes (like a traditional DB) are 100–1000× slower. By only ever appending, Kafka saturates disk bandwidth — why 1M msg/sec on a single broker is achievable without exotic hardware.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Producers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">📱 App Server</div>
          <div class="hld-node c-blue">🌐 Web Service</div>
          <div class="hld-node c-blue">🗄️ DB CDC</div>
        </div></div>
        <div class="hld-arrow">↓ batch + compress</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-orange">📦 Broker 1<div class="node-sub">Partitions 0,1,2</div></div>
          <div class="hld-node c-orange">📦 Broker 2<div class="node-sub">Partitions 3,4,5</div></div>
          <div class="hld-node c-orange">📦 Broker 3<div class="node-sub">Replica leader</div></div>
        </div></div>
        <div class="hld-arrow">↓ replicate to ISR</div>
        <div class="hld-row"><div class="hld-node c-teal">🗳️ KRaft Controller<div class="node-sub">Leader election · partition assignment</div></div></div>
        <div class="hld-arrow">↓ poll</div>
        <div class="layer-name">Consumers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">⚙️ Consumer Group A<div class="node-sub">Notification workers</div></div>
          <div class="hld-node c-green">⚙️ Consumer Group B<div class="node-sub">Analytics pipeline</div></div>
          <div class="hld-node c-green">⚙️ Consumer Group C<div class="node-sub">Search indexer</div></div>
        </div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>Same topic, multiple consumer groups:</strong> tweet.created topic consumed by NotificationWorkers (Group A), AnalyticsPipeline (Group B), and SearchIndexer (Group C) — all independently, each at their own pace. Producer sends once; Kafka fans out to all groups.</div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Kafka Concepts (not relational tables)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📋</span><span class="db-node-name">Topic</span></div><div class="db-node-body"><div class="db-row">name <span>e.g. "tweet.created"</span></div><div class="db-row">partition_count <span>INT (e.g. 12)</span></div><div class="db-row">replication_factor <span>INT (e.g. 3)</span></div><div class="db-row">retention_ms <span>7 days default</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📨</span><span class="db-node-name">Message (Record)</span></div><div class="db-node-body"><div class="db-row pk">🔑 offset <span>BIGINT · monotonic per partition</span></div><div class="db-row">key <span>BYTES (determines partition)</span></div><div class="db-row">value <span>BYTES (your payload)</span></div><div class="db-row">timestamp <span>TIMESTAMP</span></div><div class="db-row">headers <span>Key-value metadata</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📌</span><span class="db-node-name">Partition</span></div><div class="db-node-body"><div class="db-row">leader_broker_id <span>INT</span></div><div class="db-row">ISR_brokers <span>List of in-sync replicas</span></div><div class="db-row">log_start_offset <span>BIGINT</span></div><div class="db-row">log_end_offset <span>BIGINT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">👥</span><span class="db-node-name">Consumer Group</span></div><div class="db-node-body"><div class="db-row">group_id <span>VARCHAR</span></div><div class="db-row">committed_offsets <span>Map&lt;partition, offset&gt;</span></div><div class="db-row">state <span>ENUM (stable, rebalancing)</span></div></div></div>
      </div>
      <div class="insight-box"><strong>Message key determines partition:</strong> hash(key) % num_partitions. Messages with the same key always go to the same partition → in-order processing for that key. e.g. all events for user_id=123 go to the same partition → processed in order.</div>` },
    { name: 'Deep Dive — Replication & ISR', content: `
      <div class="content-label">How Kafka achieves durability</div>
      <ul class="req-list">
        <li><strong>Leader</strong> — one broker is the leader for each partition. All reads and writes go through the leader.</li>
        <li><strong>Followers</strong> — other brokers replicate the partition. They pull data from the leader.</li>
        <li><strong>ISR (In-Sync Replicas)</strong> — followers that are within replica.lag.time.max.ms of the leader. Producer acks only after all ISR replicas confirm write (acks=all).</li>
        <li><strong>Broker failure</strong> — if leader fails, KRaft controller elects a new leader from ISR in &lt;30 seconds. Consumers automatically reconnect to new leader.</li>
        <li><strong>acks=all</strong> — strongest durability. Producer waits for all ISR to confirm. Slower but no data loss even if leader immediately crashes after ack.</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>Why sequential disk I/O?</strong> Kafka writes to disk but it's still fast because: (1) append-only = sequential writes (HDDs do 100MB/s sequential vs 0.1MB/s random), (2) OS page cache means frequently read data is served from RAM, (3) sendfile() syscall sends data from page cache to network socket without copying to user space.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔥 Hot partition</strong><br><span style="color:#888;">All messages for a popular user go to one partition (same key) → one consumer handles all their events → bottleneck.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Add a random salt to the key for hot users to distribute across partitions. Sacrifice per-user ordering for throughput.</span></li>
        <li><strong>🔄 Consumer group rebalancing</strong><br><span style="color:#888;">Adding a consumer to a group triggers rebalancing — all consumers pause while partitions are reassigned.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Incremental cooperative rebalancing (Kafka 2.4+) — only reassign affected partitions, not all of them. Dramatically reduces pause time.</span></li>
        <li><strong>⏱️ Consumer lag</strong><br><span style="color:#888;">Consumer is slow — lag grows. Producer keeps writing; consumer can't keep up.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Add more consumers (up to partition count). Increase consumer batch size. If still lagging, add partitions (requires rebalancing).</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Kafka vs RabbitMQ</td><td>Kafka: log-based, replayable, high throughput, consumer pulls. RabbitMQ: message queue, push-based, messages deleted after ack, better for task queues. Kafka for event streaming; RabbitMQ for work queues.</td></tr>
        <tr><td>at-least-once vs exactly-once</td><td>Exactly-once (transactions API) is available but 2–3x slower. Use at-least-once + idempotent consumers for most cases.</td></tr>
      </table>` }
  ]
};

// ── AWS S3 ────────────────────────────────────────────────
systems['s3'] = {
  name: 'AWS S3', sub: 'Object storage',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Upload object</strong> — store any file (image, video, log, backup) by key in a bucket</li>
        <li><strong>Download object</strong> — retrieve file by bucket + key</li>
        <li><strong>Delete object</strong> — remove a file</li>
        <li><strong>List objects</strong> — list all keys in a bucket with optional prefix filter</li>
        <li><strong>Versioning</strong> — keep multiple versions of the same key</li>
        <li><strong>Multipart upload</strong> — upload large files in parts, reassemble on server</li>
        <li><strong>Presigned URLs</strong> — grant temporary read/write access without credentials</li>
        <li><strong>Lifecycle policies</strong> — auto-move to cheaper storage tier, auto-delete after N days</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>11 Nines Durability</td><td>99.999999999% — essentially never lose data. Achieved via erasure coding + multi-AZ replication</td></tr>
        <tr><td>High Availability</td><td>99.99% — objects always readable</td></tr>
        <tr><td>Strong Read-After-Write</td><td>After PUT, subsequent GET returns the new data immediately (S3 achieved this in 2020)</td></tr>
        <tr><td>Scalability</td><td>Store unlimited objects — S3 stores trillions of objects, exabytes of data</td></tr>
        <tr><td>Security</td><td>Bucket policies, IAM, server-side encryption, presigned URLs</td></tr>
        <tr><td>Cost-tiered</td><td>Hot data (S3 Standard) → Warm (S3-IA) → Cold (Glacier) with different latency/cost</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">S3 is an <strong>AP</strong> system for metadata (historically eventual consistency, now strong consistency for objects). For object data itself, durability &gt; any CAP concern.</div>
      <table class="nfr-table">
        <tr><td><strong>Object data</strong><br><span style="color:#888;font-size:11px;">Custom distributed storage (Durability-first)</span></td><td>Objects split into chunks, erasure-coded (like RAID 6 but distributed), stored across multiple storage nodes across AZs. 11 nines durability. Not a traditional DB — a specialised distributed blob store.</td></tr>
        <tr><td><strong>Object metadata</strong><br><span style="color:#888;font-size:11px;">Distributed KV store (CP since 2020)</span></td><td>Key: bucket/key. Value: location of chunks, size, ETag, versioning info. S3 achieved strong read-after-write consistency in Dec 2020 — previously eventual. CP now.</td></tr>
        <tr><td><strong>Bucket configuration</strong><br><span style="color:#888;font-size:11px;">Strongly consistent internal store (CP)</span></td><td>Bucket policies, lifecycle rules, versioning config. Must be consistent — wrong policy = security breach. CP.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Erasure Coding (11 Nines Durability)</div><div style="font-size:12px;color:#555;margin-top:4px;">Object split into N chunks + M parity chunks. Can reconstruct from any N of the (N+M) chunks. E.g. split into 6 data chunks + 3 parity = can lose any 3 storage nodes without data loss. 100x more storage-efficient than 3x replication for same durability.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Consistent Hashing (Object Placement)</div><div style="font-size:12px;color:#555;margin-top:4px;">Which storage node holds which chunks? Consistent hashing assigns objects to nodes. Adding a new node only moves a fraction of objects, not everything. Virtual nodes handle uneven load distribution.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Presigned URL (Secure Delegation)</div><div style="font-size:12px;color:#555;margin-top:4px;">Server generates a URL with HMAC signature: bucket + key + expiry + your credentials. User uses this URL directly — no credentials exposed. Expires after N minutes. S3 verifies signature on request. Used by Spotify, Dropbox, Slack for file serving.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Multipart Upload (Large Files)</div><div style="font-size:12px;color:#555;margin-top:4px;">Files &gt;5GB uploaded in parts (min 5MB each). Each part uploaded independently — parallel uploads possible (10x faster). If one part fails, only retry that part. S3 assembles on completion. ETags verify integrity per part.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">AWS S3 actual scale (public figures)</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Objects stored</div>
          <div class="cap-calc-math">AWS publicly stated: "hundreds of trillions of objects"<br>= 100,000,000,000,000+ individual files</div>
          <div class="cap-calc-result">100+ trillion objects</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Total data stored</div>
          <div class="cap-calc-math">Exabytes (1 Exabyte = 1,000 Petabytes = 1,000,000 TB)<br>Estimated: many tens of Exabytes</div>
          <div class="cap-calc-result">Exabytes</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Storage cost</div>
          <div class="cap-calc-math">S3 Standard: $0.023/GB/month<br>100 GB/month = $2.30 — affordable for most apps</div>
          <div class="cap-calc-result">~$0.023/GB/month</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Request throughput</div>
          <div class="cap-calc-math">Per prefix per bucket: 5,500 GET/sec + 3,500 PUT/sec<br>Add more prefixes (folders) to multiply throughput linearly</div>
          <div class="cap-calc-result">5,500 GET/sec per prefix</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Durability</div>
          <div class="cap-calc-math">99.999999999% (11 nines) durability<br>= lose 1 object per 100 billion objects per year → essentially zero</div>
          <div class="cap-calc-result">11 nines durability</div>
        </div>
      </div>
      <div class="insight-box">
        The key insight: S3 has no real filesystem — it's a flat key-value store. "Folders" are just key prefixes (photos/2024/img.jpg). This flat namespace allows <strong>unlimited horizontal sharding by key hash</strong> — no directory tree to lock, no inode table to contend on. That's how it scales to trillions of objects.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">🌐 Client / App<div class="node-sub">SDK or REST API</div></div></div>
        <div class="hld-arrow">↓ HTTPS</div>
        <div class="hld-row"><div class="hld-node c-orange">🚪 S3 API Frontend<div class="node-sub">Auth (IAM/SigV4) · routing</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">📋 Metadata Service<div class="node-sub">bucket/key → chunk locations</div></div>
          <div class="hld-node c-green">🗂️ Chunk Manager<div class="node-sub">Split / erasure code</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ Storage Node AZ-A<div class="node-sub">Chunks 1, 2, 3</div></div>
          <div class="hld-node c-red">🗄️ Storage Node AZ-B<div class="node-sub">Chunks 4, 5, P1</div></div>
          <div class="hld-node c-red">🗄️ Storage Node AZ-C<div class="node-sub">Chunks P2, P3</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-teal">🌐 CDN<div class="node-sub">Edge caching for popular objects</div></div>
          <div class="hld-node c-yellow">📨 Event Notifications<div class="node-sub">S3 → Lambda / SQS on upload</div></div>
        </div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>PUT flow:</strong> Client uploads → Frontend receives → Chunk Manager splits file → erasure codes → stores chunks on storage nodes in 3 AZs → writes metadata (key → chunk locations) → returns 200 OK + ETag.</div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">S3 Concepts (not traditional SQL tables)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">🪣</span><span class="db-node-name">Bucket</span></div><div class="db-node-body"><div class="db-row pk">🔑 name <span>Globally unique</span></div><div class="db-row">region <span>VARCHAR (us-east-1)</span></div><div class="db-row">versioning <span>BOOLEAN</span></div><div class="db-row">policy <span>JSON (IAM policy doc)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📄</span><span class="db-node-name">Object</span></div><div class="db-node-body"><div class="db-row pk">🔑 key <span>VARCHAR (the "filename")</span></div><div class="db-row fk">🔗 bucket <span>FK → Bucket</span></div><div class="db-row">etag <span>MD5 of content</span></div><div class="db-row">size <span>BIGINT (bytes)</span></div><div class="db-row">storage_class <span>ENUM (STANDARD, IA, GLACIER)</span></div><div class="db-row">version_id <span>VARCHAR (if versioning on)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🧩</span><span class="db-node-name">Chunk</span></div><div class="db-node-body"><div class="db-row pk">🔑 chunk_id <span>UUID</span></div><div class="db-row fk">🔗 object_key + version</div><div class="db-row">storage_node <span>Node ID where stored</span></div><div class="db-row">offset <span>INT (position in object)</span></div><div class="db-row">checksum <span>SHA256</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">🔗</span><span class="db-node-name">Presigned URL</span></div><div class="db-node-body"><div class="db-row">url <span>HTTPS + HMAC signature</span></div><div class="db-row">expiry <span>TIMESTAMP</span></div><div class="db-row">method <span>ENUM (GET, PUT)</span></div><div class="db-row">bucket + key <span>Encoded in URL</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Erasure Coding', content: `
      <div class="content-label">Why not just replicate 3x?</div>
      <div class="insight-box">3x replication = 300% storage overhead. For 1PB of data, you need 3PB of disk. Erasure coding achieves the same durability with ~150% overhead.</div>
      <ul class="req-list" style="margin-top:12px;">
        <li><strong>Reed-Solomon erasure coding</strong> — mathematically encode N data chunks into N+M chunks. Recover original data from any N of the N+M chunks.</li>
        <li><strong>Example (6+3 config):</strong> 1 object → 6 data chunks + 3 parity chunks = 9 total. Can lose any 3 nodes and still recover. Storage overhead = 9/6 = 1.5x vs 3x for replication.</li>
        <li><strong>Cross-AZ placement</strong> — chunks stored in different Availability Zones. An entire AZ going down (fire, flood, power) still doesn't lose data.</li>
        <li><strong>Integrity checks</strong> — S3 checksums every chunk with SHA256. Background jobs periodically verify chunks and rebuild corrupted ones automatically.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔑 Hot key prefix</strong><br><span style="color:#888;">S3 rate-limits per prefix. All objects under one prefix = one shard = max 5500 GET/sec.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Add random prefix to distribute objects. Instead of logs/2024/01/01/file.log, use a4f2/logs/2024/01/01/file.log. Dramatically increases throughput.</span></li>
        <li><strong>📦 Small object overhead</strong><br><span style="color:#888;">Storing millions of 1KB files — metadata overhead approaches data size.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Pack small files into larger archives (tar.gz), or use S3 Express One Zone (lower latency, optimised for small objects).</span></li>
        <li><strong>🌡️ Glacier retrieval latency</strong><br><span style="color:#888;">Cold storage is cheap but data retrieval takes 3–12 hours for Glacier.</span><br><span style="color:#555;display:block;margin-top:4px;">Trade-off by design. Use S3 Glacier Instant Retrieval for millisecond access + low cost. Glacier Deep Archive for true archival (12h retrieval, $0.00099/GB/month).</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Object vs Block vs File storage</td><td>S3 (object): flat namespace, HTTP access, unlimited scale. EBS (block): low-latency disk for EC2, like an HDD. EFS (file): NFS shared filesystem. Use S3 for large data at rest; EBS for DB disks; EFS for shared app state.</td></tr>
        <tr><td>Erasure coding vs replication</td><td>Erasure coding: 1.5x overhead, slower writes (must compute parity), faster recovery from 1-2 node failures. Replication: 3x overhead, faster writes, simpler.</td></tr>
      </table>` }
  ]
};

// ── YOUTUBE ───────────────────────────────────────────────
systems['youtube'] = {
  name: 'YouTube', sub: 'Video streaming',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Upload video</strong> — creators upload video files up to 12 hours long</li>
        <li><strong>Transcode</strong> — convert to multiple resolutions (360p, 720p, 1080p, 4K) and formats (HLS, DASH)</li>
        <li><strong>Stream video</strong> — serve video with adaptive bitrate to any device, anywhere</li>
        <li><strong>Search</strong> — search by title, description, channel, tags</li>
        <li><strong>Recommendations</strong> — personalised "Up next" and home feed</li>
        <li><strong>Comments &amp; Likes</strong> — engagement on videos</li>
        <li><strong>Subscriptions</strong> — subscribe to channels, get notified on new uploads</li>
        <li><strong>Analytics</strong> — creators see views, watch time, revenue</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Low Buffering</td><td>&lt;200ms to start playing — buffering kills engagement</td></tr>
        <tr><td>Adaptive Bitrate</td><td>Seamlessly switch quality based on network — user shouldn't notice</td></tr>
        <tr><td>High Availability</td><td>99.99% — YouTube going down is global news</td></tr>
        <tr><td>Scalability</td><td>500 hours of video uploaded per minute — transcoding must keep up</td></tr>
        <tr><td>Global Delivery</td><td>Serve from CDN node nearest to viewer — latency matters for streaming</td></tr>
        <tr><td>Durability</td><td>Videos must never be lost — 800M videos, stored forever</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">YouTube is <strong>AP-dominant</strong> for most read paths. Video view counts being slightly stale is fine. Video data must be durable. Recommendation quality matters more than consistency.</div>
      <table class="nfr-table">
        <tr><td><strong>Video metadata</strong><br><span style="color:#888;font-size:11px;">Bigtable + Spanner (CP-ish)</span></td><td>Title, description, channel, status, transcoding state. Needs to be consistent — a video shouldn't appear "processing" after it's ready. Google Spanner for globally consistent metadata.</td></tr>
        <tr><td><strong>Video files</strong><br><span style="color:#888;font-size:11px;">GCS / S3 (AP)</span></td><td>Immutable video chunks stored in object storage. CDN serves them. AP — a CDN node serving a slightly stale segment (old before new upload) is fine. Object storage is inherently AP.</td></tr>
        <tr><td><strong>View counts / Likes</strong><br><span style="color:#888;font-size:11px;">Redis + Bigtable (AP)</span></td><td>High write volume. Exact real-time view count is not critical (and gameable). AP: count in Redis, batch-flush to Bigtable every minute. "2.3M views" shown to user may be 60s stale.</td></tr>
        <tr><td><strong>Comments</strong><br><span style="color:#888;font-size:11px;">Spanner (CP)</span></td><td>Comments must be consistent — a posted comment shouldn't disappear. Spanner: globally consistent, strong read-after-write. CP.</td></tr>
        <tr><td><strong>Watch history / Recommendations</strong><br><span style="color:#888;font-size:11px;">Bigtable + ML offline (AP)</span></td><td>Watch history written to Bigtable (high write throughput). Recommendations computed by ML batch jobs daily. AP — seeing a 5-minute-stale recommendation is invisible to users.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Video Transcoding Pipeline (DAG)</div><div style="font-size:12px;color:#555;margin-top:4px;">Upload triggers a DAG: split video into segments → transcode each segment in parallel at each resolution → merge → write manifest. Parallel transcoding means a 1-hour video is ready in minutes, not hours.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Adaptive Bitrate Streaming (HLS/DASH)</div><div style="font-size:12px;color:#555;margin-top:4px;">Video split into 2–10 second segments at each quality (360p, 720p, 1080p). Player downloads a manifest (m3u8) listing all segment URLs. Player monitors download speed — if slow, switches to lower quality segment URLs. Seamless quality adaptation without rebuffering.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">CDN Pre-warming for Viral Videos</div><div style="font-size:12px;color:#555;margin-top:4px;">A viral video gets millions of requests in minutes. CDN cold miss = all requests go to origin = overload. YouTube pre-pushes popular video segments to CDN edge nodes. ML predicts which videos will go viral based on early view velocity.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Deduplication for View Counts</div><div style="font-size:12px;color:#555;margin-top:4px;">Same IP refreshing a video page shouldn't count as multiple views. YouTube deduplicates within a time window using IP + cookie. Prevents view count inflation. Counts are approximate — exact dedup at YouTube's scale is impractical.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">YouTube actual scale (public figures)</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Upload rate</div>
          <div class="cap-calc-math">YouTube public stat: 500 hours of video uploaded every 1 minute<br>= 500 × 60 = 30,000 hours of video per hour</div>
          <div class="cap-calc-result">500 hrs / min</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Storage per hour of video</div>
          <div class="cap-calc-math">1080p raw ≈ 1 GB/hr<br>× 5 resolutions (360p, 480p, 720p, 1080p, 4K) = 5 GB/hr of content</div>
          <div class="cap-calc-result">~5 GB per hour of video</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">New storage / minute</div>
          <div class="cap-calc-math">500 hrs uploaded/min × 5 GB/hr of content<br>= 2,500 GB = 2.5 TB added every single minute</div>
          <div class="cap-calc-result">~2.5 TB / minute</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Total videos stored</div>
          <div class="cap-calc-math">~800M videos × avg 7 min each = 5.6B hours of content<br>× 5 GB/hr ≈ 28 exabytes total (estimated)</div>
          <div class="cap-calc-result">~800M videos</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Bandwidth for streaming</div>
          <div class="cap-calc-math">1080p ABR stream ≈ 5 Mbps = 625 KB/s per viewer<br>1M concurrent viewers × 625 KB/s = 625 GB/s outbound → CDN essential</div>
          <div class="cap-calc-result">~625 KB/s per stream</div>
        </div>
      </div>
      <div class="insight-box">
        2.5 TB added every minute means YouTube cannot afford to store full raw uploads long-term — raw is transcoded then deleted. CDN is non-negotiable: at 1M concurrent viewers × 625 KB/s = 625 GB/s outbound. No origin server cluster could handle that — videos must be at the edge.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Upload Path</div>
        <div class="hld-row"><div class="hld-node c-blue">🎬 Creator App<div class="node-sub">Upload video file</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">📤 Upload Service<div class="node-sub">Chunked upload → raw storage</div></div></div>
        <div class="hld-arrow">↓ triggers</div>
        <div class="hld-row"><div class="hld-node c-teal">⚙️ Transcoding Pipeline<div class="node-sub">Split → parallel transcode → merge</div></div></div>
        <div class="hld-arrow">↓ segments stored</div>
        <div class="hld-row"><div class="hld-node c-red">🪣 GCS / S3<div class="node-sub">All video segments at all qualities</div></div></div>
        <div class="hld-arrow">↓ push to edge</div>
        <div class="layer-name">View Path</div>
        <div class="hld-row"><div class="hld-node c-orange">🌐 CDN<div class="node-sub">Video segments cached at 100+ PoPs</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-blue">📺 Viewer<div class="node-sub">Player fetches manifest + segments</div></div></div>
        <div class="hld-arrow" style="margin:8px 0;">— — metadata — —</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">🔍 Search Service</div>
          <div class="hld-node c-green">🎯 Recommendation Engine</div>
          <div class="hld-node c-green">💬 Comment Service</div>
          <div class="hld-node c-green">📊 Analytics</div>
        </div></div>
        <div class="hld-row" style="margin-top:8px;"><div class="hld-multi">
          <div class="hld-node c-red">🗄️ Spanner<div class="node-sub">Video metadata</div></div>
          <div class="hld-node c-red">🗂️ Bigtable<div class="node-sub">Watch history</div></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">View count cache</div></div>
        </div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">🎬</span><span class="db-node-name">videos</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 channel_id <span>FK → channels</span></div><div class="db-row">title <span>VARCHAR</span></div><div class="db-row">status <span>ENUM (processing, ready, removed)</span></div><div class="db-row">duration_sec <span>INT</span></div><div class="db-row">manifest_url <span>VARCHAR (HLS m3u8)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">📺</span><span class="db-node-name">channels</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 owner_user_id <span>FK → users</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">subscriber_count <span>BIGINT · cached</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">👀</span><span class="db-node-name">watch_history</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id + video_id <span>Composite PK</span></div><div class="db-row">watched_at <span>TIMESTAMP</span></div><div class="db-row">watch_pct <span>INT (0–100%)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">💬</span><span class="db-node-name">comments</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row fk">🔗 video_id <span>FK → videos</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">body <span>TEXT</span></div><div class="db-row">like_count <span>INT</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Transcoding Pipeline', content: `
      <div class="content-label">How a video goes from upload to playable</div>
      <ul class="req-list">
        <li><strong>1. Chunked upload</strong> — creator uploads in 5MB chunks. Resumable if network drops. Stored in raw GCS bucket.</li>
        <li><strong>2. DAG triggered</strong> — upload complete → Pub/Sub event → Transcoding orchestrator starts DAG</li>
        <li><strong>3. Parallel segment transcoding</strong> — split video into 10-second segments. Each segment transcoded independently to 360p, 720p, 1080p, 4K in parallel across worker fleet. A 1-hour video = 360 segments × 4 resolutions = 1440 transcode jobs in parallel.</li>
        <li><strong>4. Merge</strong> — all segments complete → generate HLS manifest (m3u8 file listing all segment URLs per quality)</li>
        <li><strong>5. CDN push</strong> — segments pushed to CDN PoPs. Status updated to "ready" in metadata DB.</li>
        <li><strong>6. Viewer plays</strong> — player fetches m3u8 manifest → downloads segments from nearest CDN node → plays at selected quality.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔥 Viral video CDN miss</strong><br><span style="color:#888;">Viral video = millions of cold CDN requests → origin overload.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Pre-warm CDN for trending videos. ML predicts virality from first-hour view velocity. Also: CDN-to-CDN propagation (tier-1 CDN serves tier-2 CDN caches).</span></li>
        <li><strong>⚙️ Transcoding backlog</strong><br><span style="color:#888;">500hrs/min uploaded. Transcoding takes ~1hr/hr of content. Need 500+ parallel workers constantly.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Elastic worker fleet on Kubernetes. Autoscale based on Kafka queue depth of pending transcode jobs.</span></li>
        <li><strong>📊 View count accuracy</strong><br><span style="color:#888;">At scale, counting every unique view exactly is expensive. YouTube counts are approximate.</span><br><span style="color:#555;display:block;margin-top:4px;">Trade-off accepted: Redis approximate counts (HyperLogLog for unique viewers) + batch reconciliation. "2.3M views" shown ±0.1% is perfectly fine.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>HLS vs DASH</td><td>HLS: Apple-native, works on iOS/Safari without plugins. DASH: open standard, better adaptive bitrate algorithms. YouTube uses both.</td></tr>
        <tr><td>Recommendation: collaborative vs content</td><td>Collaborative filtering (users who watched X also watched Y) works for popular content. Content-based (video features) handles new/niche content. YouTube uses a deep neural network combining both.</td></tr>
      </table>` }
  ]
};

// ── WHATSAPP ──────────────────────────────────────────────
systems['whatsapp'] = {
  name: 'WhatsApp', sub: 'Encrypted messaging',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>1-to-1 messaging</strong> — send text, images, videos, documents, voice notes</li>
        <li><strong>Group chats</strong> — up to 1024 members in a group</li>
        <li><strong>End-to-end encryption</strong> — only sender and recipient can read messages</li>
        <li><strong>Delivery receipts</strong> — ✓ sent, ✓✓ delivered, 🔵 read</li>
        <li><strong>Offline queuing</strong> — messages stored if recipient is offline, delivered on reconnect</li>
        <li><strong>Voice &amp; video calls</strong> — E2E encrypted real-time calls</li>
        <li><strong>Status / Stories</strong> — 24-hour disappearing photo/video stories</li>
        <li><strong>Last seen / Online presence</strong></li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Message Delivery</td><td>At-least-once delivery — a message must never be silently lost</td></tr>
        <tr><td>E2E Encryption</td><td>Server must never see message plaintext — even WhatsApp employees can't read messages</td></tr>
        <tr><td>Low Latency</td><td>&lt;100ms for message delivery on good network</td></tr>
        <tr><td>High Availability</td><td>99.99% — 2B users depend on WhatsApp daily</td></tr>
        <tr><td>Offline Support</td><td>Messages must be stored up to 30 days for offline users</td></tr>
        <tr><td>Scale</td><td>100B+ messages/day globally</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">WhatsApp is <strong>AP</strong> for message delivery (availability trumps consistency — a message delivered slightly out of order is OK). CP for user accounts and encryption key management.</div>
      <table class="nfr-table">
        <tr><td><strong>Message store (offline queue)</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Messages stored temporarily until delivered. Append-only writes per recipient. AP — high availability for writes. Once delivered, messages deleted from server (they live on device). Cassandra TTL handles expiry.</td></tr>
        <tr><td><strong>User accounts / Phone mapping</strong><br><span style="color:#888;font-size:11px;">HBase / MySQL (CP)</span></td><td>Phone number → account mapping. Must be consistent — wrong mapping = messages to wrong person. CP.</td></tr>
        <tr><td><strong>Encryption keys (Signal Protocol)</strong><br><span style="color:#888;font-size:11px;">Key server (CP)</span></td><td>Public keys for each device must be consistent and authentic. CP — compromised key server = compromised encryption. Strongly consistent key distribution.</td></tr>
        <tr><td><strong>Media files</strong><br><span style="color:#888;font-size:11px;">S3 / Blob storage (AP)</span></td><td>Photos, videos stored separately from messages. E2E encrypted blobs — server cannot decrypt. AP — media can be served with slight delay. Stored for 30 days after delivery.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Signal Protocol (E2E Encryption)</div><div style="font-size:12px;color:#555;margin-top:4px;">Each device generates a keypair. Messages encrypted with recipient's public key — only their private key (on their device) can decrypt. Server sees only encrypted ciphertext. Even a compromised server = no message leakage. Uses Double Ratchet algorithm for forward secrecy.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Store-and-Forward (Offline Queue)</div><div style="font-size:12px;color:#555;margin-top:4px;">If recipient is offline, server stores encrypted message temporarily. On reconnect, server delivers all queued messages, recipient sends ack, server deletes. WhatsApp does NOT permanently store messages — this is key to privacy. 30-day TTL if never delivered.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">Delivery Receipt Pattern</div><div style="font-size:12px;color:#555;margin-top:4px;">Three-state receipt: (1) ✓ Server ACK — message reached WhatsApp server. (2) ✓✓ Delivery ACK — recipient's device received message. (3) 🔵 Read ACK — recipient opened the chat. Each state = a small event sent back to sender. Stored per message in sender's local DB.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Group Message Fan-out</div><div style="font-size:12px;color:#555;margin-top:4px;">Group has 1024 members. Sender's device encrypts the message once with a shared group key, sends one copy to server. Server forwards one ciphertext to all 1024 members. Efficient — no N separate encryptions. Members' devices decrypt with the shared group key.</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">WhatsApp actual scale (public figures)</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Messages / day</div>
          <div class="cap-calc-math">WhatsApp public stat: ~100 billion messages/day globally<br>2B+ users × ~50 messages/user/day average</div>
          <div class="cap-calc-result">~100B / day</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Messages / sec</div>
          <div class="cap-calc-math">100,000,000,000 messages/day ÷ 86,400 sec/day<br>= 1,157,407 messages/sec ≈ ~1M/sec</div>
          <div class="cap-calc-result">~1M / sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Message size (encrypted)</div>
          <div class="cap-calc-math">Signal protocol ciphertext: text msg ~300–500B<br>+ MAC (32B) + header (64B) + metadata ≈ ~1 KB average</div>
          <div class="cap-calc-result">~1 KB</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Total message bandwidth</div>
          <div class="cap-calc-math">1M msg/sec × 1 KB = 1,000,000 KB/sec = 1 GB/sec<br>flowing through WhatsApp's connection servers</div>
          <div class="cap-calc-result">~1 GB/sec</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Engineers (2014 famous stat)</div>
          <div class="cap-calc-math">450M users served by ~50 engineers at acquisition<br>Key: Erlang BEAM VM — each WS connection is a cheap Erlang process</div>
          <div class="cap-calc-result">~50 engineers</div>
        </div>
      </div>
      <div class="insight-box">
        The 50-engineers story is real. Erlang was designed for telecom (millions of concurrent calls) — WhatsApp reused that for messaging. In most languages, 1M concurrent connections means 1M threads → out of memory. Erlang: 1M connections = 1M processes × ~300 bytes each = just 300 MB RAM.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Clients</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">📱 Alice's Phone<div class="node-sub">Encrypts with Bob's public key</div></div>
          <div class="hld-node c-blue">📱 Bob's Phone<div class="node-sub">Decrypts with private key</div></div>
        </div></div>
        <div class="hld-arrow">↓ WebSocket / XMPP</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer<div class="node-sub">Sticky connections</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-teal">🔌 Connection Server<div class="node-sub">Erlang — millions of WS connections</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">💬 Message Router<div class="node-sub">Deliver or enqueue</div></div>
          <div class="hld-node c-green">🔑 Key Service<div class="node-sub">Public key distribution</div></div>
          <div class="hld-node c-green">🖼️ Media Service<div class="node-sub">Encrypted blob upload</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🗂️ Cassandra<div class="node-sub">Offline message queue</div></div>
          <div class="hld-node c-red">🐬 MySQL<div class="node-sub">User accounts</div></div>
          <div class="hld-node c-red">🪣 S3<div class="node-sub">Encrypted media</div></div>
        </div></div>
      </div>
      <div class="comm-block" style="margin-top:16px;">
        <div class="comm-row"><span class="comm-pill sync-pill">SYNC</span> Alice sends → Connection Server → Router → if Bob online: deliver directly over WebSocket</div>
        <div class="comm-row"><span class="comm-pill async-pill">ASYNC</span> Bob offline → store in Cassandra → on Bob's reconnect, deliver queued messages → delete from server</div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">👤</span><span class="db-node-name">users</span></div><div class="db-node-body"><div class="db-row pk">🔑 phone_number <span>VARCHAR · PK</span></div><div class="db-row">public_key <span>BYTES (for E2E)</span></div><div class="db-row">last_seen <span>TIMESTAMP</span></div><div class="db-row">push_token <span>VARCHAR</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📨</span><span class="db-node-name">message_queue</span></div><div class="db-node-body"><div class="db-row pk">🔑 recipient_id + msg_id <span>Composite PK</span></div><div class="db-row">encrypted_payload <span>BYTES</span></div><div class="db-row">created_at <span>TIMESTAMP</span></div><div class="db-row">expires_at <span>TIMESTAMP (+30 days)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">👥</span><span class="db-node-name">groups</span></div><div class="db-node-body"><div class="db-row pk">🔑 id <span>UUID · PK</span></div><div class="db-row">name <span>VARCHAR</span></div><div class="db-row">group_key <span>BYTES (shared encryption key)</span></div><div class="db-row">admin_id <span>FK → users</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">✓</span><span class="db-node-name">receipts</span></div><div class="db-node-body"><div class="db-row pk">🔑 msg_id + recipient <span>Composite PK</span></div><div class="db-row">delivered_at <span>TIMESTAMP (✓✓)</span></div><div class="db-row">read_at <span>TIMESTAMP (🔵)</span></div></div></div>
      </div>
      <div class="insight-box"><strong>Messages don't live on server permanently.</strong> message_queue is a temporary holding area — once delivered + ACKed, rows are deleted. Permanent message history lives only on users' devices (local SQLite DB). This is fundamental to WhatsApp's privacy model.</div>` },
    { name: 'Deep Dive — E2E Encryption', content: `
      <div class="content-label">Signal Protocol: Double Ratchet</div>
      <ul class="req-list">
        <li><strong>Key exchange</strong> — on first message, Alice fetches Bob's public key from WhatsApp's key server. Performs X3DH (Extended Triple Diffie-Hellman) to establish a shared secret.</li>
        <li><strong>Double Ratchet</strong> — shared secret evolves with every message (ratchets forward). Each message encrypted with a different key derived from the ratchet. Even if one message's key is compromised, past and future messages are safe.</li>
        <li><strong>Forward secrecy</strong> — keys are ephemeral. Past messages can't be decrypted with current keys. If server is compromised today, messages sent last week are still safe.</li>
        <li><strong>Multi-device</strong> — each of Bob's devices has its own keypair. Alice's device encrypts the message once per device. Key server holds one public key per device.</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>What WhatsApp's server sees:</strong> encrypted blob, sender phone number, recipient phone number, timestamp, message size. Nothing else. The server is a delivery mechanism, not a content store.</div>` },
    { name: 'Message Flow — Online &amp; Offline', content: `
      <div class="content-label">The exact journey of every message Alice sends to Bob</div>

      <!-- PATH A: BOB ONLINE -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:12px;">PATH A — Bob is online when Alice sends</div>
        <svg viewBox="0 0 580 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
          <defs>
            <marker id="wa-ga" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#16a34a"/></marker>
            <marker id="wa-ba" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#3b82f6"/></marker>
          </defs>
          <!-- Boxes row 1 -->
          <rect x="4" y="30" width="80" height="44" rx="7" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
          <text x="44" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">📱 Alice</text>
          <text x="44" y="64" text-anchor="middle" font-size="9" fill="#3b82f6">Encrypts msg</text>

          <rect x="116" y="30" width="90" height="44" rx="7" fill="#fefce8" stroke="#fde68a" stroke-width="1.5"/>
          <text x="161" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#854d0e">🔌 Conn Svr A</text>
          <text x="161" y="64" text-anchor="middle" font-size="9" fill="#a16207">Erlang/WebSocket</text>

          <rect x="238" y="30" width="90" height="44" rx="7" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
          <text x="283" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#7c3aed">💬 Router</text>
          <text x="283" y="64" text-anchor="middle" font-size="9" fill="#9333ea">Bob online? YES</text>

          <rect x="360" y="30" width="90" height="44" rx="7" fill="#fefce8" stroke="#fde68a" stroke-width="1.5"/>
          <text x="405" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#854d0e">🔌 Conn Svr B</text>
          <text x="405" y="64" text-anchor="middle" font-size="9" fill="#a16207">Bob's server</text>

          <rect x="496" y="30" width="80" height="44" rx="7" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
          <text x="536" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8">📱 Bob</text>
          <text x="536" y="64" text-anchor="middle" font-size="9" fill="#3b82f6">Decrypts msg</text>

          <!-- Forward arrows -->
          <line x1="84" y1="52" x2="116" y2="52" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ga)"/>
          <line x1="206" y1="52" x2="238" y2="52" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ga)"/>
          <line x1="328" y1="52" x2="360" y2="52" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ga)"/>
          <line x1="450" y1="52" x2="496" y2="52" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ga)"/>

          <!-- Step labels forward -->
          <text x="100" y="46" text-anchor="middle" font-size="8" fill="#16a34a">WS</text>
          <text x="222" y="46" text-anchor="middle" font-size="8" fill="#16a34a">route</text>
          <text x="344" y="46" text-anchor="middle" font-size="8" fill="#16a34a">push</text>
          <text x="473" y="46" text-anchor="middle" font-size="8" fill="#16a34a">WS</text>

          <!-- ACK arrows (below, right to left) -->
          <line x1="496" y1="120" x2="454" y2="120" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#wa-ba)"/>
          <line x1="360" y1="120" x2="332" y2="120" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#wa-ba)"/>
          <line x1="238" y1="120" x2="210" y2="120" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#wa-ba)"/>
          <line x1="116" y1="120" x2="88" y2="120" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#wa-ba)"/>

          <text x="536" y="112" text-anchor="middle" font-size="8" fill="#3b82f6">sends ✓✓ ACK</text>
          <text x="405" y="112" text-anchor="middle" font-size="8" fill="#3b82f6">Conn Svr B</text>
          <text x="283" y="112" text-anchor="middle" font-size="8" fill="#3b82f6">Router</text>
          <text x="161" y="112" text-anchor="middle" font-size="8" fill="#3b82f6">Conn Svr A</text>

          <text x="44" y="126" text-anchor="middle" font-size="9" font-weight="700" fill="#1d4ed8">Alice sees ✓✓</text>

          <!-- Timeline label -->
          <text x="290" y="155" text-anchor="middle" font-size="9" fill="#888">Total round-trip: &lt;100ms on good network</text>
          <text x="290" y="170" text-anchor="middle" font-size="9" fill="#888">Server never sees plaintext — only forwards the encrypted ciphertext blob</text>
        </svg>
      </div>

      <!-- PATH B: BOB OFFLINE -->
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#c2410c;margin-bottom:12px;">PATH B — Bob is offline (store-and-forward)</div>
        <svg viewBox="0 0 580 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;">
          <defs>
            <marker id="wa-oa" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#ea580c"/></marker>
            <marker id="wa-ra" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#16a34a"/></marker>
            <marker id="wa-da" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#dc2626"/></marker>
          </defs>

          <!-- Phase 1 label -->
          <text x="10" y="18" font-size="10" font-weight="700" fill="#c2410c">① Alice sends while Bob is offline</text>

          <!-- Row 1 boxes -->
          <rect x="4" y="26" width="74" height="40" rx="7" fill="#fed7aa" stroke="#fdba74" stroke-width="1.5"/>
          <text x="41" y="42" text-anchor="middle" font-size="9" font-weight="700" fill="#9a3412">📱 Alice</text>
          <text x="41" y="56" text-anchor="middle" font-size="8" fill="#c2410c">Encrypts</text>

          <rect x="108" y="26" width="84" height="40" rx="7" fill="#fef9c3" stroke="#fde68a" stroke-width="1.5"/>
          <text x="150" y="42" text-anchor="middle" font-size="9" font-weight="700" fill="#854d0e">🔌 Conn Svr A</text>
          <text x="150" y="56" text-anchor="middle" font-size="8" fill="#a16207">receives msg</text>

          <rect x="222" y="26" width="84" height="40" rx="7" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
          <text x="264" y="42" text-anchor="middle" font-size="9" font-weight="700" fill="#7c3aed">💬 Router</text>
          <text x="264" y="56" text-anchor="middle" font-size="8" fill="#9333ea">Bob OFFLINE →</text>

          <rect x="336" y="26" width="100" height="40" rx="7" fill="#fee2e2" stroke="#fca5a5" stroke-width="2"/>
          <text x="386" y="42" text-anchor="middle" font-size="9" font-weight="700" fill="#b91c1c">🗂️ Cassandra</text>
          <text x="386" y="56" text-anchor="middle" font-size="8" fill="#dc2626">queue (30d TTL)</text>

          <!-- Forward arrows phase 1 -->
          <line x1="78" y1="46" x2="108" y2="46" stroke="#ea580c" stroke-width="1.5" marker-end="url(#wa-oa)"/>
          <line x1="192" y1="46" x2="222" y2="46" stroke="#ea580c" stroke-width="1.5" marker-end="url(#wa-oa)"/>
          <line x1="306" y1="46" x2="336" y2="46" stroke="#ea580c" stroke-width="1.5" marker-end="url(#wa-oa)"/>

          <!-- Server ACK back to Alice -->
          <line x1="222" y1="90" x2="192" y2="90" stroke="#6366f1" stroke-width="1.5" marker-end="url(#wa-da)"/>
          <line x1="108" y1="90" x2="78" y2="90" stroke="#6366f1" stroke-width="1.5" marker-end="url(#wa-da)"/>
          <text x="160" y="84" text-anchor="middle" font-size="8" fill="#6366f1">Server ACK ✓</text>
          <text x="41" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="#6366f1">Alice sees ✓</text>
          <text x="41" y="112" text-anchor="middle" font-size="8" fill="#888">(single tick)</text>

          <!-- Divider -->
          <line x1="10" y1="128" x2="570" y2="128" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="6,4"/>
          <text x="290" y="124" text-anchor="middle" font-size="9" fill="#aaa">... time passes — Bob comes back online ...</text>

          <!-- Phase 2 label -->
          <text x="10" y="148" font-size="10" font-weight="700" fill="#15803d">② Bob reconnects — messages delivered</text>

          <!-- Row 2 boxes -->
          <rect x="4" y="156" width="74" height="40" rx="7" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
          <text x="41" y="172" text-anchor="middle" font-size="9" font-weight="700" fill="#1d4ed8">📱 Bob</text>
          <text x="41" y="186" text-anchor="middle" font-size="8" fill="#3b82f6">reconnects</text>

          <rect x="108" y="156" width="84" height="40" rx="7" fill="#fef9c3" stroke="#fde68a" stroke-width="1.5"/>
          <text x="150" y="172" text-anchor="middle" font-size="9" font-weight="700" fill="#854d0e">🔌 Conn Svr B</text>
          <text x="150" y="186" text-anchor="middle" font-size="8" fill="#a16207">new WS conn</text>

          <rect x="222" y="156" width="84" height="40" rx="7" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5"/>
          <text x="264" y="172" text-anchor="middle" font-size="9" font-weight="700" fill="#7c3aed">💬 Router</text>
          <text x="264" y="186" text-anchor="middle" font-size="8" fill="#9333ea">fetch queue</text>

          <rect x="336" y="156" width="100" height="40" rx="7" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
          <text x="386" y="172" text-anchor="middle" font-size="9" font-weight="700" fill="#15803d">🗂️ Cassandra</text>
          <text x="386" y="186" text-anchor="middle" font-size="8" fill="#16a34a">returns msgs</text>

          <!-- Delivery arrows phase 2 (right to left = delivery) -->
          <line x1="336" y1="176" x2="306" y2="176" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ra)"/>
          <line x1="222" y1="176" x2="192" y2="176" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ra)"/>
          <line x1="108" y1="176" x2="78" y2="176" stroke="#16a34a" stroke-width="1.5" marker-end="url(#wa-ra)"/>

          <!-- ACK and delete -->
          <text x="41" y="222" text-anchor="middle" font-size="9" font-weight="700" fill="#1d4ed8">Bob sees ✓✓</text>
          <text x="41" y="236" text-anchor="middle" font-size="8" fill="#888">sends read ACK</text>
          <line x1="78" y1="230" x2="108" y2="230" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#wa-ra)"/>
          <line x1="192" y1="230" x2="222" y2="230" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#wa-ra)"/>
          <line x1="306" y1="230" x2="336" y2="230" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#wa-ra)"/>
          <text x="386" y="236" text-anchor="middle" font-size="9" font-weight="700" fill="#dc2626">DELETE rows</text>
          <text x="386" y="248" text-anchor="middle" font-size="8" fill="#888">(msg gone from server)</text>
          <text x="290" y="270" text-anchor="middle" font-size="9" fill="#888">Alice's UI updates: single ✓ → double ✓✓ → blue 🔵 when Bob reads</text>
        </svg>
      </div>

      <!-- WHERE ARE CHATS STORED -->
      <div class="content-label" style="margin-top:4px;">Where are chats actually stored?</div>
      <table class="nfr-table" style="margin-bottom:16px;">
        <tr><td><strong>📱 Your device</strong><br><span style="color:#888;font-size:11px;">SQLite DB (local)</span></td><td><strong>This is the permanent home.</strong> Every message you send or receive lives in an encrypted SQLite database on your phone. iOS uses hardware-level encryption (Secure Enclave). Android uses full-disk encryption. WhatsApp cannot read this — they don't have the key.</td></tr>
        <tr><td><strong>🗂️ WhatsApp servers</strong><br><span style="color:#888;font-size:11px;">Cassandra (temporary)</span></td><td><strong>Only for offline delivery.</strong> If you're offline, your messages queue here temporarily (max 30 days). The moment your device receives and ACKs the message, the server deletes its copy. WhatsApp's servers are a delivery pipe, not a storage system.</td></tr>
        <tr><td><strong>☁️ iCloud / Google Drive</strong><br><span style="color:#888;font-size:11px;">Optional backup</span></td><td>If you enable backup, your chat history is copied to Apple/Google cloud. By default this is NOT E2E encrypted — Apple/Google can read it. Enable "End-to-end encrypted backup" in WhatsApp settings to protect it with a key only you hold.</td></tr>
        <tr><td><strong>🖼️ Media (S3)</strong><br><span style="color:#888;font-size:11px;">Blob store — 30 days</span></td><td>Photos and videos are uploaded as encrypted blobs to WhatsApp's S3-compatible storage. The encryption key is sent inside the message (E2E encrypted). After 30 days, the media blob is deleted — but the key was already on your device, so locally saved media is fine.</td></tr>
      </table>

      <!-- DELIVERY RECEIPTS -->
      <div class="content-label">How the 3-tick system works</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-size:18px;flex-shrink:0;line-height:1;">✓</div>
          <div><div style="font-size:12px;font-weight:700;color:#111;">Server ACK — single gray tick</div><div style="font-size:12px;color:#666;margin-top:2px;">WhatsApp's Connection Server received your message and committed it to Cassandra (if Bob offline) or routed it onward (if online). Your phone sent the message successfully. Bob may not have it yet.</div></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-size:18px;flex-shrink:0;line-height:1;">✓✓</div>
          <div><div style="font-size:12px;font-weight:700;color:#111;">Delivery ACK — double gray tick</div><div style="font-size:12px;color:#666;margin-top:2px;">Bob's device received the message and sent a DELIVERY ACK event back through the server. This ACK travels all the way back to Alice's phone. Bob's app may be in background — he hasn't necessarily seen the message yet.</div></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
          <div style="font-size:18px;flex-shrink:0;line-height:1;">🔵</div>
          <div><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Read ACK — double blue tick</div><div style="font-size:12px;color:#555;margin-top:2px;">Bob opened the conversation. His app sends a READ event for all messages up to a certain ID. You can disable read receipts in settings — this suppresses the blue ticks, but also means you can't see when others read YOUR messages (symmetric trade-off).</div></div>
        </div>
      </div>

      <!-- MEDIA FLOW -->
      <div class="content-label">How a photo or video message works (different from text)</div>
      <ul class="req-list">
        <li><strong>Step 1 — Client-side encryption</strong>: Alice's app generates a random 256-bit AES media key. Encrypts the photo with it locally. Alice never uploads plaintext media.</li>
        <li><strong>Step 2 — Upload encrypted blob</strong>: Encrypted photo uploaded to WhatsApp's media servers (S3-compatible). Server stores it keyed by a content hash. Server cannot decrypt — it only has the ciphertext.</li>
        <li><strong>Step 3 — Send the key inside the message</strong>: The text message payload contains the S3 URL + the media key — both encrypted with Bob's public key (Signal Protocol). Only Bob's device can decrypt the media key.</li>
        <li><strong>Step 4 — Bob downloads and decrypts</strong>: Bob's device decrypts the message → gets media key + S3 URL → downloads encrypted blob from S3 → decrypts locally with media key → shows photo.</li>
        <li><strong>30-day expiry</strong>: The S3 blob is deleted after 30 days. If Bob's device already has the photo, fine. If not (e.g., new device restore), the media is gone even if the message thread shows it arrived.</li>
      </ul>
      <div class="insight-box" style="margin-top:12px;"><strong>Key insight:</strong> WhatsApp's servers are a routing and temporary storage layer — they never have the keys to read any content. The intelligence (encryption, decryption, local storage) lives entirely on the devices. This is fundamentally different from SMS or email, where the provider can always read your messages.</div>
    ` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>👥 Large group fan-out (1024 members)</strong><br><span style="color:#888;">One message → 1024 WebSocket pushes or 1024 offline queue writes.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Single ciphertext stored on server, all members fetch it. Reduces writes from O(N) to O(1). Server-side fan-out only for online members; offline members fetch on reconnect.</span></li>
        <li><strong>🔑 Key server trust</strong><br><span style="color:#888;">If WhatsApp's key server is compromised, an attacker substitutes their public key → MITM attack.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: Safety numbers — users can compare a 60-digit code in-app to verify they're talking to the right person (key fingerprint). Advanced users use this. Most don't.</span></li>
        <li><strong>📱 Backup breaks E2E</strong><br><span style="color:#888;">WhatsApp Google Drive/iCloud backups are not E2E encrypted by default — Google/Apple can read them.</span><br><span style="color:#555;display:block;margin-top:4px;">Fix: End-to-end encrypted backups (launched 2021) — backup encrypted with a key only you have. Even Google/Apple can't read it. Trade-off: if you lose the key, you lose the backup.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>Delete from server vs keep</td><td>WhatsApp deletes after delivery — maximises privacy, no liability. iMessage keeps on Apple servers. Trade-off: WhatsApp can't provide message history in legal proceedings.</td></tr>
        <tr><td>Erlang choice</td><td>Erlang BEAM VM: lightweight processes (not OS threads), built-in fault tolerance ("let it crash" philosophy), hot code reloading. WhatsApp handles 2M+ connections per server — impossible with thread-per-connection models.</td></tr>
      </table>` }
  ]
};

// ── APPLE AIRTAG ──────────────────────────────────────────
systems['airtag'] = {
  name: 'Apple AirTag', sub: 'Crowd-sourced tracking',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Track item location</strong> — show last known location of AirTag on a map</li>
        <li><strong>Precision Finding</strong> — use UWB to guide user to AirTag within 10m</li>
        <li><strong>Lost Mode</strong> — any nearby iPhone reports the AirTag's location back to owner</li>
        <li><strong>NFC tap</strong> — anyone who finds it can tap with any NFC phone to get contact info</li>
        <li><strong>Anti-stalking alerts</strong> — notify user if unknown AirTag has been travelling with them</li>
        <li><strong>Sound alert</strong> — play a sound to help locate nearby AirTag</li>
        <li><strong>Separation alert</strong> — notify when AirTag is left behind</li>
        <li><strong>Battery status</strong> — show when battery needs replacement</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Privacy by Design</td><td>Apple must never be able to track individual AirTags — location is E2E encrypted to owner only</td></tr>
        <tr><td>Battery Life</td><td>1+ year on a CR2032 battery — BLE beacon must be ultra-low power</td></tr>
        <tr><td>Crowd-sourced Scale</td><td>1B+ Apple devices act as silent relays — massive passive network</td></tr>
        <tr><td>Anti-stalking</td><td>Proactively alert potential victims — critical for safety</td></tr>
        <tr><td>Precision</td><td>UWB provides cm-level precision in close range (&lt;10m)</td></tr>
        <tr><td>Availability</td><td>Find My network should work anywhere there's a nearby Apple device</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <div class="insight-box" style="margin-bottom:10px;">AirTag's backend is unique — it stores <strong>only encrypted location blobs</strong>. Apple literally cannot read the location data. The system is designed to be AP while preserving complete privacy.</div>
      <table class="nfr-table">
        <tr><td><strong>Location reports</strong><br><span style="color:#888;font-size:11px;">Apple's servers (AP — encrypted blobs)</span></td><td>Each location report is an encrypted blob that only the owner's device can decrypt. Server stores: {anonymous_AirTag_ID → encrypted_location}. AP — a report arriving 60 seconds late is fine. Server never waits for consistency before accepting a new report.</td></tr>
        <tr><td><strong>AirTag registration / ownership</strong><br><span style="color:#888;font-size:11px;">iCloud (CP)</span></td><td>Mapping of AirTag serial → Apple ID owner. CP — must be consistent. Wrong ownership mapping = wrong person gets location reports.</td></tr>
        <tr><td><strong>Anti-stalking state</strong><br><span style="color:#888;font-size:11px;">Distributed on-device + Apple servers (AP)</span></td><td>Each iPhone tracks unknown AirTags it's seen moving with it. Reported to Apple's servers aggregated (AP). Server computes "this AirTag has been near this phone for 8+ hours" → send alert.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#1d4ed8;">Crowd-sourced Location (Find My Network)</div><div style="font-size:12px;color:#555;margin-top:4px;">AirTag broadcasts a rotating Bluetooth advertisement. Any nearby iPhone detects it, encrypts AirTag's GPS location with a key derived from AirTag's rotating public key, sends to Apple's servers. Owner's device fetches these reports and decrypts. Relay iPhones remain anonymous and see only encrypted data.</div></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#15803d;">Rotating Public Keys (Privacy)</div><div style="font-size:12px;color:#555;margin-top:4px;">AirTag rotates its advertised public key every 15 minutes. This prevents tracking the AirTag by following a fixed Bluetooth ID. Each relay iPhone uses the current public key to encrypt — only owner's device (which knows the private key series) can decrypt all reports.</div></div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#a16207;">UWB Precision Finding</div><div style="font-size:12px;color:#555;margin-top:4px;">When you're within ~10m of your AirTag, iPhone's UWB chip (U1) measures precise time-of-flight of radio pulses — gives cm-level distance + direction. Displayed as AR arrow pointing toward AirTag. BLE alone is ±few meters; UWB is ±10cm.</div></div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;"><div style="font-size:12px;font-weight:700;color:#7e22ce;">Anti-stalking: Separation Detection</div><div style="font-size:12px;color:#555;margin-top:4px;">Algorithm: if an unknown AirTag has been co-located with your device for 8+ hours (or 3 days if owner is far away), send an alert. iPhone plays a sound on the AirTag. Balance: true positive (catching stalkers) vs false positive (alerting someone carrying a friend's keys).</div></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Apple Find My network — estimated figures</div>
      <div class="cap-calc">
        <div class="cap-calc-row">
          <div class="cap-calc-label">Find My network devices</div>
          <div class="cap-calc-math">Every iPhone, iPad, Mac with Find My enabled = passive relay<br>Apple ecosystem: 1B+ active devices globally</div>
          <div class="cap-calc-result">~1B+ relay devices</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">AirTags deployed</div>
          <div class="cap-calc-math">Launched April 2021. Estimated ~200M sold by 2024<br>(Apple doesn't publish exact figures)</div>
          <div class="cap-calc-result">~200M AirTags</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Key rotation interval</div>
          <div class="cap-calc-math">AirTag changes its broadcast public key every 15 minutes<br>Prevents location tracking: can't correlate reports across rotations</div>
          <div class="cap-calc-result">every 15 min</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Location report size</div>
          <div class="cap-calc-math">Encrypted lat/lng (32B) + ephemeral_key (28B) + timestamp (8B)<br>+ tag_id (32B) + signature (64B) ≈ ~100 bytes per report</div>
          <div class="cap-calc-result">~100 bytes / report</div>
        </div>
        <div class="cap-calc-row">
          <div class="cap-calc-label">Daily report volume</div>
          <div class="cap-calc-math">200M AirTags × 10 relay detections/day × 100 bytes<br>= 200,000,000,000 bytes = ~200 GB/day into Apple servers</div>
          <div class="cap-calc-result">~200 GB / day</div>
        </div>
      </div>
      <div class="insight-box">
        The privacy design is clever: Apple servers store only encrypted blobs — they can't read location. Only the AirTag owner has the private key to decrypt. So Apple can store all 200 GB/day without any privacy risk, and the network scales without Apple learning anyone's location.
      </div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Hardware</div>
        <div class="hld-row"><div class="hld-node c-red" style="border-color:#fca5a5;background:#fff1f2;">📡 AirTag<div class="node-sub">BLE beacon · UWB · NFC · speaker · CR2032</div></div></div>
        <div class="hld-arrow">↓ BLE advertisement (rotating ID)</div>
        <div class="layer-name">Relay (passive, anonymous)</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">📱 iPhone A<div class="node-sub">Detects BLE · gets GPS · encrypts · uploads</div></div>
          <div class="hld-node c-blue">📱 iPhone B</div>
          <div class="hld-node c-blue">💻 Mac C</div>
        </div></div>
        <div class="hld-arrow">↓ {anon_ID → encrypted_report} HTTPS</div>
        <div class="layer-name">Apple Find My Servers</div>
        <div class="hld-row"><div class="hld-node c-orange">☁️ Find My Server<div class="node-sub">Stores encrypted location blobs · indexed by anon_AirTag_ID</div></div></div>
        <div class="hld-arrow">↓ owner fetches reports</div>
        <div class="layer-name">Owner</div>
        <div class="hld-row"><div class="hld-node c-teal">📱 Owner's iPhone<div class="node-sub">Fetches + decrypts reports · shows location on map</div></div></div>
        <div class="hld-arrow" style="margin:8px 0;">— — UWB (close range) — —</div>
        <div class="hld-row"><div class="hld-node c-purple">🎯 Precision Finding<div class="node-sub">U1 chip ↔ AirTag UWB · cm precision</div></div></div>
      </div>
      <div class="insight-box" style="margin-top:12px;"><strong>Apple sees:</strong> anonymous AirTag ID (rotates every 15 min) + encrypted blob. Apple cannot link two consecutive reports to the same AirTag (rotating ID). Cannot read location. Cannot identify relay iPhones. This privacy-by-design approach is architecturally enforced, not just policy.</div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Data structures (privacy-by-design)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📡</span><span class="db-node-name">airtag_registration</span></div><div class="db-node-body"><div class="db-row pk">🔑 serial_number <span>PK (hardware ID)</span></div><div class="db-row fk">🔗 owner_apple_id <span>FK → Apple ID</span></div><div class="db-row">private_key_seed <span>Stored on owner's device only</span></div><div class="db-row">name <span>e.g. "Keys"</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">📍</span><span class="db-node-name">location_reports</span></div><div class="db-node-body"><div class="db-row pk">🔑 anon_id <span>Rotating public key hash</span></div><div class="db-row">encrypted_location <span>BYTES (owner-only decrypt)</span></div><div class="db-row">timestamp <span>TIMESTAMP</span></div><div class="db-row">relay_device_id <span>NULL — never stored</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🔑</span><span class="db-node-name">key_schedule</span></div><div class="db-node-body"><div class="db-row pk">🔑 AirTag serial<div style="font-size:9px;color:#888;">(on owner's device only)</div></div><div class="db-row">current_key_index <span>INT</span></div><div class="db-row">key_rotation_interval <span>15 minutes</span></div><div class="db-row">public_key_i <span>Derived from seed + index</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">🚨</span><span class="db-node-name">anti_stalking_events</span></div><div class="db-node-body"><div class="db-row pk">🔑 victim_device_id <span>(hashed)</span></div><div class="db-row">unknown_airtag_anon_id <span>Anonymous</span></div><div class="db-row">first_seen_at <span>TIMESTAMP</span></div><div class="db-row">alert_sent_at <span>TIMESTAMP</span></div></div></div>
      </div>
      <div class="insight-box"><strong>Key insight:</strong> Apple's servers never store the relay device's identity. The relay iPhone's GPS is encrypted immediately — Apple's server sees only the ciphertext. Even with a government subpoena, Apple cannot reveal who reported an AirTag's location.</div>` },
    { name: 'Deep Dive — Find My Network', content: `
      <div class="content-label">Full flow: from lost AirTag to map pin</div>
      <ul class="req-list">
        <li><strong>1. AirTag broadcasts BLE</strong> — every 2 seconds, AirTag broadcasts a BLE advertisement containing its current rotating public key (changes every 15 minutes).</li>
        <li><strong>2. Relay iPhone detects</strong> — any nearby iPhone with Find My running (background) sees the BLE beacon. Takes current GPS fix.</li>
        <li><strong>3. Encrypt</strong> — relay iPhone encrypts {GPS coordinates, timestamp} using the AirTag's public key from the advertisement. Only the corresponding private key (on owner's device) can decrypt.</li>
        <li><strong>4. Upload</strong> — relay uploads {anon_id: hash(public_key), payload: encrypted_blob} to Apple's Find My servers. Upload is anonymous — no relay device identifier stored.</li>
        <li><strong>5. Owner fetches</strong> — owner's device derives the expected public keys for its AirTag (knows the key schedule from the private seed). Asks Apple's server for reports matching those key hashes.</li>
        <li><strong>6. Decrypt</strong> — owner's device decrypts the payload locally with its private key. Displays location on map. Apple never saw the plaintext location.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔋 Battery vs update frequency</strong><br><span style="color:#888;">More frequent BLE broadcasts = more battery drain. Less frequent = slower location updates.</span><br><span style="color:#555;display:block;margin-top:4px;">AirTag broadcasts every ~2 seconds when "lost" (more power), every ~2 minutes when near owner (less power). Adaptive duty cycle based on owner proximity.</span></li>
        <li><strong>🌐 No nearby Apple devices</strong><br><span style="color:#888;">In a rural area or non-Apple country — no relay devices = no location updates.</span><span style="color:#555;display:block;margin-top:4px;">Trade-off: Find My network only works where Apple devices are dense. Tile/Samsung SmartTag use a similar model. GPS trackers (Tile) work anywhere but need their own cellular.</span></li>
        <li><strong>😈 Anti-stalking evasion</strong><br><span style="color:#888;">A determined stalker could reset AirTag or wrap in RF-blocking material to defeat alerts.</span><br><span style="color:#555;display:block;margin-top:4px;">Apple has improved detection over time — shorter alert windows, Android app to detect AirTags. Arms race between privacy features and evasion.</span></li>
      </ul>
      <table class="nfr-table" style="margin-top:16px;">
        <tr><td>BLE vs UWB vs GPS</td><td>BLE: long range (~100m), low power, ±few meters accuracy. UWB: short range (&lt;10m), medium power, cm accuracy. GPS: unlimited range, high power, ±5m. AirTag uses all three for different scenarios.</td></tr>
        <tr><td>Privacy vs findability</td><td>Rotating keys protect privacy (nobody can track you by following your AirTag's ID). But they make it harder for Apple to aggregate sightings over time. Apple chose privacy — sightings are stateless.</td></tr>
      </table>` }
  ]
};

/* ══════════════ 7 NEW SYSTEMS ══════════════ */

systems['segment'] = {
  name: 'Segment (Event Tracking CDP)', sub: 'Customer Data Platform',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Track events</strong> — capture page views, clicks, custom events from web / mobile / server SDKs</li>
        <li><strong>Identify users</strong> — link anonymous visitors to known users on login (identify call)</li>
        <li><strong>Fan-out to destinations</strong> — forward each event to multiple tools (Amplitude, BigQuery, Mixpanel, Salesforce)</li>
        <li><strong>Schema enforcement</strong> — validate event shapes against a registered schema, reject malformed events</li>
        <li><strong>Replay</strong> — re-send historical events to a newly connected destination</li>
        <li><strong>User traits</strong> — group calls, company/user attribute updates propagated to destinations</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Ingest Latency</td><td>SDK call acknowledged in &lt;50ms — client should never feel it</td></tr>
        <tr><td>Delivery Guarantee</td><td>At-least-once to all destinations — idempotency keys handle duplicates</td></tr>
        <tr><td>Availability</td><td>99.99% — dropping events = losing analytics data permanently</td></tr>
        <tr><td>Throughput</td><td>Handle millions of events/sec at peak (Black Friday, app launches)</td></tr>
        <tr><td>Eventual Consistency</td><td>Destinations can lag seconds/minutes — that's fine</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Event Stream</strong><br><span style="color:#888;font-size:11px;">Kafka (AP)</span></td><td>Append-only, high-write, partitioned by source_id. AP is fine — a slightly delayed event is better than blocking ingest.</td></tr>
        <tr><td><strong>User Profiles</strong><br><span style="color:#888;font-size:11px;">DynamoDB (AP)</span></td><td>Key-value by user_id. Profile merges can be eventually consistent — a stale trait for a few seconds doesn't matter.</td></tr>
        <tr><td><strong>Schema Registry</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Schema must be consistent — all collectors must agree on what's valid. CP prevents a schema change from being partially applied.</td></tr>
        <tr><td><strong>Destination Config</strong><br><span style="color:#888;font-size:11px;">DynamoDB (AP)</span></td><td>Read-heavy config (which destinations are enabled). Cached in workers. Eventually consistent.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Fan-out Pattern</strong><br><span style="color:#555;">1 event → N destination workers. Each worker reads from its own Kafka consumer group — fully independent, no coupling.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Idempotency Keys</strong><br><span style="color:#555;">Each event has a UUID. Destinations deduplicate on this key — safe to retry failed deliveries without double-counting.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Dead Letter Queue</strong><br><span style="color:#555;">Events that fail delivery after N retries go to DLQ. Operators can inspect, fix, and replay — no data loss.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Circuit Breaker</strong><br><span style="color:#555;">If a destination's API is returning 5xx, stop hammering it. Open circuit, buffer events locally, retry when healthy.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Events / day</div><div class="cap-calc-math">100K users × 50 events/session (page views, clicks, custom)</div><div class="cap-calc-result">5M / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Events / sec (avg)</div><div class="cap-calc-math">5M ÷ 86,400 sec/day</div><div class="cap-calc-result">~58 / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Destination writes / sec</div><div class="cap-calc-math">58 events/sec × avg 5 connected destinations</div><div class="cap-calc-result">~290 writes / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Event payload size</div><div class="cap-calc-math">event_name + properties JSON + user_id + timestamp + context ≈ 1 KB</div><div class="cap-calc-result">~1 KB</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Raw storage / year</div><div class="cap-calc-math">5M events/day × 1 KB × 365 days = 1,825,000 MB</div><div class="cap-calc-result">~1.8 TB / yr</div></div>
      </div>
      <div class="insight-box">The write rate (58/sec) is trivial. The challenge is <strong>fan-out reliability</strong>: 58 events × 5 destinations = 290 API calls/sec to external services. Each destination has its own latency, rate limits, and failure modes — decoupling via Kafka is essential.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Sources</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">🌐 analytics.js<div class="node-sub">Browser SDK</div></div>
          <div class="hld-node c-blue">📱 Mobile SDK<div class="node-sub">iOS / Android</div></div>
          <div class="hld-node c-blue">⚙️ Server SDK<div class="node-sub">Python / Node / Go</div></div>
        </div></div>
        <div class="hld-arrow">↓ HTTPS + write key auth</div>
        <div class="layer-name">Ingest</div>
        <div class="hld-row"><div class="hld-node c-orange">📥 Collector API<div class="node-sub">Validate · Enrich · Write key auth</div></div></div>
        <div class="hld-arrow">↓ publish event</div>
        <div class="layer-name">Stream</div>
        <div class="hld-row"><div class="hld-node c-yellow">📨 Kafka<div class="node-sub">Partitioned by source_id</div></div></div>
        <div class="hld-arrow">↓ per-destination consumer groups</div>
        <div class="layer-name">Destination Workers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">📊 Amplitude Worker</div>
          <div class="hld-node c-green">🗄️ BigQuery Worker</div>
          <div class="hld-node c-green">🔭 Mixpanel Worker</div>
          <div class="hld-node c-green">💼 Salesforce Worker</div>
        </div></div>
        <div class="hld-arrow">↓ call external APIs with retry + DLQ</div>
        <div class="layer-name">Side: Profile Store</div>
        <div class="hld-row"><div class="hld-node c-red">👤 DynamoDB<div class="node-sub">User traits · identity graph</div></div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📦</span><span class="db-node-name">events</span></div><div class="db-node-body"><div class="db-row pk">🔑 event_id <span>UUID · PK · idempotency key</span></div><div class="db-row fk">🔗 source_id <span>FK → sources</span></div><div class="db-row">anonymous_id <span>Pre-login visitor ID</span></div><div class="db-row">user_id <span>Post-identify (nullable)</span></div><div class="db-row">event_name <span>e.g. "Product Clicked"</span></div><div class="db-row">properties <span>JSON blob</span></div><div class="db-row">received_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🔌</span><span class="db-node-name">sources</span></div><div class="db-node-body"><div class="db-row pk">🔑 source_id <span>UUID · PK</span></div><div class="db-row">name <span>e.g. "Production Web"</span></div><div class="db-row">type <span>ENUM: js, ios, android, server</span></div><div class="db-row">write_key <span>HASHED · auth token</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🎯</span><span class="db-node-name">destinations</span></div><div class="db-node-body"><div class="db-row pk">🔑 destination_id <span>UUID · PK</span></div><div class="db-row fk">🔗 source_id <span>FK → sources</span></div><div class="db-row">type <span>amplitude, bigquery, mixpanel…</span></div><div class="db-row">config <span>JSON (encrypted API keys)</span></div><div class="db-row">enabled <span>BOOLEAN</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">👤</span><span class="db-node-name">user_profiles</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id <span>PK</span></div><div class="db-row">anonymous_ids <span>ARRAY — pre-login IDs</span></div><div class="db-row">traits <span>JSON (name, email, plan…)</span></div><div class="db-row">updated_at <span>TIMESTAMP</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Fan-out Pipeline', content: `
      <div class="content-label">How one event reaches many destinations reliably</div>
      <ul class="req-list">
        <li><strong>Step 1 — SDK fires</strong> — analytics.js batches events locally (up to 20 events or 5s, whichever comes first), then POSTs to the Collector API. Batching reduces network calls.</li>
        <li><strong>Step 2 — Collector validates</strong> — checks write_key, validates event against schema registry, stamps server-side timestamp, generates event_id UUID if not present.</li>
        <li><strong>Step 3 — Kafka publish</strong> — event published to Kafka topic partitioned by source_id. Collector returns 200 immediately — the client is done.</li>
        <li><strong>Step 4 — Worker consumes</strong> — each destination has its own consumer group. Amplitude Worker reads from partition, transforms event to Amplitude format, calls Amplitude API.</li>
        <li><strong>Step 5 — Retry on failure</strong> — if destination API returns 5xx, worker retries with exponential backoff (1s, 2s, 4s… up to 30s). After 5 failures, moves to DLQ.</li>
        <li><strong>Step 6 — Circuit breaker</strong> — if error rate > 50% in 60s window, worker opens circuit. Stops calling destination, buffers offset in Kafka. Polls with small requests to check recovery.</li>
        <li><strong>Replay</strong> — when a new destination is added, a replay job reads from Kafka's retained log (7 days) or S3 archive and re-emits historical events to that destination only.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🐢 Slow destinations block backpressure</strong><br><span style="color:#555;">If BigQuery is slow, the BigQuery consumer falls behind. Kafka offset lag grows. Solution: per-destination consumer groups so one slow destination never affects others.</span></li>
        <li><strong>👤 Identity resolution is expensive</strong><br><span style="color:#555;">Merging anonymous_id → user_id requires updating all historical events. Solution: store events with both IDs, resolve lazily at query time using the identity graph. Never rewrite historical events.</span></li>
        <li><strong>📋 Schema drift over time</strong><br><span style="color:#555;">Teams add new properties without updating schema → destination writes fail silently. Solution: strict schema enforcement + Slack alerts on validation failures.</span></li>
      </ul>` }
  ]
};

systems['ratelimiter'] = {
  name: 'API Rate Limiter', sub: 'Distributed rate limiting (Stripe / Nginx)',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Allow or reject</strong> incoming requests based on a defined rate (e.g. 100 req/min per user)</li>
        <li><strong>Multiple dimensions</strong> — limit by user_id, API key, IP address, or endpoint</li>
        <li><strong>Return 429</strong> with a <code>Retry-After</code> header when a client is throttled</li>
        <li><strong>Burst allowance</strong> — allow short bursts above the average rate (token bucket)</li>
        <li><strong>Tiered limits</strong> — free users get 60/min, pro users get 1000/min</li>
        <li><strong>Distributed enforcement</strong> — consistent limiting across all API gateway instances</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Overhead per request</td><td>&lt;5ms — rate limiting must be invisible to the user</td></tr>
        <tr><td>Availability</td><td>If rate limiter is unavailable, fail-open (allow traffic) — better than blocking all users</td></tr>
        <tr><td>Consistency</td><td>Slight over-admission (1–2 extra requests) is acceptable — use AP for better latency</td></tr>
        <tr><td>Scalability</td><td>Must scale with API gateway instances — Redis Cluster handles millions of ops/sec</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Rate counters</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>INCR + EXPIRE in a single atomic operation. Sub-millisecond. Slight over-admission is acceptable — AP is the right choice.</td></tr>
        <tr><td><strong>Limit configs/tiers</strong><br><span style="color:#888;font-size:11px;">Redis / in-memory</span></td><td>Rules cached in every gateway instance's memory (refreshed every 30s). Local read = zero network hops.</td></tr>
        <tr><td><strong>Audit log</strong><br><span style="color:#888;font-size:11px;">Kafka → DynamoDB</span></td><td>Log all 429 responses async for abuse analysis. AP fine — logs don't need to be real-time.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Token Bucket</strong><br><span style="color:#555;">Tokens added at fixed rate, consume 1 per request. Allows bursts up to bucket size. Smooth, forgiving algorithm.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Sliding Window Counter</strong><br><span style="color:#555;">Weighted average of prev + current window. More accurate than fixed window, cheaper than log-based. Used by Stripe.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Redis Lua Script</strong><br><span style="color:#555;">Atomic check-and-increment in a single Redis round trip. Prevents race conditions between read and write.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Local Cache + Redis</strong><br><span style="color:#555;">Check local in-memory counter first (fast path). Sync to Redis every 100ms. Trades slight over-admission for latency.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU × 100 API calls/day</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">API calls / day</div><div class="cap-calc-math">100K users × 100 API calls each</div><div class="cap-calc-result">10M / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Rate check / sec</div><div class="cap-calc-math">10M ÷ 86,400 ≈ 116/sec avg (1 Redis call per API call)</div><div class="cap-calc-result">~116 Redis ops/sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Redis capacity</div><div class="cap-calc-math">Redis handles ~100K ops/sec on a single node — we're at 0.1% utilization</div><div class="cap-calc-result">Trivial for Redis</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Memory per user</div><div class="cap-calc-math">1 counter per user per endpoint per window ≈ 100 bytes<br>100K users × 50 endpoints × 100 bytes = 500 MB</div><div class="cap-calc-result">~500 MB Redis RAM</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Overhead per request</div><div class="cap-calc-math">1 Redis INCR call ≈ 0.5ms network + 0.1ms Redis exec<br>= ~0.6ms added to every API call</div><div class="cap-calc-result">&lt; 1ms overhead</div></div>
      </div>
      <div class="insight-box">Rate limiting is computationally trivial. The architecture challenge is <strong>consistency across distributed gateway instances</strong> — without Redis, each instance has its own counter and users can get 10× the limit by routing to 10 servers.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture — middleware in every API gateway</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">Receives 429 + Retry-After header</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">API Gateway (rate limit middleware runs here)</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-orange">🚪 GW Instance 1<div class="node-sub">Local cache + Redis check</div></div>
          <div class="hld-node c-orange">🚪 GW Instance 2</div>
          <div class="hld-node c-orange">🚪 GW Instance 3</div>
        </div></div>
        <div class="hld-arrow">↓ atomic INCR (Lua script)</div>
        <div class="layer-name">Rate Limit Store</div>
        <div class="hld-row"><div class="hld-node c-red">⚡ Redis Cluster<div class="node-sub">key: rl:{user_id}:{endpoint}:{window} → count</div></div></div>
        <div class="hld-arrow">↓ if allowed</div>
        <div class="layer-name">Upstream Service</div>
        <div class="hld-row"><div class="hld-node c-green">⚙️ Your API Service</div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Redis key schema (not relational tables)</div>
      <div style="background:#f8f8f8;border-radius:10px;padding:16px;font-size:13px;font-family:monospace;line-height:1.8;">
        <div style="color:#888;margin-bottom:12px;">// Sliding Window Counter (Stripe's approach)</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">rl:{user_id}:{endpoint}:{window_minute}</span></div>
        <div><span style="color:#16a34a;">Value:</span> integer count (atomic INCR)</div>
        <div><span style="color:#16a34a;">TTL:</span> 2 × window size (keep previous window for weighted calc)</div>
        <div style="margin-top:12px;color:#888;">// Token Bucket (allows burst)</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">tb:{user_id}:{endpoint}</span></div>
        <div><span style="color:#16a34a;">Value:</span> HASH { tokens: float, last_refill: unix_timestamp }</div>
        <div style="margin-top:12px;color:#888;">// Config (cached in-memory, refreshed every 30s)</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">limit_config:{tier}:{endpoint}</span></div>
        <div><span style="color:#16a34a;">Value:</span> { max_requests: 100, window_sec: 60, burst: 20 }</div>
      </div>` },
    { name: 'Deep Dive — Algorithms Compared', content: `
      <div class="content-label">4 algorithms — trade-offs at a glance</div>
      <table class="nfr-table">
        <tr><td><strong>Fixed Window Counter</strong></td><td>Simple. INCR per window. <em>Problem:</em> boundary burst — a user can make 2× the limit by timing requests at window edges (59s + 1s).</td></tr>
        <tr><td><strong>Sliding Window Log</strong></td><td>Store each request timestamp in a sorted set. Count entries in last N seconds. <em>Problem:</em> memory-heavy — O(requests) per user.</td></tr>
        <tr><td><strong>Sliding Window Counter</strong></td><td>Weighted average: current_window_count + (prev_window_count × overlap%). <em>Best balance</em> — accurate, O(1) memory. Stripe uses this.</td></tr>
        <tr><td><strong>Token Bucket</strong></td><td>Tokens replenish at rate R, bucket max B. Allows bursts up to B. <em>Best for</em> bursty clients like mobile apps. AWS API Gateway uses this.</td></tr>
      </table>
      <div class="insight-box" style="margin-top:14px;">Stripe's public blog describes their sliding window counter. The formula: <code>count = current_window + prev_window × (1 - elapsed/window_size)</code>. If a 1-minute window is 40 seconds in, prev contributes 33% (20/60 seconds remaining overlap).</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>⚡ Redis latency adds up</strong><br><span style="color:#555;">At 100K req/sec, even 1ms Redis round-trip = 100 seconds of total latency/sec. Solution: local in-memory approximate counter, sync to Redis every 100ms. Accept slight over-admission.</span></li>
        <li><strong>🔴 Redis single point of failure</strong><br><span style="color:#555;">If Redis is down, fall open (allow all traffic) or fall back to local-only limiting. Falling closed (block all) is worse for availability than slight over-admission.</span></li>
        <li><strong>🌍 Distributed race condition</strong><br><span style="color:#555;">Two gateway instances read count=99 simultaneously, both allow, now count=101. Solution: Redis Lua script makes check+increment atomic in a single server-side operation.</span></li>
      </ul>` }
  ]
};

systems['notifications'] = {
  name: 'Push Notification System', sub: 'Firebase FCM / APNs at scale',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Send notifications</strong> to iOS (APNs), Android (FCM), and Web (Web Push) devices</li>
        <li><strong>Targeted delivery</strong> — send to a specific user, device, or topic (broadcast)</li>
        <li><strong>Scheduling</strong> — send notifications at a future time or recurring schedule</li>
        <li><strong>Delivery tracking</strong> — sent ✓, delivered ✓✓, opened 👁️ receipts</li>
        <li><strong>Token management</strong> — device tokens expire and change; detect and clean up stale tokens</li>
        <li><strong>Priority</strong> — transactional (OTP, payment) vs marketing (promotional) notifications</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Latency (transactional)</td><td>&lt;1 second end-to-end for OTPs, payment alerts</td></tr>
        <tr><td>Throughput (marketing blast)</td><td>10M notifications in &lt;10 minutes — requires massive parallelism</td></tr>
        <tr><td>Delivery guarantee</td><td>At-least-once — idempotency key prevents showing same notification twice</td></tr>
        <tr><td>Availability</td><td>99.9% — notification failure is annoying but not catastrophic</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Device tokens</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>High write volume (tokens update on every app launch). Partition by user_id. AP: slightly stale token is fine — we detect failure and update.</td></tr>
        <tr><td><strong>Notification logs</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Append-only time-series. Never updated. AP fits perfectly — delivery receipts can arrive out-of-order.</td></tr>
        <tr><td><strong>Scheduled jobs</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Scheduled notification must fire exactly once at exactly the right time. CP prevents double-firing if scheduler restarts.</td></tr>
        <tr><td><strong>Topic subscriptions</strong><br><span style="color:#888;font-size:11px;">DynamoDB (AP)</span></td><td>topic → [user_ids]. Read-heavy, write-occasional. AP fine — a subscriber added 1 second ago may miss one blast.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Priority Queue</strong><br><span style="color:#555;">Transactional (OTP) in high-priority queue, marketing blasts in low-priority. OTPs always jump the queue.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Lazy Fan-out (for blasts)</strong><br><span style="color:#555;">Don't expand topic → all users at send time. Store notification + segment, fan-out lazily via worker pool.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Token Refresh on 410</strong><br><span style="color:#555;">APNs returns 410 = token invalid (user uninstalled). Worker deletes token from DB immediately — stops wasting sends.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Delivery Receipt Webhook</strong><br><span style="color:#555;">FCM/APNs callbacks confirm delivery. Store as event stream — used for open-rate analytics.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Notifications / day</div><div class="cap-calc-math">100K users × 5 notifications received per user per day</div><div class="cap-calc-result">500K / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Avg send rate</div><div class="cap-calc-math">500K ÷ 86,400 sec/day</div><div class="cap-calc-result">~6 / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Marketing blast peak</div><div class="cap-calc-math">Push 100K notifications in 10 min = 100K ÷ 600s<br>Need ~167 parallel workers to hit this rate</div><div class="cap-calc-result">~167 / sec (burst)</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Token storage</div><div class="cap-calc-math">100K users × avg 2 devices × 200 bytes/token</div><div class="cap-calc-result">~40 MB</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Delivery log / year</div><div class="cap-calc-math">500K notifications/day × 100 bytes/log × 365 days</div><div class="cap-calc-result">~18 GB / yr</div></div>
      </div>
      <div class="insight-box">The hard problem is the <strong>marketing blast</strong>: sending to 100K users in under 10 minutes requires parallel workers, batching (FCM supports batch sends of 500 at a time), and careful rate limit management per FCM project.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Trigger Sources</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">🛒 Order Service<div class="node-sub">Transactional trigger</div></div>
          <div class="hld-node c-blue">📣 Marketing Tool<div class="node-sub">Batch campaign trigger</div></div>
          <div class="hld-node c-blue">⏰ Scheduler<div class="node-sub">Scheduled notifications</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-teal">📬 Notification Service<div class="node-sub">Priority · dedup · template render</div></div></div>
        <div class="hld-arrow">↓ publish to queue</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-yellow">🔴 High Priority Queue<div class="node-sub">OTP, payment alerts</div></div>
          <div class="hld-node c-yellow">🟡 Low Priority Queue<div class="node-sub">Marketing, promos</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Platform Workers</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">🍎 APNs Worker<div class="node-sub">iOS devices</div></div>
          <div class="hld-node c-green">🤖 FCM Worker<div class="node-sub">Android + Web</div></div>
        </div></div>
        <div class="hld-arrow">↓ delivery receipt callbacks</div>
        <div class="hld-row"><div class="hld-node c-red">🗄️ Cassandra<div class="node-sub">tokens · delivery logs</div></div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📱</span><span class="db-node-name">device_tokens</span></div><div class="db-node-body"><div class="db-row pk">🔑 token_id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">platform <span>ENUM: ios, android, web</span></div><div class="db-row">token <span>FCM/APNs device token</span></div><div class="db-row">last_active <span>TIMESTAMP</span></div><div class="db-row">is_valid <span>BOOLEAN — false on 410</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🔔</span><span class="db-node-name">notifications</span></div><div class="db-node-body"><div class="db-row pk">🔑 notification_id <span>UUID · idempotency key</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">title <span>VARCHAR</span></div><div class="db-row">body <span>TEXT</span></div><div class="db-row">data <span>JSON (deep link, extras)</span></div><div class="db-row">priority <span>ENUM: high, normal</span></div><div class="db-row">status <span>queued/sent/delivered/opened</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — Handling Invalid Tokens', content: `
      <div class="content-label">The stale token problem — why notification open rates drop over time</div>
      <ul class="req-list">
        <li><strong>Why tokens go stale</strong> — when a user uninstalls the app, their device token is invalidated. APNs returns <code>410 Gone</code> on the next send. FCM returns <code>registration-token-not-registered</code>.</li>
        <li><strong>Eager cleanup</strong> — when a worker receives a 410/invalid response, it immediately marks that token as invalid in Cassandra. The token is excluded from all future sends.</li>
        <li><strong>Refresh on app open</strong> — when a user opens the app, the SDK calls <code>getToken()</code> and sends the new token to the server. This overwrites the old one.</li>
        <li><strong>Periodic audit</strong> — a background job runs weekly: finds tokens not refreshed in 90 days, marks them inactive. Prevents sending to ghost devices.</li>
        <li><strong>Multi-device users</strong> — a user might have 3 devices. Send to all valid tokens. If user opens on phone, mark phone token as "primary" for future sends.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>📊 FCM / APNs rate limits</strong><br><span style="color:#555;">FCM allows ~2M sends/minute per FCM project. For massive scale, use multiple FCM projects and route users across them. Monitor quota usage per project.</span></li>
        <li><strong>📦 Large topic fan-out</strong><br><span style="color:#555;">A topic with 10M subscribers — don't load all user_ids into memory at once. Paginate through the subscriber list in chunks of 10K, batch-send to FCM per chunk.</span></li>
        <li><strong>😴 Silent notifications on iOS</strong><br><span style="color:#555;">iOS rate-limits background (silent) notifications. Sending too many silently wakes the app. Batch background syncs — send one silent notification per 30 minutes max.</span></li>
      </ul>` }
  ]
};

systems['bookmyshow'] = {
  name: 'BookMyShow', sub: 'Ticket booking & seat reservation',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Browse events</strong> — concerts, movies, sports — with search, filter by city/date/category</li>
        <li><strong>View seat map</strong> — real-time seat availability (available / held / booked) per event</li>
        <li><strong>Hold seats</strong> — temporarily reserve selected seats for 10 minutes during checkout</li>
        <li><strong>Book & pay</strong> — confirm booking after successful payment; generate QR code ticket</li>
        <li><strong>Cancel</strong> — release held/booked seats, trigger refund within cancellation policy</li>
        <li><strong>Waiting room</strong> — virtual queue for high-demand events (Coldplay, IPL final)</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>No double-booking</td><td>Two users must NEVER get the same seat — strong consistency required for booking</td></tr>
        <tr><td>Hold latency</td><td>&lt;200ms to lock a seat — user is actively waiting</td></tr>
        <tr><td>Read scalability</td><td>Seat map can be eventually consistent — cache aggressively for reads</td></tr>
        <tr><td>Burst handling</td><td>Popular events: 100K users hit "Book" simultaneously — need queuing</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Seat inventory</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>MUST prevent double-booking. Use SELECT FOR UPDATE on the seat row. CP is non-negotiable — losing money/trust on double-booking is catastrophic.</td></tr>
        <tr><td><strong>Seat holds</strong><br><span style="color:#888;font-size:11px;">Redis (CP — SET NX)</span></td><td>SET NX is atomic: only one client wins. TTL auto-expires after 10 minutes. Redis's single-threaded command execution guarantees consistency here.</td></tr>
        <tr><td><strong>Event catalog</strong><br><span style="color:#888;font-size:11px;">Elasticsearch (AP)</span></td><td>Search, filter, geo-based discovery. Eventual consistency is fine — if a new event appears in search 2 seconds late, no one cares.</td></tr>
        <tr><td><strong>Bookings ledger</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Financial record. Needs ACID — the seat status, payment, and booking must all commit or all rollback atomically.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Redis SET NX (Distributed Lock)</strong><br><span style="color:#555;"><code>SET hold:{seat_id} {user_id} NX EX 600</code> — atomic, only succeeds if key doesn't exist. Zero race conditions.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Pessimistic Locking</strong><br><span style="color:#555;">DB: <code>SELECT * FROM seats WHERE id=? FOR UPDATE</code> — row-level lock prevents concurrent updates to the same seat.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Virtual Waiting Room</strong><br><span style="color:#555;">On ticket drop: queue all incoming users in Redis sorted set. Serve N at a time. Fairness without crashing the DB.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Saga Pattern</strong><br><span style="color:#555;">Hold seat → Charge payment → Confirm booking. If payment fails, compensating transaction releases the hold.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Event browses / sec</div><div class="cap-calc-math">100K × 5 browse sessions/day = 500K ÷ 86,400</div><div class="cap-calc-result">~6 / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Seat map loads / sec</div><div class="cap-calc-math">100K × 2 seat map views/day = 200K ÷ 86,400</div><div class="cap-calc-result">~2.3 / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Seat holds / sec</div><div class="cap-calc-math">100K × 0.5% attempt to hold = 500 holds/day ÷ 86,400</div><div class="cap-calc-result">~0.006 / sec avg</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Popular event burst</div><div class="cap-calc-math">Coldplay drop: 100K users hit "Book Now" in 5 minutes<br>= 100K ÷ 300s = 333 hold requests/sec → need waiting room</div><div class="cap-calc-result">333 / sec (peak)</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Active holds in Redis</div><div class="cap-calc-math">Max concurrent holds: ~1K holds × 200 bytes/hold TTL</div><div class="cap-calc-result">~200 KB in Redis</div></div>
      </div>
      <div class="insight-box">The system is <strong>read-heavy in normal operation</strong> (browsing) but has violent <strong>write spikes on popular ticket drops</strong>. The waiting room pattern is essential — without it, 100K simultaneous requests would bring down PostgreSQL.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">📱 Client<div class="node-sub">Browse → Seat Map → Hold → Pay</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer + API Gateway</div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Services</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">🔍 Discovery Service<div class="node-sub">Elasticsearch: search events</div></div>
          <div class="hld-node c-green">🪑 Inventory Service<div class="node-sub">Seat status · hold · release</div></div>
          <div class="hld-node c-green">💳 Booking Service<div class="node-sub">Saga: pay + confirm</div></div>
        </div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Storage</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-red">🐘 PostgreSQL<div class="node-sub">seats (CP) · bookings (CP)</div></div>
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">SET NX holds · waiting room queue</div></div>
          <div class="hld-node c-red">🔭 Elasticsearch<div class="node-sub">Event catalog (AP)</div></div>
        </div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">🎪</span><span class="db-node-name">events</span></div><div class="db-node-body"><div class="db-row pk">🔑 event_id <span>UUID · PK</span></div><div class="db-row">name <span>e.g. "Coldplay World Tour"</span></div><div class="db-row">venue_id <span>FK → venues</span></div><div class="db-row">starts_at <span>TIMESTAMP</span></div><div class="db-row">total_seats <span>INT</span></div><div class="db-row">available_seats <span>INT (cached count)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🪑</span><span class="db-node-name">seats</span></div><div class="db-node-body"><div class="db-row pk">🔑 seat_id <span>UUID · PK</span></div><div class="db-row fk">🔗 event_id <span>FK → events</span></div><div class="db-row">row_label <span>e.g. "C"</span></div><div class="db-row">seat_number <span>e.g. 14</span></div><div class="db-row">category <span>VIP / GOLD / GENERAL</span></div><div class="db-row">status <span>ENUM: AVAILABLE/HELD/BOOKED/EXPIRED</span></div><div class="db-row">expires_at <span>TIMESTAMP (nullable)</span></div><div class="db-row">price <span>DECIMAL</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🎫</span><span class="db-node-name">bookings</span></div><div class="db-node-body"><div class="db-row pk">🔑 booking_id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row fk">🔗 event_id <span>FK → events</span></div><div class="db-row">seat_ids <span>UUID[] ARRAY</span></div><div class="db-row">amount <span>DECIMAL</span></div><div class="db-row">qr_code <span>VARCHAR (generated)</span></div><div class="db-row">status <span>CONFIRMED / CANCELLED</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">⏳</span><span class="db-node-name">Redis: seat holds</span></div><div class="db-node-body"><div class="db-row pk">🔑 hold:{seat_id} → user_id</div><div class="db-row">TTL: 600 seconds (10 min)</div><div class="db-row">Set via: SET NX EX 600</div><div class="db-row">Auto-expires → seat returns to AVAILABLE</div></div></div>
      </div>` },
    { name: 'Deep Dive — Double Booking Prevention', content: `
      <div class="content-label">The exact sequence that prevents two users getting the same seat</div>
      <ul class="req-list">
        <li><strong>Step 1 — User selects seat A7</strong> — client sends POST /hold {seat_id: "A7", user_id: "u123"}</li>
        <li><strong>Step 2 — Redis SET NX</strong> — server runs: <code>SET hold:A7 u123 NX EX 600</code>. If another user already holds A7, Redis returns nil and we return 409 Conflict immediately — no DB hit at all.</li>
        <li><strong>Step 3 — DB write (async background)</strong> — Redis returned OK. Write to PostgreSQL: <code>status=HELD, expires_at=NOW()+600s</code>. This is a background write — user doesn't wait for it. The <code>expires_at</code> column is the key to lazy cleanup.</li>
        <li><strong>Step 4 — Payment</strong> — user completes payment within 10 minutes. Payment Service calls Booking Service.</li>
        <li><strong>Step 5 — DB transaction (happy path)</strong> — <code>BEGIN; SELECT * FROM seats WHERE id='A7' FOR UPDATE; UPDATE seats SET status='BOOKED', expires_at=NULL; INSERT INTO bookings...; COMMIT;</code> then <code>DEL hold:A7</code> in Redis.</li>
        <li><strong>Step 6 — Abandonment (Lazy Cleanup path)</strong> — user leaves. Redis TTL fires at 10 min, key is gone. DB row still says <code>HELD</code> — but every seat read always checks <code>expires_at &gt; NOW()</code>. Expired rows are invisible to queries. No proactive DB update needed.</li>
      </ul>

      <div class="content-label" style="margin-top:20px;">Lazy Cleanup — Why the DB Does Not Need Proactive Updates</div>
      <div style="background:#fff7ed;border:2px solid #f97316;border-radius:8px;padding:12px 14px;font-size:12px;margin-bottom:14px;">
        <strong style="color:#c2410c;">Core idea:</strong> <span style="color:#555;">Attach <code>expires_at</code> to every HELD row and always filter on it at read time. The row never needs to be updated on expiry — the query simply ignores it. The DB cleans up lazily, not reactively.</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;border:1px solid #e2e8f0;">
          <strong style="color:#0f172a;">Reading seat status — always filter expires_at:</strong>
          <pre style="margin-top:6px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:6px;font-size:10px;white-space:pre-wrap;">SELECT * FROM seats
WHERE seat_id = 'A7'
  AND (
    status != 'HELD'
    OR expires_at &gt; NOW()
  )</pre>
          <span style="color:#555;">If HELD but past <code>expires_at</code> → row invisible → seat treated as AVAILABLE. Zero DB update needed.</span>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;border:1px solid #e2e8f0;">
          <strong style="color:#0f172a;">Cron job (every 5 min) — audit only, not correctness:</strong>
          <pre style="margin-top:6px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:6px;font-size:10px;white-space:pre-wrap;">UPDATE seats
SET status = 'EXPIRED'
WHERE status = 'HELD'
  AND expires_at &lt; NOW()</pre>
          <span style="color:#555;">The seat is already effectively free from the moment Redis TTL fired. This cron only cleans the ledger for analytics. If the cron is down for an hour — nothing breaks.</span>
        </div>
      </div>

      <div class="content-label" style="margin-top:4px;">End-to-End Flow with Lazy Cleanup</div>
      <svg viewBox="0 0 580 470" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,sans-serif;margin-top:8px;">
        <defs>
          <marker id="bms-a" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#64748b"/></marker>
          <marker id="bms-g" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#16a34a"/></marker>
          <marker id="bms-r" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#dc2626"/></marker>
        </defs>
        <rect width="580" height="470" fill="#f8fafc" rx="10"/>
        <text x="290" y="22" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">BookMyShow — Seat Hold + Lazy Cleanup Flow</text>

        <!-- Box 1: User selects -->
        <rect x="160" y="32" width="260" height="36" rx="7" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
        <text x="290" y="46" text-anchor="middle" font-size="11" font-weight="700" fill="#1d4ed8">&#x2460; User selects seat A7</text>
        <text x="290" y="60" text-anchor="middle" font-size="10" fill="#3b82f6">POST /hold  {seat_id: "A7", user_id: "u123"}</text>

        <line x1="290" y1="68" x2="290" y2="86" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 2: Redis SET NX -->
        <rect x="148" y="86" width="284" height="40" rx="7" fill="#f3e8ff" stroke="#c084fc" stroke-width="1.5"/>
        <text x="290" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#7c3aed">&#x2461; Redis: SET hold:A7 u123 NX EX 600</text>
        <text x="290" y="116" text-anchor="middle" font-size="10" fill="#9333ea">Single atomic op &#x2014; only one user wins</text>

        <!-- Branch labels -->
        <text x="178" y="143" text-anchor="middle" font-size="10" font-weight="700" fill="#15803d">&#x2713; returns OK</text>
        <text x="408" y="143" text-anchor="middle" font-size="10" font-weight="700" fill="#dc2626">&#x2717; returns nil</text>
        <line x1="238" y1="126" x2="143" y2="154" stroke="#16a34a" stroke-width="1.5" marker-end="url(#bms-g)"/>
        <line x1="342" y1="126" x2="442" y2="154" stroke="#dc2626" stroke-width="1.5" marker-end="url(#bms-r)"/>

        <!-- Nil box: 409 -->
        <rect x="388" y="154" width="170" height="36" rx="7" fill="#fee2e2" stroke="#fca5a5" stroke-width="1.5"/>
        <text x="473" y="168" text-anchor="middle" font-size="11" font-weight="700" fill="#b91c1c">Return 409 Conflict</text>
        <text x="473" y="182" text-anchor="middle" font-size="10" fill="#dc2626">Seat held &#x2014; no DB hit</text>

        <!-- Box 3: DB write -->
        <rect x="22" y="154" width="210" height="40" rx="7" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
        <text x="127" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#15803d">&#x2462; DB write (async background)</text>
        <text x="127" y="184" text-anchor="middle" font-size="10" fill="#16a34a">status=HELD &#x00B7; expires_at=NOW()+600s</text>

        <line x1="127" y1="194" x2="127" y2="212" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 4: Checkout timer -->
        <rect x="22" y="212" width="210" height="36" rx="7" fill="#fefce8" stroke="#fde68a" stroke-width="1.5"/>
        <text x="127" y="227" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">&#x2463; Checkout screen (10 min timer)</text>
        <text x="127" y="241" text-anchor="middle" font-size="10" fill="#b45309">User has 10 min to complete payment</text>

        <!-- Note box: seat map reads Redis -->
        <rect x="388" y="212" width="170" height="52" rx="7" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text x="473" y="228" text-anchor="middle" font-size="10" font-weight="700" fill="#15803d">Seat map reads Redis</text>
        <text x="473" y="242" text-anchor="middle" font-size="10" fill="#16a34a">No hold:A7 key = free</text>
        <text x="473" y="256" text-anchor="middle" font-size="10" fill="#16a34a">DB status irrelevant for UI</text>

        <!-- Second branch labels -->
        <text x="56" y="266" text-anchor="middle" font-size="10" font-weight="700" fill="#15803d">&#x2713; Pays</text>
        <text x="208" y="266" text-anchor="middle" font-size="10" font-weight="700" fill="#dc2626">&#x2717; Abandons</text>
        <line x1="80" y1="248" x2="58" y2="274" stroke="#16a34a" stroke-width="1.5" marker-end="url(#bms-g)"/>
        <line x1="168" y1="248" x2="222" y2="274" stroke="#dc2626" stroke-width="1.5" marker-end="url(#bms-r)"/>

        <!-- Box 5a: Payment -->
        <rect x="5" y="274" width="110" height="36" rx="7" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
        <text x="60" y="288" text-anchor="middle" font-size="11" font-weight="700" fill="#15803d">&#x2464;a Payment &#x2713;</text>
        <text x="60" y="302" text-anchor="middle" font-size="10" fill="#16a34a">Booking Service called</text>

        <line x1="60" y1="310" x2="60" y2="330" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 6a: DB Transaction -->
        <rect x="5" y="330" width="110" height="52" rx="7" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
        <text x="60" y="345" text-anchor="middle" font-size="10" font-weight="700" fill="#15803d">&#x2465;a DB Transaction</text>
        <text x="60" y="359" text-anchor="middle" font-size="10" fill="#16a34a">status = BOOKED</text>
        <text x="60" y="373" text-anchor="middle" font-size="10" fill="#16a34a">DEL hold:A7 (Redis)</text>

        <line x1="60" y1="382" x2="60" y2="402" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 7a: QR Ticket -->
        <rect x="5" y="402" width="110" height="34" rx="7" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
        <text x="60" y="416" text-anchor="middle" font-size="11" font-weight="700" fill="#1d4ed8">&#x2466;a QR Ticket</text>
        <text x="60" y="430" text-anchor="middle" font-size="10" fill="#3b82f6">Booking confirmed &#x2713;</text>

        <!-- Box 5b: Redis TTL -->
        <rect x="158" y="274" width="210" height="40" rx="7" fill="#fff7ed" stroke="#fdba74" stroke-width="1.5"/>
        <text x="263" y="289" text-anchor="middle" font-size="11" font-weight="700" fill="#c2410c">&#x2464;b Redis TTL fires (10 min)</text>
        <text x="263" y="303" text-anchor="middle" font-size="10" fill="#ea580c">hold:A7 key deleted automatically</text>

        <!-- Dashed arrow to note box -->
        <line x1="368" y1="290" x2="388" y2="248" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#bms-g)"/>

        <line x1="263" y1="314" x2="263" y2="334" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 6b: Lazy Cleanup (highlighted) -->
        <rect x="142" y="334" width="236" height="68" rx="7" fill="#fff7ed" stroke="#f97316" stroke-width="2.5"/>
        <text x="260" y="352" text-anchor="middle" font-size="11" font-weight="700" fill="#c2410c">&#x2465;b Lazy Cleanup</text>
        <text x="260" y="366" text-anchor="middle" font-size="10" fill="#ea580c">DB row still says HELD &#x2014; that is OK</text>
        <text x="260" y="380" text-anchor="middle" font-size="10" fill="#555">Every read checks:</text>
        <text x="260" y="393" text-anchor="middle" font-size="10" fill="#7c3aed" font-family="monospace, Courier New">expires_at &gt; NOW()</text>

        <line x1="260" y1="402" x2="260" y2="422" stroke="#64748b" stroke-width="1.5" marker-end="url(#bms-a)"/>

        <!-- Box 7b: Cron job -->
        <rect x="142" y="422" width="236" height="40" rx="7" fill="#fefce8" stroke="#fde68a" stroke-width="1.5"/>
        <text x="260" y="437" text-anchor="middle" font-size="10" font-weight="700" fill="#713f12">&#x2466;b Cron job every 5 min (audit only)</text>
        <text x="260" y="450" text-anchor="middle" font-size="10" fill="#854d0e" font-family="monospace, Courier New">UPDATE status='EXPIRED' WHERE expires_at &lt; NOW()</text>
      </svg>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🌩️ Thundering herd on ticket drops</strong><br><span style="color:#555;">100K users hit "Book Now" simultaneously. Without a waiting room, this DDoSes the DB. Solution: at ticket sale time, add all incoming users to a Redis sorted set (score = arrival timestamp). Serve 100 users at a time every second. Guaranteed fairness.</span></li>
        <li><strong>🔒 Lock contention in PostgreSQL</strong><br><span style="color:#555;">SELECT FOR UPDATE on hot seats causes high lock contention. Solution: Redis SET NX acts as the first gate — only users with a valid Redis hold even attempt the DB transaction. Reduces DB lock pressure by 99%.</span></li>
        <li><strong>💰 Payment timeout leaves seat in limbo</strong><br><span style="color:#555;">Payment gateway times out after 30s but user's Redis hold expires at 10 min. Saga compensating transaction: if payment fails/times out, release Redis hold and update seat to AVAILABLE.</span></li>
      </ul>` }
  ]
};

systems['netflix'] = {
  name: 'Netflix Recommendations', sub: 'Personalised recommendation engine',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Personalised rows</strong> — "Because you watched Inception", "Top Picks for Avinash" on homepage</li>
        <li><strong>Similar titles</strong> — "More like this" on any title's detail page</li>
        <li><strong>Trending</strong> — globally trending + regional trending rows</li>
        <li><strong>Continue watching</strong> — resume from where user left off</li>
        <li><strong>Cold start</strong> — new user with no history gets onboarding-based or demographic recommendations</li>
        <li><strong>A/B testing</strong> — different recommendation algorithms shown to different user segments</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Serving latency</td><td>&lt;100ms to return a personalised homepage — user is actively waiting</td></tr>
        <tr><td>Freshness</td><td>Recommendations can be hours stale — OK. New content must appear within 1 day.</td></tr>
        <tr><td>Availability</td><td>If recommendations fail, fall back to popular/trending — never show empty homepage</td></tr>
        <tr><td>Scale</td><td>300M+ users × 3 homepage loads/day = 900M recommendations served/day</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Watch history</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>High write volume (every play/pause/skip event). Partition by user_id. AP fine — a missed event doesn't noticeably affect recommendations.</td></tr>
        <tr><td><strong>Pre-computed recs</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>user_id → pre-computed list of content_ids. Sub-millisecond lookup. AP fine — stale recs for a few hours don't matter.</td></tr>
        <tr><td><strong>Content metadata</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Title, genre, cast, description must be accurate. CP ensures new titles appear consistently and are never partially updated.</td></tr>
        <tr><td><strong>User/item embeddings</strong><br><span style="color:#888;font-size:11px;">DynamoDB (AP)</span></td><td>128-dim float vectors. Read-heavy, updated by offline jobs. AP — stale embeddings just mean yesterday's preferences, which is fine.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Offline/Online Split</strong><br><span style="color:#555;">Train model offline (Spark, hourly). Pre-compute results. Online serving just does a Redis lookup — zero ML at serve time.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Two-Tower Model</strong><br><span style="color:#555;">User tower → user embedding. Item tower → item embedding. Similarity = dot product. Fast ANN search via FAISS.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Candidate Gen → Re-ranking</strong><br><span style="color:#555;">Stage 1: fast ANN retrieves top-1000 candidates. Stage 2: expensive ML model re-ranks top-50. Two-stage keeps latency low.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Feature Store</strong><br><span style="color:#555;">Shared feature definitions between training and serving pipelines — prevents train-serve skew where model saw different features than it serves.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Netflix actual scale</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Homepage loads / day</div><div class="cap-calc-math">300M users × 3 app opens/day = 900M homepage loads<br>900M ÷ 86,400 ≈ 10,416 loads/sec</div><div class="cap-calc-result">~10K loads / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Watch events / day</div><div class="cap-calc-math">300M users × 2 shows × ~60 events/show (play/pause/skip)</div><div class="cap-calc-result">~36B events / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">User embedding size</div><div class="cap-calc-math">128 dimensions × 4 bytes (float32) = 512 bytes/user<br>300M users × 512 bytes = 150 GB (fits in large Redis cluster)</div><div class="cap-calc-result">512 bytes / user</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Pre-computed recs storage</div><div class="cap-calc-math">300M users × 10 rows × 20 item IDs × 8 bytes/ID<br>= 480 GB of pre-computed recommendations</div><div class="cap-calc-result">~500 GB</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Model training frequency</div><div class="cap-calc-math">Spark job runs hourly on watch event deltas<br>Full retrain: daily overnight using full history</div><div class="cap-calc-result">Hourly incremental</div></div>
      </div>
      <div class="insight-box">The serving path is just a <strong>Redis GET</strong> — &lt;1ms. All the heavy ML runs offline. At 10K homepage loads/sec, even 10ms of online ML inference would require 100 GPU servers. Pre-computation turns a GPU problem into a storage problem.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Offline training + online serving architecture</div>
      <div class="hld-graph">
        <div class="layer-name">Events (Write Path)</div>
        <div class="hld-row"><div class="hld-node c-blue">👤 User watches/clicks<div class="node-sub">Play, pause, skip, rating</div></div></div>
        <div class="hld-arrow">↓ Kafka event stream</div>
        <div class="hld-row"><div class="hld-node c-red">🗄️ Cassandra<div class="node-sub">watch_history (partitioned by user_id)</div></div></div>
        <div class="hld-arrow">↓ hourly Spark jobs</div>
        <div class="layer-name">Offline Training</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-yellow">⚙️ Spark / EMR<div class="node-sub">Compute user & item embeddings</div></div>
          <div class="hld-node c-yellow">🧠 ML Training<div class="node-sub">Two-Tower model</div></div>
        </div></div>
        <div class="hld-arrow">↓ write pre-computed results</div>
        <div class="layer-name">Serving Store</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-purple">⚡ Redis<div class="node-sub">user_id → [content_ids] pre-computed</div></div>
          <div class="hld-node c-purple">🔢 FAISS / ScaNN<div class="node-sub">ANN vector search for "similar titles"</div></div>
        </div></div>
        <div class="hld-arrow">↓ &lt;1ms lookup at serve time</div>
        <div class="layer-name">Online Serving</div>
        <div class="hld-row"><div class="hld-node c-green">🎯 Recommendation API<div class="node-sub">Redis lookup → enrich with metadata → return rows</div></div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">👁️</span><span class="db-node-name">watch_history</span></div><div class="db-node-body"><div class="db-row pk">🔑 (user_id, watched_at) <span>Composite PK</span></div><div class="db-row fk">🔗 content_id <span>FK → content</span></div><div class="db-row">duration_watched <span>seconds</span></div><div class="db-row">completion_pct <span>0.0 – 1.0</span></div><div class="db-row">device_type <span>tv, mobile, web</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🧮</span><span class="db-node-name">user_embeddings</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id <span>PK</span></div><div class="db-row">vector <span>float32[128]</span></div><div class="db-row">updated_at <span>TIMESTAMP</span></div><div class="db-row">model_version <span>e.g. "v42"</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">🎬</span><span class="db-node-name">item_embeddings</span></div><div class="db-node-body"><div class="db-row pk">🔑 content_id <span>PK</span></div><div class="db-row">vector <span>float32[128]</span></div><div class="db-row">genre_tags <span>ARRAY</span></div><div class="db-row">updated_at <span>TIMESTAMP</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">📋</span><span class="db-node-name">recommendations (Redis)</span></div><div class="db-node-body"><div class="db-row pk">🔑 user_id → rows[]</div><div class="db-row">Each row: {title, content_ids[]}</div><div class="db-row">TTL: 6 hours (refreshed by Spark)</div><div class="db-row">Fallback: global top-50 if miss</div></div></div>
      </div>` },
    { name: 'Deep Dive — Two-Tower Model', content: `
      <div class="content-label">How Netflix learns what you want</div>
      <ul class="req-list">
        <li><strong>User Tower</strong> — takes user_id, watch history (last 50 titles), demographics, time-of-day → outputs a 128-dim user embedding vector. "This user likes dark thrillers watched late at night."</li>
        <li><strong>Item Tower</strong> — takes content_id, genre, cast, description, co-watch patterns → outputs a 128-dim item embedding. "Inception is a mind-bending sci-fi thriller with high completion rate."</li>
        <li><strong>Similarity</strong> — dot product or cosine similarity between user vector and item vector. High score = good recommendation. Trained with implicit feedback (watched &gt;80% = positive signal).</li>
        <li><strong>ANN Search</strong> — finding the top-100 most similar items out of 100M is too slow with brute force. FAISS (Facebook AI Similarity Search) builds an index for approximate nearest-neighbor search in milliseconds.</li>
        <li><strong>Re-ranking</strong> — ANN retrieves 1,000 candidates. A second, more expensive model re-ranks: considers context (time of day, device), diversity (don't show 10 action movies in a row), business rules (promoted content).</li>
        <li><strong>Cold start</strong> — new user: show genre picker during onboarding. Use their selections to seed an initial embedding. After 5 watches, personal recommendations kick in.</li>
      </ul>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>📅 Freshness vs compute cost</strong><br><span style="color:#555;">Running Spark jobs hourly for 300M users is expensive. Solution: batch compute for inactive users (weekly), more frequent for active users (hourly). Tiered refresh schedules save 80% compute.</span></li>
        <li><strong>🆕 New content problem</strong><br><span style="color:#555;">A new show added today has no watch data → no embedding → not recommended. Solution: use item metadata (genre, cast) to seed an initial embedding. Once 100 users watch it, update with real signal.</span></li>
        <li><strong>🎭 Filter bubble</strong><br><span style="color:#555;">Pure collaborative filtering traps users in their taste bubble. Solution: inject 10–20% exploration content — slightly outside current preferences. Users discover new genres; model gets broader training signal.</span></li>
      </ul>` }
  ]
};

systems['typeahead'] = {
  name: 'Google Typeahead', sub: 'Search autocomplete at scale',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Autocomplete</strong> — return top-5 suggestions as user types, updated on each keystroke</li>
        <li><strong>Trending suggestions</strong> — globally trending + personalised based on user's search history</li>
        <li><strong>Multi-language</strong> — support suggestions in the user's language / locale</li>
        <li><strong>Freshness</strong> — trending queries (news events) appear in suggestions within minutes</li>
        <li><strong>Safe suggestions</strong> — filter offensive or inappropriate completions</li>
        <li><strong>Ranking</strong> — rank by popularity + personalisation score + recency</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Latency</td><td>&lt;100ms keystroke to suggestions — any slower and suggestions feel laggy</td></tr>
        <tr><td>Throughput</td><td>Google: billions of autocomplete requests/day — massive read scale</td></tr>
        <tr><td>Consistency</td><td>Eventually consistent — suggestions can lag trending by minutes, that's fine</td></tr>
        <tr><td>Availability</td><td>High — autocomplete failure degrades UX but search still works</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Suggestion index</strong><br><span style="color:#888;font-size:11px;">Redis Sorted Set (AP)</span></td><td>prefix → sorted list of suggestions by score. ZREVRANGEBYSCORE for top-N. AP — slightly stale suggestions are imperceptible.</td></tr>
        <tr><td><strong>Trie (in-memory)</strong><br><span style="color:#888;font-size:11px;">In-process (each shard)</span></td><td>Each service instance holds a partial trie in memory, rebuilt from Redis/Kafka every few minutes. Zero network hop for reads.</td></tr>
        <tr><td><strong>User search history</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>Per-user query log for personalisation. AP — missing one query in the personalisation model is unnoticeable.</td></tr>
        <tr><td><strong>Trending counter</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>Sliding window count per query. INCR per search. AP — approximate trending count is fine.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Trie + Prefix Index</strong><br><span style="color:#555;">Each node stores top-K completions. Lookup is O(prefix_length) — ultra fast regardless of total query count.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>CQRS</strong><br><span style="color:#555;">Write path: user submits query → update trending counters async. Read path: serve from pre-built trie. Completely decoupled.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Client-side Debounce</strong><br><span style="color:#555;">Don't fire a request on every keystroke. Wait 50–100ms after last key press. Reduces server load by 5–10×.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Consistent Hashing</strong><br><span style="color:#555;">Route prefix "ap" always to the same shard. That shard has a warm local cache for that prefix — no cold misses.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Searches / day</div><div class="cap-calc-math">100K users × 5 searches/day</div><div class="cap-calc-result">500K / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Autocomplete requests / day</div><div class="cap-calc-math">500K searches × avg 6 chars typed (a, ap, app, appl, apple, apples)<br>= 3M autocomplete calls/day</div><div class="cap-calc-result">3M / day</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Autocomplete / sec</div><div class="cap-calc-math">3M ÷ 86,400 (but with 50ms client debounce, actual server hits ~50% less)</div><div class="cap-calc-result">~17 / sec</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Response payload</div><div class="cap-calc-math">5 suggestions × avg 30 chars = 150 bytes JSON per response</div><div class="cap-calc-result">~150 bytes</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Trie memory per shard</div><div class="cap-calc-math">1M unique queries × avg 20 bytes × branching factor<br>≈ 50MB per shard — fits easily in RAM</div><div class="cap-calc-result">~50 MB / shard</div></div>
      </div>
      <div class="insight-box">At 17 requests/sec this seems easy — but Google does 8.5B searches/day = ~100K/sec. The trie must be <strong>sharded by prefix</strong> across many nodes, and each node serves millions of RPS with single-digit millisecond latency. Client debouncing is the cheapest performance win.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Architecture — read path and write (trend update) path</div>
      <div class="hld-graph">
        <div class="layer-name">Client</div>
        <div class="hld-row"><div class="hld-node c-blue">🖥️ Browser / App<div class="node-sub">50ms debounce before sending</div></div></div>
        <div class="hld-arrow">↓ GET /autocomplete?q=ap</div>
        <div class="hld-row"><div class="hld-node c-orange">⚖️ Load Balancer<div class="node-sub">Consistent hash on prefix → same shard</div></div></div>
        <div class="hld-arrow">↓</div>
        <div class="layer-name">Typeahead Service Shards (in-memory trie)</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-green">🌳 Shard A–G<div class="node-sub">Trie for prefixes a–g</div></div>
          <div class="hld-node c-green">🌳 Shard H–R</div>
          <div class="hld-node c-green">🌳 Shard S–Z</div>
        </div></div>
        <div class="hld-arrow">↓ trie rebuilt from Redis every 5 min</div>
        <div class="hld-row"><div class="hld-node c-purple">⚡ Redis Sorted Sets<div class="node-sub">prefix → [(suggestion, score)]</div></div></div>
        <div class="hld-arrow">↑ async trend updates (separate path)</div>
        <div class="layer-name">Trend Update Pipeline</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-yellow">📨 Kafka<div class="node-sub">search query events</div></div>
          <div class="hld-node c-yellow">⚙️ Aggregator<div class="node-sub">Sliding window counts → Redis</div></div>
        </div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Redis data structures (not relational tables)</div>
      <div style="background:#f8f8f8;border-radius:10px;padding:16px;font-size:13px;font-family:monospace;line-height:1.8;">
        <div style="color:#888;margin-bottom:12px;">// Sorted Set per prefix — score = popularity</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">prefix:ap</span></div>
        <div><span style="color:#16a34a;">Members:</span> "apple" (score:9500), "app store" (8200), "apple watch" (7100)</div>
        <div><span style="color:#16a34a;">Query:</span> ZREVRANGEBYSCORE prefix:ap +inf -inf LIMIT 0 5</div>
        <div style="margin-top:12px;color:#888;">// Sliding window trending counter</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">trend:1h:{query}</span> — count of searches in last hour</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">trend:24h:{query}</span> — count in last 24 hours</div>
        <div style="margin-top:12px;color:#888;">// Blocked terms</div>
        <div><span style="color:#16a34a;">Key:</span> <span style="color:#1d4ed8;">blocked_terms</span> → SET of blacklisted strings</div>
        <div><span style="color:#16a34a;">Check:</span> SISMEMBER blocked_terms {suggestion} before returning</div>
      </div>` },
    { name: 'Deep Dive — Trie vs Redis Sorted Sets', content: `
      <div class="content-label">Two approaches — trade-offs</div>
      <table class="nfr-table">
        <tr><td><strong>Trie (in-memory)</strong></td><td>O(prefix_length) lookup. Extremely fast. No network hop. <em>Problem:</em> hard to update atomically at scale. Hard to shard. Rebuilt periodically from a source of truth.</td></tr>
        <tr><td><strong>Redis Sorted Set</strong></td><td>One sorted set per prefix. ZREVRANGEBYSCORE returns top-N. Persistent, easy to update. <em>Problem:</em> network hop (0.5–1ms). One key per prefix = millions of Redis keys.</td></tr>
        <tr><td><strong>Hybrid (used in practice)</strong></td><td>Redis Sorted Sets as source of truth. In-memory trie per shard rebuilt every 5 minutes. Serve from trie (fast), update Redis async. Best of both.</td></tr>
      </table>
      <div class="insight-box" style="margin-top:14px;">Short prefixes like "a" or "th" match millions of queries — pre-compute top-1000 and cache. Long prefixes (&gt;6 chars) are rare — serve from trie directly. <strong>Bloom filter</strong> can quickly determine "no results exist for this prefix" without a trie traversal.</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🔥 Short prefix hotspots</strong><br><span style="color:#555;">"a", "th", "the" are queried billions of times/day. Don't compute on the fly — pre-compute and cache at CDN level. A GET for prefix "a" can be served from CDN edge with no origin hit.</span></li>
        <li><strong>⚡ Personalisation adds latency</strong><br><span style="color:#555;">Loading user's search history and re-scoring adds 20–50ms. Solution: pre-compute personalised boosts offline, stored as a small delta (user_id → {query: boost_score}). Apply as offset to global score at serve time.</span></li>
        <li><strong>🌍 Multi-language complexity</strong><br><span style="color:#555;">Japanese, Arabic, Chinese need character-level tries, not word-level. Shard by language first, then by prefix. Query routing must detect language before prefix routing.</span></li>
      </ul>` }
  ]
};

systems['twitch'] = {
  name: 'Twitch', sub: 'Live video streaming platform',
  steps: [
    { name: 'Functional Requirements', content: `
      <div class="content-label">What the system must do</div>
      <ul class="req-list">
        <li><strong>Stream ingest</strong> — streamer broadcasts via RTMP from OBS/streaming software</li>
        <li><strong>Live playback</strong> — viewers watch with &lt;5s latency (HLS) or &lt;1s (low-latency mode)</li>
        <li><strong>Live chat</strong> — real-time chat alongside the stream (thousands of concurrent messages/sec)</li>
        <li><strong>VOD recording</strong> — save stream as a video-on-demand after it ends</li>
        <li><strong>Channel discovery</strong> — browse live channels by game/category, search streamers</li>
        <li><strong>Monetisation</strong> — subscriptions, bits (virtual currency), ads mid-stream</li>
      </ul>` },
    { name: 'Non-Functional Requirements', content: `
      <div class="content-label">How well it must perform</div>
      <table class="nfr-table">
        <tr><td>Ingest latency</td><td>&lt;1 second from streamer's encoder to ingest server</td></tr>
        <tr><td>Viewer latency</td><td>Standard HLS: ~5–30s. Low-latency mode: ~2s. WebRTC: &lt;1s</td></tr>
        <tr><td>Chat latency</td><td>&lt;500ms — chat must feel live alongside stream</td></tr>
        <tr><td>Scale</td><td>Popular streams: 100K+ concurrent viewers per channel</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Database Choice — CAP Theorem</div>
      <table class="nfr-table">
        <tr><td><strong>Stream metadata</strong><br><span style="color:#888;font-size:11px;">PostgreSQL (CP)</span></td><td>Channel info, stream status (live/offline), subscription status. CP — a viewer must not see "offline" for a live stream due to inconsistency.</td></tr>
        <tr><td><strong>Chat messages</strong><br><span style="color:#888;font-size:11px;">Cassandra (AP)</span></td><td>High write volume, time-series, append-only. AP fine — chat messages out-of-order by milliseconds is imperceptible.</td></tr>
        <tr><td><strong>Viewer counts</strong><br><span style="color:#888;font-size:11px;">Redis (AP)</span></td><td>Approximate INCR/DECR. AP — showing 10,523 vs 10,521 viewers is irrelevant. Updated every 5 seconds.</td></tr>
        <tr><td><strong>VOD storage</strong><br><span style="color:#888;font-size:11px;">S3 + CDN</span></td><td>Object storage for HLS segments. CDN serves viewers — no origin hit for popular streams. AP aligned — brief CDN staleness on a VOD is fine.</td></tr>
      </table>
      <div class="content-label" style="margin-top:20px;">Design Patterns That Drive These Decisions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
        <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>RTMP → HLS Transcode</strong><br><span style="color:#555;">RTMP from streamer → transcode to multiple bitrates → package as HLS segments → S3 → CDN → viewers. Standard pipeline.</span></div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>ABR Streaming</strong><br><span style="color:#555;">Client switches between 360p/720p/1080p segments based on bandwidth. Smooth experience on variable connections.</span></div>
        <div style="background:#fefce8;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>Chat Fan-out via Pub/Sub</strong><br><span style="color:#555;">One Redis pub/sub channel per stream. Chat message → publish to channel → all subscribers (connection servers) receive → push to WebSocket clients.</span></div>
        <div style="background:#faf5ff;border-radius:8px;padding:10px 12px;font-size:12px;"><strong>CDN Pre-warming</strong><br><span style="color:#555;">When a large streamer goes live, proactively push first N segments to CDN edge nodes before viewers arrive. Prevents thundering herd on CDN miss.</span></div>
      </div>` },
    { name: 'Capacity Estimation', content: `
      <div class="content-label">Assumed: 100K DAU</div>
      <div class="cap-calc">
        <div class="cap-calc-row"><div class="cap-calc-label">Concurrent streamers</div><div class="cap-calc-math">100K DAU × 0.1% are actively streaming at any time</div><div class="cap-calc-result">~100 streamers</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Concurrent viewers</div><div class="cap-calc-math">100K DAU × 20% watching at peak hour</div><div class="cap-calc-result">~20K viewers</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Ingest bandwidth</div><div class="cap-calc-math">100 streamers × 6 Mbps (1080p60 OBS bitrate)<br>= 600 Mbps total ingest into origin servers</div><div class="cap-calc-result">~600 Mbps ingest</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Viewer bandwidth (CDN)</div><div class="cap-calc-math">20K viewers × 4 Mbps (720p stream)<br>= 80 Gbps — must be served entirely by CDN</div><div class="cap-calc-result">~80 Gbps via CDN</div></div>
        <div class="cap-calc-row"><div class="cap-calc-label">Chat messages / sec</div><div class="cap-calc-math">20K viewers × 1 message / 30s average<br>= ~667 chat messages/sec across all channels</div><div class="cap-calc-result">~667 msg/sec</div></div>
      </div>
      <div class="insight-box">The ingest-to-viewer ratio is massive: 600 Mbps in, 80 Gbps out = <strong>133× amplification</strong>. This is entirely handled by CDN — the origin servers only handle 100 streams. No origin server could serve 80 Gbps directly.</div>` },
    { name: 'High Level Design (HLD)', content: `
      <div class="content-label">Two paths: video (CDN) and chat (WebSocket)</div>
      <div class="hld-graph">
        <div class="layer-name">Video Path</div>
        <div class="hld-row"><div class="hld-node c-blue">🎮 Streamer (OBS)<div class="node-sub">RTMP stream → 6 Mbps</div></div></div>
        <div class="hld-arrow">↓ RTMP</div>
        <div class="hld-row"><div class="hld-node c-orange">📡 Ingest Server<div class="node-sub">Receives RTMP stream</div></div></div>
        <div class="hld-arrow">↓ raw video</div>
        <div class="hld-row"><div class="hld-node c-teal">⚙️ Transcoding Farm<div class="node-sub">360p / 720p / 1080p parallel workers</div></div></div>
        <div class="hld-arrow">↓ HLS segments (.ts files)</div>
        <div class="hld-row"><div class="hld-node c-red">🪣 S3<div class="node-sub">Segment storage + VOD archive</div></div></div>
        <div class="hld-arrow">↓ CDN pulls segments</div>
        <div class="hld-row"><div class="hld-node c-green">🌐 CDN Edge (100K+ viewers)<div class="node-sub">ABR player fetches segments every 2s</div></div></div>
        <div class="hld-arrow" style="margin-top:16px;">Chat Path ↓</div>
        <div class="hld-row"><div class="hld-multi">
          <div class="hld-node c-blue">💬 Viewer sends chat</div>
          <div class="hld-node c-teal">🔌 WS Gateway<div class="node-sub">sticky sessions by channel</div></div>
          <div class="hld-node c-purple">⚡ Redis Pub/Sub<div class="node-sub">channel:{stream_id}</div></div>
        </div></div>
      </div>` },
    { name: 'Data Modeling', content: `
      <div class="content-label">Tables</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="db-node"><div class="db-node-header" style="background:#eff6ff;border-color:#bfdbfe;"><span class="db-node-icon">📺</span><span class="db-node-name">channels</span></div><div class="db-node-body"><div class="db-row pk">🔑 channel_id <span>UUID · PK</span></div><div class="db-row fk">🔗 user_id <span>FK → users (streamer)</span></div><div class="db-row">name <span>e.g. "shroud"</span></div><div class="db-row">category <span>e.g. "FPS Games"</span></div><div class="db-row">is_live <span>BOOLEAN</span></div><div class="db-row">viewer_count <span>INT (approx, from Redis)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#fefce8;border-color:#fef08a;"><span class="db-node-icon">🔴</span><span class="db-node-name">streams</span></div><div class="db-node-body"><div class="db-row pk">🔑 stream_id <span>UUID · PK</span></div><div class="db-row fk">🔗 channel_id <span>FK → channels</span></div><div class="db-row">started_at <span>TIMESTAMP</span></div><div class="db-row">ended_at <span>TIMESTAMP (null if live)</span></div><div class="db-row">vod_url <span>S3 path to VOD segments</span></div><div class="db-row">peak_viewers <span>INT</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="db-node-icon">💬</span><span class="db-node-name">chat_messages</span></div><div class="db-node-body"><div class="db-row pk">🔑 (stream_id, sent_at) <span>Composite PK · Cassandra</span></div><div class="db-row fk">🔗 user_id <span>FK → users</span></div><div class="db-row">content <span>VARCHAR(500)</span></div><div class="db-row">badges <span>ARRAY (sub, mod, vip)</span></div></div></div>
        <div class="db-node"><div class="db-node-header" style="background:#faf5ff;border-color:#e9d5ff;"><span class="db-node-icon">💳</span><span class="db-node-name">subscriptions</span></div><div class="db-node-body"><div class="db-row pk">🔑 (user_id, channel_id) <span>Composite PK</span></div><div class="db-row">tier <span>1 / 2 / 3</span></div><div class="db-row">started_at <span>TIMESTAMP</span></div><div class="db-row">expires_at <span>TIMESTAMP</span></div></div></div>
      </div>` },
    { name: 'Deep Dive — RTMP vs WebRTC', content: `
      <div class="content-label">Why the streaming protocol matters for latency</div>
      <table class="nfr-table">
        <tr><td><strong>RTMP (ingest)</strong></td><td>Real-Time Messaging Protocol. Every encoder (OBS, StreamLabs) supports it. ~2–5s latency. TCP-based — reliable but adds retransmit delay. Twitch uses RTMP for streamer → ingest server.</td></tr>
        <tr><td><strong>HLS (viewer delivery)</strong></td><td>HTTP Live Streaming. Segments of 2–6 seconds. Works on every device/CDN. Latency = 2–3 segments = 4–18s. Standard viewer experience.</td></tr>
        <tr><td><strong>Low-Latency HLS (LL-HLS)</strong></td><td>Apple's extension: partial segments (~0.2s each). Reduces latency to 2–3s. Twitch's "Low Latency Mode" uses this. Requires updated CDN support.</td></tr>
        <tr><td><strong>WebRTC</strong></td><td>&lt;1s latency. Peer-to-peer capable. Hard to scale to 100K viewers (need SFU). Used for Twitch's Squad Streaming (small group). Not used for main viewer stream.</td></tr>
      </table>
      <div class="insight-box" style="margin-top:14px;">Twitch's architecture: RTMP ingest → transcode to LL-HLS → CDN edge. For 100K viewers, serving HLS from CDN is infinitely more scalable than WebRTC's SFU approach. WebRTC is reserved for interactive use cases (&lt;10 viewers).</div>` },
    { name: 'Bottlenecks & Trade-offs', content: `
      <ul class="req-list" style="gap:10px;">
        <li><strong>🖥️ Transcoding is CPU-intensive</strong><br><span style="color:#555;">Each stream needs real-time transcoding to 3–5 quality levels. 100 concurrent streams × 3 workers = 300 transcoding processes. Use GPU-accelerated encoding (NVENC) — 10× more efficient than CPU ffmpeg.</span></li>
        <li><strong>💬 Chat at massive scale</strong><br><span style="color:#555;">Popular streamers get 10K+ chat messages/second. At this rate, chat becomes unreadable anyway. Solution: sub-mode (subscribers only), slow mode (1 message per 30s), or emote-only mode. Rate limiting by design.</span></li>
        <li><strong>🌩️ Streamer goes offline unexpectedly</strong><br><span style="color:#555;">Internet drop mid-stream. Ingest server must detect TCP close, update stream status to offline, trigger VOD processing. Grace period of 60s before marking offline — handles brief disconnects.</span></li>
      </ul>` }
  ]
};

const comingSoonSystems = [];
const placeholderNames = {
  airbnb:'Airbnb', twitter:'Twitter Timeline', slack:'Slack',
  googledocs:'Google Docs', bluesky:'Bluesky', stockexchange:'Stock Exchange',
  payment:'Payment System', urlshortener:'URL Shortener', spotify:'Spotify',
  tinder:'Tinder', lambda:'Amazon Lambda', chatgpt:'LLMs / ChatGPT',
  uber:'Uber', kafka:'Apache Kafka', s3:'AWS S3',
  youtube:'YouTube', whatsapp:'WhatsApp', airtag:'Apple AirTag',
  segment:'Segment', ratelimiter:'API Rate Limiter', notifications:'Push Notification System',
  bookmyshow:'BookMyShow', netflix:'Netflix Recommendations',
  typeahead:'Google Typeahead', twitch:'Twitch'
};
const placeholderSubs = {
  airbnb:'Home rental marketplace', twitter:'Real-time social feed', slack:'Team messaging',
  googledocs:'Collaborative editing', bluesky:'Decentralized social', stockexchange:'Order matching engine',
  payment:'Money movement', urlshortener:'Link shortening service', spotify:'Audio streaming',
  tinder:'Geo-based matching', lambda:'Serverless compute', chatgpt:'AI inference at scale',
  uber:'Nearby driver matching', kafka:'Event streaming platform', s3:'Object storage',
  youtube:'Video streaming', whatsapp:'Encrypted messaging', airtag:'Crowd-sourced tracking',
  segment:'Customer Data Platform', ratelimiter:'Distributed rate limiting',
  notifications:'Firebase FCM / APNs at scale', bookmyshow:'Ticket booking & seat reservation',
  netflix:'Personalised recommendation engine', typeahead:'Search autocomplete at scale',
  twitch:'Live video streaming platform'
};

// ── KUBERNETES ────────────────────────────────────────────
systems['k8s'] = {
  name: 'Kubernetes',
  sub: 'Container orchestration at scale',
  steps: [
    {
      name: 'What is Kubernetes?',
      content: `
        <div class="content-section">
          <div class="content-label">The Core Problem</div>
          <div class="insight-box" style="border-left-color:#326CE5;background:#f0f4ff;">
            <strong>Before Kubernetes:</strong> You have 50 microservices. Each needs 3 copies for HA. That's 150 processes to start, monitor, restart on crash, balance load across, update without downtime, and scale when traffic spikes. Manual shell scripts cannot do this reliably at scale.
          </div>
        </div>
        <div class="content-section">
          <div class="content-label">The Kubernetes Promise</div>
          <table class="nfr-table">
            <tr><td>Declarative</td><td>You write YAML: "I want 5 copies of my app". K8s figures out how to make it happen — and keeps it that way forever.</td></tr>
            <tr><td>Self-healing</td><td>A pod crashes → K8s restarts it. A node dies → K8s moves its pods to healthy nodes. No pager alert needed for this.</td></tr>
            <tr><td>Auto-scaling</td><td>CPU hits 80% → K8s adds more pods. Traffic drops → K8s removes them. Scales pods and nodes automatically.</td></tr>
            <tr><td>Rolling deploys</td><td>New version deploys pod-by-pod with zero downtime. Instant rollback if health checks fail.</td></tr>
            <tr><td>Service discovery</td><td>Every service gets a stable DNS name. Pods find each other by name, not IP (pod IPs change constantly).</td></tr>
            <tr><td>Resource packing</td><td>Scheduler fits containers onto nodes like a bin-packing algorithm — maximising hardware utilisation.</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">The Best Analogy</div>
          <div class="insight-box">
            Think of Kubernetes as a <strong>hospital administrator</strong>:<br>
            — Patients = Pods (your containers)<br>
            — Rooms = Nodes (your servers)<br>
            — Administrator = Control Plane (K8s brain)<br><br>
            The administrator: assigns patients to rooms, monitors vitals (health checks), moves patients if a ward floods (node failure), ensures every ward always has the right staff (replica count), and brings in more rooms when the hospital is full (cluster autoscaler).
          </div>
        </div>
        <div class="content-section">
          <div class="content-label">What K8s Is Not</div>
          <ul class="req-list">
            <li><strong>Not a CI/CD pipeline</strong> — K8s runs containers; Jenkins/GitHub Actions builds them</li>
            <li><strong>Not a service mesh</strong> — K8s has basic networking; Istio/Linkerd adds observability + mTLS</li>
            <li><strong>Not a database</strong> — stateful workloads need extra care (PVCs, StatefulSets)</li>
            <li><strong>Not magic</strong> — K8s makes operations easier, not trivial. You still design your app for failure</li>
          </ul>
        </div>
      `
    },
    {
      name: 'Core Architecture',
      content: `
        <div class="content-section">
          <div class="content-label">Two Planes: Brain vs Muscle</div>
          <svg viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px;margin-bottom:20px;">
            <!-- Control Plane -->
            <rect x="10" y="10" width="680" height="170" rx="10" fill="#f0f4ff" stroke="#6366f1" stroke-width="1.5"/>
            <text x="24" y="32" font-size="11" font-weight="700" fill="#6366f1" font-family="monospace">CONTROL PLANE (The Brain) — runs on master node(s)</text>
            <!-- API Server -->
            <rect x="24" y="44" width="148" height="58" rx="7" fill="#fff" stroke="#6366f1" stroke-width="1.5"/>
            <text x="98" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="#6366f1" font-family="sans-serif">API Server</text>
            <text x="98" y="81" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Front door — all</text>
            <text x="98" y="93" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">kubectl commands hit it</text>
            <!-- etcd -->
            <rect x="184" y="44" width="120" height="58" rx="7" fill="#fff" stroke="#f59e0b" stroke-width="1.5"/>
            <text x="244" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="#f59e0b" font-family="sans-serif">etcd</text>
            <text x="244" y="81" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Cluster state DB</text>
            <text x="244" y="93" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Distributed key-value</text>
            <!-- Scheduler -->
            <rect x="316" y="44" width="140" height="58" rx="7" fill="#fff" stroke="#10b981" stroke-width="1.5"/>
            <text x="386" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="#10b981" font-family="sans-serif">Scheduler</text>
            <text x="386" y="81" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Picks which node</text>
            <text x="386" y="93" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">gets each pod</text>
            <!-- Controller Manager -->
            <rect x="468" y="44" width="210" height="58" rx="7" fill="#fff" stroke="#ef4444" stroke-width="1.5"/>
            <text x="573" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="#ef4444" font-family="sans-serif">Controller Manager</text>
            <text x="573" y="81" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Reconciliation loops — watches desired</text>
            <text x="573" y="93" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">vs actual state, fixes drift</text>
            <!-- Reconcile loop arrow -->
            <rect x="24" y="118" width="654" height="50" rx="7" fill="#fff" stroke="#e8e8e8" stroke-width="1"/>
            <text x="351" y="139" text-anchor="middle" font-size="10" font-weight="700" fill="#888" font-family="monospace">THE RECONCILE LOOP</text>
            <text x="351" y="157" text-anchor="middle" font-size="9" fill="#888" font-family="sans-serif">Watch etcd → compare desired state vs actual → take action → repeat forever (every ~5s)</text>
            <!-- Arrows down to worker nodes -->
            <line x1="200" y1="182" x2="175" y2="210" stroke="#999" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="500" y1="182" x2="525" y2="210" stroke="#999" stroke-width="1.5" stroke-dasharray="4"/>
            <text x="351" y="205" text-anchor="middle" font-size="10" fill="#aaa" font-family="sans-serif">kubelet on each node talks to API Server via HTTPS</text>
            <!-- Worker Node 1 -->
            <rect x="10" y="220" width="320" height="190" rx="10" fill="#f0fdf4" stroke="#10b981" stroke-width="1.5"/>
            <text x="24" y="242" font-size="11" font-weight="700" fill="#10b981" font-family="monospace">WORKER NODE 1 (muscle)</text>
            <rect x="22" y="252" width="90" height="50" rx="6" fill="#fff" stroke="#10b981" stroke-width="1"/>
            <text x="67" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981" font-family="sans-serif">kubelet</text>
            <text x="67" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">Node agent</text>
            <rect x="124" y="252" width="90" height="50" rx="6" fill="#fff" stroke="#6366f1" stroke-width="1"/>
            <text x="169" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#6366f1" font-family="sans-serif">kube-proxy</text>
            <text x="169" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">iptables/ipvs</text>
            <rect x="226" y="252" width="95" height="50" rx="6" fill="#fff" stroke="#f59e0b" stroke-width="1"/>
            <text x="273" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b" font-family="sans-serif">containerd</text>
            <text x="273" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">Container runtime</text>
            <!-- Pods in node 1 -->
            <rect x="22" y="315" width="85" height="40" rx="5" fill="#326CE5" opacity="0.15" stroke="#326CE5" stroke-width="1"/>
            <text x="65" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#326CE5" font-family="sans-serif">Pod A</text>
            <text x="65" y="345" text-anchor="middle" font-size="8" fill="#326CE5" font-family="sans-serif">api-server:8080</text>
            <rect x="118" y="315" width="85" height="40" rx="5" fill="#326CE5" opacity="0.15" stroke="#326CE5" stroke-width="1"/>
            <text x="161" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#326CE5" font-family="sans-serif">Pod B</text>
            <text x="161" y="345" text-anchor="middle" font-size="8" fill="#326CE5" font-family="sans-serif">api-server:8080</text>
            <rect x="214" y="315" width="100" height="40" rx="5" fill="#10b981" opacity="0.15" stroke="#10b981" stroke-width="1"/>
            <text x="264" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981" font-family="sans-serif">Pod C</text>
            <text x="264" y="345" text-anchor="middle" font-size="8" fill="#10b981" font-family="sans-serif">cache:6379</text>
            <text x="170" y="378" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">Pods share the node's network namespace</text>
            <text x="170" y="395" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">Each gets a unique cluster-internal IP</text>
            <!-- Worker Node 2 -->
            <rect x="370" y="220" width="320" height="190" rx="10" fill="#f0fdf4" stroke="#10b981" stroke-width="1.5"/>
            <text x="384" y="242" font-size="11" font-weight="700" fill="#10b981" font-family="monospace">WORKER NODE 2 (muscle)</text>
            <rect x="382" y="252" width="90" height="50" rx="6" fill="#fff" stroke="#10b981" stroke-width="1"/>
            <text x="427" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981" font-family="sans-serif">kubelet</text>
            <text x="427" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">Node agent</text>
            <rect x="484" y="252" width="90" height="50" rx="6" fill="#fff" stroke="#6366f1" stroke-width="1"/>
            <text x="529" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#6366f1" font-family="sans-serif">kube-proxy</text>
            <text x="529" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">iptables/ipvs</text>
            <rect x="586" y="252" width="95" height="50" rx="6" fill="#fff" stroke="#f59e0b" stroke-width="1"/>
            <text x="633" y="273" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b" font-family="sans-serif">containerd</text>
            <text x="633" y="288" text-anchor="middle" font-size="8" fill="#666" font-family="sans-serif">Container runtime</text>
            <rect x="382" y="315" width="85" height="40" rx="5" fill="#ef4444" opacity="0.15" stroke="#ef4444" stroke-width="1"/>
            <text x="425" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#ef4444" font-family="sans-serif">Pod D</text>
            <text x="425" y="345" text-anchor="middle" font-size="8" fill="#ef4444" font-family="sans-serif">worker:5000</text>
            <rect x="478" y="315" width="85" height="40" rx="5" fill="#326CE5" opacity="0.15" stroke="#326CE5" stroke-width="1"/>
            <text x="521" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#326CE5" font-family="sans-serif">Pod E</text>
            <text x="521" y="345" text-anchor="middle" font-size="8" fill="#326CE5" font-family="sans-serif">api-server:8080</text>
            <rect x="574" y="315" width="106" height="40" rx="5" fill="#9c6fe4" opacity="0.15" stroke="#9c6fe4" stroke-width="1"/>
            <text x="627" y="331" text-anchor="middle" font-size="9" font-weight="700" fill="#9c6fe4" font-family="sans-serif">Pod F (dying)</text>
            <text x="627" y="345" text-anchor="middle" font-size="8" fill="#9c6fe4" font-family="sans-serif">→ K8s restarts</text>
          </svg>
        </div>
        <div class="content-section">
          <div class="content-label">Control Plane Components</div>
          <table class="nfr-table">
            <tr><td>API Server</td><td>The single entry point for all cluster operations. Every kubectl command, every webhook, every controller — all talk to the API Server. It validates requests and writes to etcd. Stateless — can run multiple replicas for HA.</td></tr>
            <tr><td>etcd</td><td>Distributed key-value store. The only stateful piece. Stores <em>all</em> cluster state: which pods exist, which nodes are registered, what config is applied. If etcd dies with no backup, your cluster is gone. Back it up.</td></tr>
            <tr><td>Scheduler</td><td>Watches for newly created pods with no node assigned. Scores all nodes by resource availability, affinity rules, taints. Assigns the best-fit node. Does NOT run the pod — just records the assignment in etcd.</td></tr>
            <tr><td>Controller Manager</td><td>Runs ~30 controller loops in one binary. Each controller watches one resource type. ReplicaSet controller: if desired=3, actual=2 → creates a pod. If actual=4 → deletes a pod. Node controller: marks nodes unreachable, evicts their pods.</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">Worker Node Components</div>
          <table class="nfr-table">
            <tr><td>kubelet</td><td>Agent on every node. Watches the API Server for pods assigned to its node. Tells the container runtime to start/stop containers. Reports pod status back. If kubelet dies, that node's pods are orphaned.</td></tr>
            <tr><td>kube-proxy</td><td>Maintains iptables/IPVS rules on each node so that a Service's virtual IP routes to the correct pod IPs. When a pod is added/removed, kube-proxy updates the rules cluster-wide.</td></tr>
            <tr><td>Container Runtime</td><td>Actually runs containers. Default is containerd (not Docker). Implements the CRI interface that kubelet calls. Docker is just containerd + extra tooling — K8s doesn't need the extra tooling.</td></tr>
          </table>
        </div>
      `
    },
    {
      name: 'Core Objects (Resources)',
      content: `
        <div class="content-section">
          <div class="content-label">Pod — The Atomic Unit</div>
          <div class="insight-box" style="border-left-color:#326CE5;background:#f0f4ff;">
            A Pod = 1 or more containers that <strong>share</strong> the same network namespace (same IP) and can share volumes. Containers in a pod can talk to each other via <code>localhost</code>. Almost always: 1 container per pod.
          </div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;margin-top:10px;">apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: nginx:1.25
    ports:
    - containerPort: 80
    resources:
      requests: { cpu: "100m", memory: "128Mi" }
      limits:   { cpu: "500m", memory: "256Mi" }</pre>
          <div style="font-size:12px;color:#888;margin-top:6px;">You rarely create Pods directly — use a Deployment which manages Pods for you.</div>
        </div>
        <div class="content-section">
          <div class="content-label">Deployment — Managed Pods at Scale</div>
          <div class="insight-box">
            Deployment → manages → ReplicaSet → manages → Pods. The Deployment adds rolling-update logic on top of ReplicaSet. <strong>Always use Deployments, not bare Pods or ReplicaSets.</strong>
          </div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;margin-top:10px;">apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3                    # maintain exactly 3 pods
  selector:
    matchLabels: { app: api }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
      - name: api
        image: myapp:v2.0        # change this → triggers rolling update
        ports:
        - containerPort: 8080</pre>
        </div>
        <div class="content-section">
          <div class="content-label">Service — Stable Network Endpoint</div>
          <div class="insight-box">
            Pod IPs change every time a pod restarts. A Service gives a <strong>stable virtual IP + DNS name</strong> that load-balances across all matching pods via label selector. Pods come and go; the Service IP never changes.
          </div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;margin-top:10px;">apiVersion: v1
kind: Service
metadata:
  name: api-svc
spec:
  selector: { app: api }         # routes to all pods with label app=api
  ports:
  - port: 80                     # Service port (what callers use)
    targetPort: 8080             # container port
  type: ClusterIP                # internal only (default)</pre>
          <div style="font-size:12px;color:#555;margin-top:6px;">DNS name inside cluster: <code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">api-svc.default.svc.cluster.local</code></div>
        </div>
        <div class="content-section">
          <div class="content-label">Other Key Objects</div>
          <table class="nfr-table">
            <tr><td>ConfigMap</td><td>Non-sensitive config (env vars, config files). Mounted as env vars or volume files. Change ConfigMap → pods pick it up without rebuild. e.g. DB_HOST=postgres-svc, LOG_LEVEL=info</td></tr>
            <tr><td>Secret</td><td>Same as ConfigMap but for sensitive data. Values base64-encoded. Stored encrypted in etcd (with encryption-at-rest enabled). Mount as env var or file. e.g. DB_PASSWORD, API_KEY. Use external secret managers (Vault, AWS Secrets Manager) in prod.</td></tr>
            <tr><td>Namespace</td><td>Virtual cluster inside a cluster. Isolates resources by team/env. <code>kubectl get pods -n production</code>. Default namespaces: default, kube-system, kube-public. Best practice: one namespace per team or per environment.</td></tr>
            <tr><td>Ingress</td><td>HTTP/HTTPS routing rules. One LoadBalancer → routes to many services based on host/path. Requires an Ingress Controller (nginx, traefik, AWS ALB). Example: api.example.com → api-svc, app.example.com → frontend-svc.</td></tr>
            <tr><td>PersistentVolume (PV)</td><td>A piece of storage (EBS, GCS disk, NFS) provisioned by admin or dynamically. Exists independent of pod lifecycle — survives pod restarts. PVC (claim) is how a pod requests storage. StorageClass defines how PVs are provisioned.</td></tr>
          </table>
        </div>
      `
    },
    {
      name: 'Pod Controllers — When to Use What',
      content: `
        <div class="content-section">
          <div class="content-label">5 Controller Types — Decision Matrix</div>
          <table class="nfr-table">
            <tr style="background:#f8f8f8;"><td style="font-weight:800;color:#111;">Controller</td><td style="font-weight:800;color:#111;">Use When</td><td style="font-weight:800;color:#111;">Real Examples</td></tr>
            <tr>
              <td><strong style="color:#326CE5;">Deployment</strong></td>
              <td>Stateless app. Any pod is identical & replaceable. Rolling updates. 99% of your services.</td>
              <td>REST APIs, GraphQL servers, web frontends, ML inference servers, background workers</td>
            </tr>
            <tr>
              <td><strong style="color:#f59e0b;">StatefulSet</strong></td>
              <td>App needs: stable hostname per pod, stable storage per pod, ordered startup/shutdown. Each pod is unique.</td>
              <td>PostgreSQL, MySQL, Redis Cluster, Kafka brokers, Elasticsearch, ZooKeeper</td>
            </tr>
            <tr>
              <td><strong style="color:#10b981;">DaemonSet</strong></td>
              <td>Exactly ONE pod per node. When a node joins → pod is automatically added. When node leaves → pod removed.</td>
              <td>Log collectors (Fluentd, Filebeat), metrics agents (Prometheus node-exporter), network plugins (Calico), security scanners</td>
            </tr>
            <tr>
              <td><strong style="color:#6366f1;">Job</strong></td>
              <td>Run-to-completion task. Retries on failure. Marks as Complete when done. Pods are created and then cleaned up.</td>
              <td>DB migrations, batch data processing, one-off scripts, report generation, ML training run</td>
            </tr>
            <tr>
              <td><strong style="color:#ef4444;">CronJob</strong></td>
              <td>Scheduled Job. Standard cron syntax. Creates a Job on schedule. Good for periodic batch tasks.</td>
              <td>Nightly backups, daily email digests, hourly cache warm-ups, weekly cleanup, log rotation</td>
            </tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">Deployment vs StatefulSet — Key Differences</div>
          <table class="nfr-table">
            <tr><td></td><td><strong>Deployment</strong></td><td><strong>StatefulSet</strong></td></tr>
            <tr><td>Pod names</td><td>Random suffix: api-7d9f4b-xkz2p</td><td>Ordered index: kafka-0, kafka-1, kafka-2</td></tr>
            <tr><td>Storage</td><td>Pods share a volume or each has ephemeral storage</td><td>Each pod gets its OWN PersistentVolumeClaim — survives pod deletion</td></tr>
            <tr><td>DNS</td><td>Shared service DNS: api-svc.default.svc.cluster.local</td><td>Stable per-pod DNS: kafka-0.kafka-svc.default.svc.cluster.local</td></tr>
            <tr><td>Scale down</td><td>Removes random pod</td><td>Removes highest-index pod first (kafka-2 before kafka-1)</td></tr>
            <tr><td>Use case</td><td>Stateless microservices</td><td>Databases, message brokers, any app that requires identity</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">DaemonSet Example</div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-logger
spec:
  selector:
    matchLabels: { app: fluentd }
  template:
    metadata:
      labels: { app: fluentd }
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v1.16
        volumeMounts:
        - name: varlog
          mountPath: /var/log           # reads all container logs
      volumes:
      - name: varlog
        hostPath: { path: /var/log }    # node's log directory</pre>
        </div>
        <div class="content-section">
          <div class="content-label">CronJob Example</div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: "0 2 * * *"          # 2am every night (standard cron)
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: backup-tool:v1
            env:
            - name: DB_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url</pre>
        </div>
      `
    },
    {
      name: 'Networking',
      content: `
        <div class="content-section">
          <div class="content-label">4 Service Types — One Diagram</div>
          <svg viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px;margin-bottom:16px;">
            <!-- Internet -->
            <rect x="10" y="10" width="100" height="40" rx="6" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>
            <text x="60" y="35" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e" font-family="sans-serif">Internet</text>
            <!-- LoadBalancer -->
            <rect x="160" y="10" width="160" height="40" rx="6" fill="#ef4444" opacity="0.15" stroke="#ef4444" stroke-width="1.5"/>
            <text x="240" y="27" text-anchor="middle" font-size="10" font-weight="700" fill="#ef4444" font-family="sans-serif">LoadBalancer Service</text>
            <text x="240" y="43" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Cloud LB (ELB, GCP LB)</text>
            <line x1="110" y1="30" x2="160" y2="30" stroke="#f59e0b" stroke-width="2" marker-end="url(#arr)"/>
            <!-- NodePort -->
            <rect x="160" y="70" width="160" height="40" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" stroke-width="1.5"/>
            <text x="240" y="87" text-anchor="middle" font-size="10" font-weight="700" fill="#6366f1" font-family="sans-serif">NodePort Service</text>
            <text x="240" y="103" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">NodeIP:30080 (dev/testing)</text>
            <line x1="110" y1="30" x2="160" y2="88" stroke="#6366f1" stroke-width="1" stroke-dasharray="4"/>
            <!-- Ingress -->
            <rect x="380" y="10" width="160" height="40" rx="6" fill="#10b981" opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
            <text x="460" y="27" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981" font-family="sans-serif">Ingress Controller</text>
            <text x="460" y="43" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">nginx, traefik, ALB</text>
            <line x1="320" y1="30" x2="380" y2="30" stroke="#10b981" stroke-width="2" marker-end="url(#arr2)"/>
            <!-- ClusterIP for api-svc -->
            <rect x="570" y="10" width="120" height="40" rx="6" fill="#326CE5" opacity="0.15" stroke="#326CE5" stroke-width="1.5"/>
            <text x="630" y="27" text-anchor="middle" font-size="10" font-weight="700" fill="#326CE5" font-family="sans-serif">ClusterIP (api-svc)</text>
            <text x="630" y="43" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Internal only</text>
            <line x1="540" y1="30" x2="570" y2="30" stroke="#326CE5" stroke-width="2"/>
            <!-- ClusterIP for db-svc -->
            <rect x="570" y="60" width="120" height="40" rx="6" fill="#326CE5" opacity="0.15" stroke="#326CE5" stroke-width="1.5"/>
            <text x="630" y="77" text-anchor="middle" font-size="10" font-weight="700" fill="#326CE5" font-family="sans-serif">ClusterIP (db-svc)</text>
            <text x="630" y="93" text-anchor="middle" font-size="9" fill="#666" font-family="sans-serif">Internal only</text>
            <line x1="540" y1="80" x2="570" y2="80" stroke="#326CE5" stroke-width="2"/>
            <!-- Routing rules box -->
            <rect x="10" y="140" width="680" height="150" rx="8" fill="#f8f8f8" stroke="#e0e0e0" stroke-width="1"/>
            <text x="24" y="162" font-size="11" font-weight="700" fill="#333" font-family="monospace">Ingress Routing Rules (one LoadBalancer, many services)</text>
            <text x="24" y="182" font-size="10" fill="#326CE5" font-family="monospace">api.example.com/v1/*   →  api-svc:80    (ClusterIP)</text>
            <text x="24" y="200" font-size="10" fill="#10b981" font-family="monospace">app.example.com        →  frontend-svc:80  (ClusterIP)</text>
            <text x="24" y="218" font-size="10" fill="#f59e0b" font-family="monospace">admin.example.com      →  admin-svc:80  (ClusterIP)</text>
            <text x="24" y="245" font-size="10" fill="#888" font-family="sans-serif">Without Ingress: each service needs its own LoadBalancer (expensive — $18+/mo per LB on AWS)</text>
            <text x="24" y="263" font-size="10" fill="#888" font-family="sans-serif">With Ingress: one $18/mo LB routes to all services by hostname/path via rules above</text>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f59e0b"/></marker>
              <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#10b981"/></marker>
            </defs>
          </svg>
        </div>
        <div class="content-section">
          <div class="content-label">Service Types — When to Use Each</div>
          <table class="nfr-table">
            <tr><td><strong style="color:#326CE5;">ClusterIP</strong> (default)</td><td>Internal-only. Pods can reach it; outside world cannot. Use for: DB, cache, internal microservices. Every service should be ClusterIP unless it explicitly needs external access.</td></tr>
            <tr><td><strong style="color:#6366f1;">NodePort</strong></td><td>Opens a port (30000–32767) on EVERY node. External traffic hits any NodeIP:Port. Simple but crude — exposes on all nodes, requires node IP to be known. Good for local dev/testing; not for production.</td></tr>
            <tr><td><strong style="color:#ef4444;">LoadBalancer</strong></td><td>Provisions a cloud load balancer (ELB, GCP LB). Each service gets its own public IP. Simple but expensive — one LB per service. Use for single-service exposure or non-HTTP (TCP/UDP) traffic.</td></tr>
            <tr><td><strong style="color:#10b981;">Ingress</strong></td><td>HTTP/HTTPS layer-7 routing. One LoadBalancer → routes to many ClusterIP services by hostname or path. Add SSL termination, auth middleware. Best choice for HTTP services in production.</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">CoreDNS — How Pods Find Each Other</div>
          <div class="insight-box">
            Every Service gets a DNS entry: <code>svc-name.namespace.svc.cluster.local</code><br>
            Pods in the same namespace can use just: <code>svc-name</code><br><br>
            Example: your API pod wants to connect to Postgres → just use <code>postgres-svc:5432</code> as the host. CoreDNS resolves it to the ClusterIP. No hardcoded IPs ever.
          </div>
        </div>
        <div class="content-section">
          <div class="content-label">NetworkPolicy — Pod-Level Firewall</div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-only-api
spec:
  podSelector:
    matchLabels: { app: postgres }       # applies to postgres pods
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels: { app: api }        # ONLY api pods can connect
    ports:
    - protocol: TCP
      port: 5432</pre>
          <div style="font-size:12px;color:#888;margin-top:6px;">Without NetworkPolicy: any pod in the cluster can connect to your DB. NetworkPolicy requires a CNI plugin that supports it (Calico, Cilium — not all CNIs do).</div>
        </div>
      `
    },
    {
      name: 'Scheduling, Resources & Scaling',
      content: `
        <div class="content-section">
          <div class="content-label">Resource Requests vs Limits — The Most Common Bug</div>
          <div class="insight-box" style="border-left-color:#ef4444;background:#fff5f5;">
            <strong>Request</strong> = what K8s reserves on the node for scheduling. Scheduler won't place a pod on a node that can't satisfy its requests.<br>
            <strong>Limit</strong> = the hard cap. Exceeding CPU → throttled (slower). Exceeding memory → OOMKilled (pod restarted).<br><br>
            <strong>Common mistake:</strong> Setting no limits → one noisy pod consumes all node resources → all pods on that node suffer.
          </div>
          <table class="nfr-table" style="margin-top:12px;">
            <tr><td><strong>CPU Requests</strong></td><td>In millicores. 100m = 0.1 CPU. 1000m = 1 full CPU core. Never set CPU limit in production — CPU throttling degrades latency, doesn't kill the pod.</td></tr>
            <tr><td><strong>Memory Requests</strong></td><td>In Mi/Gi. Always set both request AND limit. Memory is non-compressible — exceeding limit = OOMKill (pod restart).</td></tr>
            <tr><td><strong>Quality of Service</strong></td><td>Guaranteed (req=limit), Burstable (req&lt;limit), BestEffort (none). Under node pressure, BestEffort pods are killed first, then Burstable, Guaranteed last.</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">3 Autoscalers — Which Does What</div>
          <table class="nfr-table">
            <tr style="background:#f8f8f8;"><td style="font-weight:800;">Autoscaler</td><td style="font-weight:800;">Scales</td><td style="font-weight:800;">Metric</td><td style="font-weight:800;">Speed</td></tr>
            <tr>
              <td><strong style="color:#326CE5;">HPA</strong><br><span style="font-size:10px;">Horizontal Pod Autoscaler</span></td>
              <td>Number of pod replicas</td>
              <td>CPU%, memory%, custom (req/s, queue depth)</td>
              <td>Fast (30s poll)</td>
            </tr>
            <tr>
              <td><strong style="color:#10b981;">VPA</strong><br><span style="font-size:10px;">Vertical Pod Autoscaler</span></td>
              <td>CPU/memory requests per pod</td>
              <td>Historical resource usage</td>
              <td>Slow (requires pod restart)</td>
            </tr>
            <tr>
              <td><strong style="color:#f59e0b;">CA</strong><br><span style="font-size:10px;">Cluster Autoscaler</span></td>
              <td>Number of nodes in the cluster</td>
              <td>Pending pods that can't be scheduled</td>
              <td>Slow (1–3 min to provision)</td>
            </tr>
          </table>
          <div class="insight-box" style="margin-top:12px;">
            In production: use HPA + CA together. HPA adds pods → CA adds nodes if needed to schedule them. Don't use VPA with HPA on same metric (conflict). Use VPA for right-sizing, HPA for traffic-driven scaling.
          </div>
        </div>
        <div class="content-section">
          <div class="content-label">HPA Example</div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # scale up when avg CPU > 70%</pre>
        </div>
        <div class="content-section">
          <div class="content-label">Health Probes — Liveness, Readiness, Startup</div>
          <table class="nfr-table">
            <tr><td><strong style="color:#10b981;">Readiness Probe</strong></td><td>Fails → pod removed from Service endpoints (no traffic). Pod stays alive but gets no requests. Use for: app warming up, dependent service unavailable. Fix: only send traffic when actually ready.</td></tr>
            <tr><td><strong style="color:#ef4444;">Liveness Probe</strong></td><td>Fails → pod is restarted (kubelet kills it). Use for: deadlock detection, app stuck in bad state that won't self-recover. Caution: if liveness fails during startup → restart loop.</td></tr>
            <tr><td><strong style="color:#6366f1;">Startup Probe</strong></td><td>Active only during startup. While startup probe is running, liveness/readiness probes are disabled. Use for slow-starting apps (JVM, large ML models) to prevent premature liveness failures.</td></tr>
          </table>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;margin-top:10px;">livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3           # restart after 3 failures
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5
  failureThreshold: 2           # remove from LB after 2 failures</pre>
        </div>
        <div class="content-section">
          <div class="content-label">Taints, Tolerations & Affinity</div>
          <table class="nfr-table">
            <tr><td><strong>Taint</strong></td><td>Marks a node as "repel pods unless they tolerate this". e.g. <code>node-type=gpu:NoSchedule</code> prevents non-GPU pods from landing on expensive GPU nodes.</td></tr>
            <tr><td><strong>Toleration</strong></td><td>Pods declare "I can tolerate this taint". GPU workloads tolerate <code>node-type=gpu</code> and thus can run on GPU nodes.</td></tr>
            <tr><td><strong>Node Affinity</strong></td><td>Preference or requirement for which nodes a pod lands on. e.g. <code>preferredDuringScheduling: zone=us-east-1a</code> — spread across AZs for HA.</td></tr>
            <tr><td><strong>Pod Affinity</strong></td><td>Co-locate pods or spread them. <code>podAntiAffinity</code>: don't put two replicas on the same node — if the node dies, don't lose all replicas.</td></tr>
          </table>
        </div>
      `
    },
    {
      name: 'Deployment Strategies',
      content: `
        <div class="content-section">
          <div class="content-label">3 Strategies — Visual Comparison</div>
          <svg viewBox="0 0 700 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px;margin-bottom:16px;">
            <!-- Rolling Update -->
            <rect x="10" y="10" width="210" height="295" rx="10" fill="#f0fdf4" stroke="#10b981" stroke-width="1.5"/>
            <text x="115" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="#10b981" font-family="sans-serif">Rolling Update (Default)</text>
            <!-- t=0 -->
            <text x="24" y="55" font-size="9" fill="#888" font-family="monospace">t=0</text>
            <rect x="24" y="62" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="44" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="70" y="62" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="90" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="116" y="62" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="136" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <!-- t=1 -->
            <text x="24" y="100" font-size="9" fill="#888" font-family="monospace">t=1</text>
            <rect x="24" y="107" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="44" y="121" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="70" y="107" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="90" y="121" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="116" y="107" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="136" y="121" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <!-- t=2 -->
            <text x="24" y="144" font-size="9" fill="#888" font-family="monospace">t=2</text>
            <rect x="24" y="151" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="44" y="165" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="70" y="151" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="90" y="165" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="116" y="151" width="40" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="136" y="165" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <!-- t=3 -->
            <text x="24" y="188" font-size="9" fill="#888" font-family="monospace">t=3 done</text>
            <rect x="24" y="195" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="44" y="209" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="70" y="195" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="90" y="209" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="116" y="195" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="136" y="209" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <text x="115" y="248" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">Zero downtime. Serves mixed</text>
            <text x="115" y="262" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">v1+v2 traffic during update.</text>
            <text x="115" y="276" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">Rollback: kubectl rollout undo</text>
            <!-- Blue-Green -->
            <rect x="240" y="10" width="210" height="295" rx="10" fill="#eff6ff" stroke="#326CE5" stroke-width="1.5"/>
            <text x="345" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="#326CE5" font-family="sans-serif">Blue-Green</text>
            <text x="264" y="55" font-size="9" fill="#888" font-family="sans-serif">BLUE (live)</text>
            <rect x="264" y="62" width="40" height="20" rx="3" fill="#326CE5" opacity="0.8"/><text x="284" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="310" y="62" width="40" height="20" rx="3" fill="#326CE5" opacity="0.8"/><text x="330" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <text x="364" y="55" font-size="9" fill="#888" font-family="sans-serif">GREEN (idle)</text>
            <rect x="364" y="62" width="40" height="20" rx="3" fill="#e0e0e0" opacity="0.8"/><text x="384" y="76" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">v2</text>
            <rect x="410" y="62" width="30" height="20" rx="3" fill="#e0e0e0" opacity="0.8"/><text x="425" y="76" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">v2</text>
            <text x="345" y="110" text-anchor="middle" font-size="9" fill="#888" font-family="sans-serif">── deploy v2 to green, test ──</text>
            <text x="264" y="135" font-size="9" fill="#888" font-family="sans-serif">BLUE (draining)</text>
            <rect x="264" y="142" width="40" height="20" rx="3" fill="#326CE5" opacity="0.3"/><text x="284" y="156" text-anchor="middle" font-size="8" fill="#326CE5" font-family="sans-serif">v1</text>
            <rect x="310" y="142" width="40" height="20" rx="3" fill="#326CE5" opacity="0.3"/><text x="330" y="156" text-anchor="middle" font-size="8" fill="#326CE5" font-family="sans-serif">v1</text>
            <text x="364" y="135" font-size="9" fill="#10b981" font-family="sans-serif">GREEN (serving)</text>
            <rect x="364" y="142" width="40" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="384" y="156" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <rect x="410" y="142" width="30" height="20" rx="3" fill="#10b981" opacity="0.8"/><text x="425" y="156" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <text x="345" y="248" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">Instant switch. Instant rollback</text>
            <text x="345" y="262" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">(flip back to blue). Costs 2x</text>
            <text x="345" y="276" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">resources during transition.</text>
            <!-- Canary -->
            <rect x="470" y="10" width="220" height="295" rx="10" fill="#fef9ee" stroke="#f59e0b" stroke-width="1.5"/>
            <text x="580" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="#f59e0b" font-family="sans-serif">Canary</text>
            <text x="484" y="55" font-size="9" fill="#888" font-family="sans-serif">stable (95% traffic)</text>
            <rect x="484" y="62" width="32" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="500" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="522" y="62" width="32" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="538" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="560" y="62" width="32" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="576" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <rect x="598" y="62" width="32" height="20" rx="3" fill="#326CE5" opacity="0.7"/><text x="614" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v1</text>
            <text x="648" y="55" font-size="9" fill="#f59e0b" font-family="sans-serif">canary (5%)</text>
            <rect x="643" y="62" width="38" height="20" rx="3" fill="#f59e0b" opacity="0.8"/><text x="662" y="76" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">v2</text>
            <text x="580" y="248" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">5% real traffic → monitor error</text>
            <text x="580" y="262" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">rate + latency. If good: promote.</text>
            <text x="580" y="276" text-anchor="middle" font-size="9" fill="#555" font-family="sans-serif">If bad: delete canary instantly.</text>
          </svg>
        </div>
        <div class="content-section">
          <div class="content-label">Strategy Decision Guide</div>
          <table class="nfr-table">
            <tr><td><strong style="color:#10b981;">Rolling Update</strong></td><td>Default. No extra resources. App must handle mixed-version traffic (API backward compat). Best for most microservices. <code>maxSurge: 1, maxUnavailable: 0</code> = safest config.</td></tr>
            <tr><td><strong style="color:#326CE5;">Blue-Green</strong></td><td>When you need instant cutover and instant rollback. Database migrations that aren't backward compatible. Costs 2× infra during switchover. Good for major version changes.</td></tr>
            <tr><td><strong style="color:#f59e0b;">Canary</strong></td><td>Risk-averse for high-traffic services. Test with 5% real users before full rollout. Needs traffic splitting (Ingress or service mesh like Istio). Real-world: Netflix, Google, Airbnb all use canary by default.</td></tr>
          </table>
        </div>
        <div class="content-section">
          <div class="content-label">Essential Rollout Commands</div>
          <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;"># Trigger a rolling update (change image)
kubectl set image deployment/api-server api=myapp:v2.1

# Check rollout status (real-time)
kubectl rollout status deployment/api-server

# Instant rollback to previous version
kubectl rollout undo deployment/api-server

# Rollback to specific version
kubectl rollout undo deployment/api-server --to-revision=3

# Pause a rollout (pin at partial state)
kubectl rollout pause deployment/api-server

# Resume paused rollout
kubectl rollout resume deployment/api-server</pre>
        </div>
      `
    },
  ]
};

comingSoonSystems.forEach(id => {
  systems[id] = {
    name: placeholderNames[id],
    sub: placeholderSubs[id],
    steps: [
      { name: 'Functional Requirements',    content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'Non-Functional Requirements',content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'Capacity Estimation',        content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'High Level Design (HLD)',    content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'Data Modeling',              content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'Deep Dive',                  content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
      { name: 'Bottlenecks & Trade-offs',   content: '<div class="coming-soon"><span>🔜</span>Content coming soon.</div>' },
    ]
  };
});

// ── SYSTEM EXTRAS (API · Interview · Scaling · DB Comparison · Security) ──
