export const systemExtras = {

  reddit: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /r/{sub}/posts</code></td><td>Create a post. Body: {title, body, type}. Returns post_id. Requires auth token.</td></tr>
        <tr><td><code>GET /r/{sub}/feed?sort=hot&after=cursor</code></td><td>Paginated feed. Returns array of post objects with score, author, comment_count. Cursor-based pagination.</td></tr>
        <tr><td><code>POST /posts/{id}/vote</code></td><td>Body: {direction: 1 | -1 | 0}. Idempotent — calling twice with same direction is a no-op. Redis atomic increment.</td></tr>
        <tr><td><code>GET /posts/{id}/comments?sort=top</code></td><td>Returns nested comment tree. sort=top|new|controversial. Depth-limited to prevent huge payloads.</td></tr>
      </table>
      <div class="insight-box">All write endpoints require a JWT in the Authorization header. Feed endpoints are unauthenticated — anonymous browsing is core to Reddit's growth.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Fan-out strategy</strong> — do you pre-compute feeds (fan-out on write) or build on read? Interviewers want to hear: pre-compute for most users, pull-on-read for hot subreddits. Not one or the other.</li>
        <li><strong>Vote counting at scale</strong> — naive approach hits DB on every vote. Strong answer: Redis INCR per post, periodic sync to Postgres. Explain eventual consistency is acceptable for counts.</li>
        <li><strong>Hot subreddit problem</strong> — r/AskReddit has 42M members. Pre-computing feeds for all of them is impossible. Answer: don't fan-out for large subs; pull on read + aggressive caching.</li>
      </ul>
      <div class="content-label" style="margin-top:16px;">Common mistakes</div>
      <ul class="req-list">
        <li><strong>Over-normalising</strong> — treating votes as rows in a SQL table. Doesn't scale past millions of votes. Redis is the answer.</li>
        <li><strong>Forgetting read replicas</strong> — Reddit is 99% reads. A single Postgres primary won't survive. Mention read replicas + connection pooling early.</li>
      </ul>
      <div class="insight-box">Differentiator: mention that Reddit actually moved to a <strong>hybrid fan-out</strong> — fan-out on write for users with &lt;10K followers, fan-out on read for hot content. This shows you know real-world trade-offs, not just textbook patterns.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 10K users</strong><br><span style="color:#888;font-size:11px;">Single server</span></td><td>One Python/Go app + one Postgres DB. No cache. Deploy on a single EC2 instance. Bottleneck: DB reads. Fix: add a read replica when CPU &gt; 70%.</td></tr>
        <tr><td><strong>Stage 2 — 1M users</strong><br><span style="color:#888;font-size:11px;">Cache + CDN</span></td><td>Add Redis for vote counts and hot feeds. Add CDN for static assets and images. Separate the feed service from the post service. Add Elasticsearch for search. DB sharded by subreddit_id.</td></tr>
        <tr><td><strong>Stage 3 — 100M+ users</strong><br><span style="color:#888;font-size:11px;">Microservices + Kafka</span></td><td>Vote events → Kafka → async score updater. Feed service pre-computes top-1000 subreddit feeds every 5 min. Per-region deployments. Cassandra for activity feeds. Separate media pipeline with S3 + CDN.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>PostgreSQL for posts/comments</strong><br><span style="color:#888;font-size:11px;">vs MongoDB</span></td><td>Comments are a tree structure with parent_id foreign keys — relational fits naturally. ACID transactions prevent partial writes (post created but subreddit counter not updated). MongoDB's lack of joins makes comment tree queries painful.</td></tr>
        <tr><td><strong>Redis for vote counts</strong><br><span style="color:#888;font-size:11px;">vs Postgres counter</span></td><td>Redis INCR is O(1) and atomic — handles 100K votes/sec without locks. Postgres UPDATE on a counter row causes lock contention at scale. Redis trades durability (AOF sync) for throughput.</td></tr>
        <tr><td><strong>Elasticsearch for search/feed ranking</strong><br><span style="color:#888;font-size:11px;">vs Postgres full-text</span></td><td>Elasticsearch handles fuzzy search, relevance ranking, and aggregations natively. Postgres full-text search degrades past 10M posts. Elasticsearch scales horizontally; Postgres requires vertical scaling for search.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Auth</strong> — JWT tokens (short-lived, 15 min) + refresh tokens (stored in HttpOnly cookie, 30 days). Never store JWT in localStorage — XSS vulnerable. Refresh token rotation on each use.</li>
        <li><strong>Vote manipulation</strong> — rate limit: max 10 votes/min per user per subreddit. IP-based rate limiting at API gateway for unauthenticated requests. Detect vote rings (accounts created same day voting together) via ML anomaly detection.</li>
        <li><strong>Content safety</strong> — posts and comments run through spam classifier before display. Images scanned with PhotoDNA for CSAM. User reports queue for moderator review.</li>
        <li><strong>HTTPS everywhere</strong> — TLS 1.3 minimum. HSTS headers. CSP headers to prevent XSS. All API responses include X-Content-Type-Options: nosniff.</li>
      </ul>
    ` },
  ],

  twitter: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /tweets</code></td><td>Body: {text, media_ids[], reply_to_id?}. Returns tweet object with snowflake ID. Rate limited: 300 tweets/3hr per user.</td></tr>
        <tr><td><code>GET /timeline?cursor={id}&limit=20</code></td><td>Returns pre-built timeline from Redis sorted set. Cursor = last seen tweet ID (Snowflake, so chronologically ordered). No offset pagination — too slow at scale.</td></tr>
        <tr><td><code>POST /follow/{user_id}</code></td><td>Adds edge to social graph. Triggers async fan-out job for follower's timeline. Returns 200 immediately; fan-out happens in background.</td></tr>
        <tr><td><code>GET /users/{id}/tweets?cursor=...</code></td><td>User's own tweets, sharded by user_id in Postgres. Direct DB read — no fan-out needed.</td></tr>
      </table>
      <div class="insight-box">Snowflake IDs encode timestamp in the top 41 bits — sorted by ID = sorted by time. This makes cursor-based pagination trivially correct without a separate timestamp column.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>The celebrity problem</strong> — Beyoncé has 30M followers. Fan-out on write for her tweet = 30M Redis writes in seconds. The answer: hybrid. Fan-out on write for regular users (&lt;1M followers). Fan-out on read for celebrities — fetch their latest tweets at read time and merge into timeline.</li>
        <li><strong>Timeline consistency</strong> — is it OK if a tweet appears 2 seconds late? Yes. Twitter is AP for reads. Explain why: availability of the homepage matters more than the tweet appearing at the exact millisecond.</li>
        <li><strong>Sharding strategy</strong> — tweet data sharded by user_id using consistent hashing. Explain why tweet_id would be a bad shard key (hot shards for popular users).</li>
      </ul>
      <div class="content-label" style="margin-top:16px;">Common mistakes</div>
      <ul class="req-list">
        <li><strong>Fan-out on write for everyone</strong> — fails for celebrities. Always mention the hybrid approach.</li>
        <li><strong>Offset-based pagination</strong> — GET /timeline?page=5&limit=20 is O(n) in the DB. Use cursor (tweet ID) based pagination from the start.</li>
      </ul>
      <div class="insight-box">Differentiator: mention <strong>Snowflake ID generation</strong> — Twitter open-sourced this. IDs encode datacenter + machine + timestamp + sequence. Globally unique, sortable, generated without a central counter.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 100K users</strong></td><td>Single Rails app + MySQL + no cache. Timeline built by querying follows table on every request. Bottleneck: JOIN query for timeline. Fix: denormalize into a timeline table.</td></tr>
        <tr><td><strong>Stage 2 — 10M users</strong></td><td>Separate Tweet Service + Timeline Service. Redis sorted set per user for pre-built timelines. Fan-out on write via background workers. MySQL sharded by user_id. Add CDN for media.</td></tr>
        <tr><td><strong>Stage 3 — 500M+ DAU</strong></td><td>Hybrid fan-out (celebrity flag on user). Kafka for async fan-out events. Flock (Twitter's social graph service) in RAM. Gizzard for DB sharding automation. Per-region deployments. FlockDB for social graph.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Redis sorted set for timelines</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Timeline is a sorted list of tweet IDs (by time/score). Redis ZADD/ZRANGE is O(log N) — sub-millisecond for 1000-item timeline. Cassandra needs careful partition key design to avoid hot partitions and doesn't support efficient range queries on scores.</td></tr>
        <tr><td><strong>PostgreSQL (sharded) for tweets</strong><br><span style="color:#888;font-size:11px;">vs DynamoDB</span></td><td>Tweets need ACID — a tweet must be fully saved or not at all. Sharded Postgres gives ACID within a shard. DynamoDB works but transactions are expensive and limited to 25 items.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>OAuth 2.0</strong> — Twitter uses OAuth 2.0 PKCE for third-party apps. Never share passwords with apps. Access tokens scoped (read-only vs read-write).</li>
        <li><strong>Rate limiting</strong> — per-user: 300 tweets/3hr. Per-IP (unauthenticated): 15 timeline reads/15min. Enforced at API gateway with Redis sliding window.</li>
        <li><strong>Spam / bot detection</strong> — new accounts limited to 10 follows/day. ML model scores each tweet for spam probability. Coordinated inauthentic behaviour detected via graph analysis (accounts created together, same IP, similar tweet timing).</li>
        <li><strong>Media safety</strong> — uploaded images/videos scanned for CSAM (PhotoDNA hash matching) before being served. Videos transcoded in isolated sandboxed environments.</li>
      </ul>
    ` },
  ],

  bluesky: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints (AT Protocol)</div>
      <table class="nfr-table">
        <tr><td><code>POST /xrpc/com.atproto.repo.createRecord</code></td><td>Create a post, like, or follow. Body: {repo: DID, collection: "app.bsky.feed.post", record: {...}}. Returns URI + CID (content hash).</td></tr>
        <tr><td><code>GET /xrpc/app.bsky.feed.getTimeline</code></td><td>Returns home feed from your chosen Feed Generator. Cursor-based. Feed Generators are external services — Bluesky calls them, not you directly.</td></tr>
        <tr><td><code>GET /xrpc/com.atproto.repo.listRecords</code></td><td>List all records of a type for a DID. Public — anyone can crawl any user's posts. This is the open data model.</td></tr>
      </table>
      <div class="insight-box">Every write is to your own PDS (Personal Data Server). The AT Protocol signs each record with your private key — no centralised server can forge your posts.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>The federation model</strong> — explain PDS (where your data lives) vs Relay (crawls all PDSes) vs AppView (builds the UI). Bluesky the company runs one AppView, but anyone can run another.</li>
        <li><strong>DID-based identity</strong> — your identity is a DID (Decentralised Identifier), not a username on a server. If your PDS shuts down, you port your DID to a new one. Data portability is the core innovation.</li>
        <li><strong>Algorithmic choice</strong> — users can choose their Feed Generator (algorithm). This decouples the algorithm from the platform — anyone can write a feed algorithm.</li>
      </ul>
      <div class="insight-box">Differentiator: contrast with ActivityPub (Mastodon). AT Protocol uses a global crawl model (Relay sees everything) vs ActivityPub's federated push model. Global crawl enables global search and cross-instance interactions more easily.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — invite-only beta</strong></td><td>Single PDS + single AppView + single Relay. Centralised but AT-Protocol compliant. Establish protocol, not scale.</td></tr>
        <tr><td><strong>Stage 2 — open registration</strong></td><td>Independent PDS hosting emerges. Relay scales horizontally — sharded by DID prefix. AppView adds read replicas. Federation becomes real.</td></tr>
        <tr><td><strong>Stage 3 — ecosystem</strong></td><td>Multiple competing AppViews. Multiple Relays. PDS hosting services. Algorithm marketplace. Bluesky becomes one node in a global network, not the centre.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>SQLite per PDS</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Each PDS is a single-user (or small-group) server. SQLite is embedded, zero config, perfectly sufficient for &lt;10K users on one PDS. Postgres overhead is unjustified at this scale. The AT Protocol intentionally allows tiny self-hosted PDSes.</td></tr>
        <tr><td><strong>ScyllaDB at AppView scale</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>The AppView aggregates billions of records from the Relay. ScyllaDB (C++ Cassandra-compatible) gives same AP semantics with 10x lower latency. Justified at global feed scale.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Signed records</strong> — every post is signed with your private key and includes a CID (content hash). Any modification breaks the signature. Tamper-evident by design.</li>
        <li><strong>DID rotation</strong> — if your private key is compromised, you can rotate it. The DID document on the DID PLC directory is updated — old key is revoked. Attackers with old key can't forge new posts.</li>
        <li><strong>Labellers (moderation)</strong> — instead of centralised moderation, Bluesky uses Labellers — services that apply labels (e.g., "spam", "adult content") to content. Users choose which labellers to trust. Decentralised moderation.</li>
      </ul>
    ` },
  ],

  youtube: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /videos/upload</code></td><td>Multipart/resumable upload. Returns upload_id. Client uploads chunks to upload server. On completion, triggers async transcoding pipeline.</td></tr>
        <tr><td><code>GET /videos/{id}/manifest.m3u8</code></td><td>Returns HLS manifest listing all quality levels (360p, 720p, 1080p, 4K) as separate segment URLs. Player picks quality based on bandwidth (ABR).</td></tr>
        <tr><td><code>GET /videos/{id}/segments/{quality}/{seg}.ts</code></td><td>Individual 2-second video segment. Served from CDN edge — never hits origin on cache hit. Signed URL to prevent hotlinking.</td></tr>
        <tr><td><code>POST /videos/{id}/views</code></td><td>Async view counter increment. Batched — client sends after 30s watch time. Eventually consistent; Kafka → ClickHouse for analytics.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Transcoding pipeline</strong> — uploaded video must become 8+ quality levels. Answer: distributed transcoding workers (Borg/Kubernetes jobs), each worker handles one quality/codec. Parallelised — 1080p and 360p transcode simultaneously. Output chunks go directly to CDN origin.</li>
        <li><strong>ABR streaming</strong> — adaptive bitrate. Client switches quality mid-stream based on bandwidth. HLS/DASH manifests list all qualities. Player never re-buffers if it drops quality in time.</li>
        <li><strong>Cold video problem</strong> — a new video has no CDN cache. First viewer hits origin. Solution: pre-warm CDN for trending/scheduled content. Accept cache miss for truly new content.</li>
      </ul>
      <div class="insight-box">Differentiator: YouTube uses <strong>Maglev</strong> (Google's load balancer) + <strong>Spanner</strong> for video metadata. Mentioning that ABR requires the manifest to be cached separately from segments shows depth.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single upload server + ffmpeg on same machine + S3 for storage. One quality level. Bottleneck: transcoding blocks uploads.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Separate upload service from transcoding workers. Worker pool scales independently. Multiple quality outputs. CDN added. MySQL for metadata.</td></tr>
        <tr><td><strong>Stage 3</strong></td><td>Distributed transcoding (Borg jobs). Bigtable for video chunks. Spanner for metadata. Per-region CDN PoPs. Real-time view counting via Kafka + ClickHouse. ML recommendation engine trained offline, served in real time.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Bigtable for video chunks</strong><br><span style="color:#888;font-size:11px;">vs S3</span></td><td>Video segments need sub-10ms reads — Bigtable is a low-latency key-value store optimised for large values. S3 has ~50–200ms first-byte latency — too slow for video segments that need to start streaming immediately. CDN caches both, but origin matters for cache misses.</td></tr>
        <tr><td><strong>MySQL/Spanner for metadata</strong><br><span style="color:#888;font-size:11px;">vs DynamoDB</span></td><td>Video metadata (title, description, tags, channel) needs SQL joins and full-text search. Spanner gives globally consistent SQL. DynamoDB is great for key-value but weak for complex queries without secondary indices.</td></tr>
        <tr><td><strong>ClickHouse for analytics</strong><br><span style="color:#888;font-size:11px;">vs BigQuery</span></td><td>View counts and watch time need real-time analytical queries. ClickHouse is a columnar OLAP DB with sub-second queries on billions of rows. BigQuery is batch-oriented (seconds to minutes per query) — not suitable for real-time dashboards.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>DRM</strong> — Google's Widevine for Android/Chrome, Apple FairPlay for Safari/iOS, Microsoft PlayReady for Edge. Video segments encrypted at rest; decryption key fetched from licence server only after auth. Prevents downloading paid content.</li>
        <li><strong>Signed segment URLs</strong> — each segment URL includes an HMAC signature + expiry. Prevents hotlinking (embedding YouTube segments on other sites). Signature verified at CDN edge without hitting origin.</li>
        <li><strong>Content ID</strong> — uploaded videos hashed and compared against a database of copyrighted content fingerprints. Match → video blocked or revenue shared with rights holder. Runs within minutes of upload.</li>
        <li><strong>Upload sandboxing</strong> — video files are untrusted binary data. Transcoding workers run in isolated containers with no network access. Malformed files crash the worker, not the system.</li>
      </ul>
    ` },
  ],

  spotify: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /tracks/{id}/stream-url</code></td><td>Returns a pre-signed CDN URL valid for 60 seconds. Client fetches audio directly from CDN. Server never proxies audio bytes — avoids bottleneck.</td></tr>
        <tr><td><code>PUT /player/play</code></td><td>Body: {track_id, position_ms, device_id}. Updates playback state in Redis. Syncs across devices via WebSocket push. Returns 204.</td></tr>
        <tr><td><code>POST /playlists/{id}/tracks</code></td><td>Add tracks to playlist. Body: {uris: ["spotify:track:xxx"], position: 3}. Writes to PostgreSQL. Returns snapshot_id for collaborative playlist conflict detection.</td></tr>
        <tr><td><code>GET /recommendations?seed_tracks={ids}&limit=20</code></td><td>ML-powered recommendations. Calls internal recommendation service. Cached per user per session. Falls back to editorial playlist on model failure.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Pre-signed URL strategy</strong> — never proxy 320kbps audio through your app servers. Generate a short-lived signed URL (60s), send to client, client streams directly from CDN. Server is just URL vending machine.</li>
        <li><strong>Cross-device sync</strong> — user pauses on phone, resumes on laptop. State in Redis: {user_id → {track, position_ms, device, playing}}. Device polls or subscribes via WebSocket. Eventual consistency is fine — 1s sync lag is invisible.</li>
        <li><strong>Discover Weekly</strong> — batch ML job runs every Sunday. Collaborative filtering + NLP on playlist names. Pre-computes recommendations for all ~600M users. Stored in Cassandra. Served from cache — never computed on request.</li>
      </ul>
      <div class="insight-box">Differentiator: Spotify uses <strong>Apache Beam</strong> for the Discover Weekly pipeline and stores audio fingerprints for content-based filtering. Mentioning that recommendations are pre-computed offline (not real-time inference) shows you understand latency constraints.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 1M users</strong></td><td>Single Rails app. Audio files on S3. No CDN. Recommendation = editorial playlists. Postgres for everything. Bottleneck: audio delivery from S3 to users in distant regions.</td></tr>
        <tr><td><strong>Stage 2 — 50M users</strong></td><td>CDN for audio (Fastly/Akamai). Pre-signed URLs. Separate audio transcoding pipeline (multiple bitrates: 96/160/320 kbps). Split metadata service from streaming service. Redis for playback state.</td></tr>
        <tr><td><strong>Stage 3 — 600M+ users</strong></td><td>Global CDN PoPs. Cassandra for play history (billions of rows). Weekly Beam ML jobs for Discover Weekly. Kubernetes microservices. Per-market content licensing enforcement. Podcast pipeline separate from music.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Cassandra for play history</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Play history = billions of append-only rows (user_id, track_id, played_at, duration). Cassandra partition key = user_id; clustering key = played_at. O(1) writes, efficient time-range reads. Postgres would require table partitioning and can't scale writes horizontally without sharding complexity.</td></tr>
        <tr><td><strong>PostgreSQL for playlists/metadata</strong><br><span style="color:#888;font-size:11px;">vs MongoDB</span></td><td>Playlist order matters and needs transactional updates (reorder, collaborative edit with snapshot_id). ACID transactions in Postgres prevent two users reordering simultaneously and corrupting the list. MongoDB multi-document transactions are available but more complex.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>DRM for premium audio</strong> — Widevine (Android) and FairPlay (iOS) for protected content. Pre-signed URLs have 60s TTL — sharing the URL is useless after expiry.</li>
        <li><strong>OAuth 2.0 PKCE</strong> — third-party apps (Spotify SDKs) use PKCE flow. Access tokens expire in 1 hour; refresh tokens are rotated. Scopes: streaming, playlist-modify, user-read-email.</li>
        <li><strong>Geo-restriction</strong> — music licences are per-territory. CDN checks user's IP against licenced territories before serving content. VPN detection layer flags suspicious geo mismatches.</li>
        <li><strong>Pre-signed URL security</strong> — URL includes: track_id + user_id + expiry + HMAC(secret). CDN validates HMAC before serving. Prevents one user sharing another user's stream URL.</li>
      </ul>
    ` },
  ],

  netflix: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /recommendations?user_id={id}&surface=homepage</code></td><td>Returns pre-computed recommendation rows (e.g., "Because you watched Inception"). Served from Redis cache. Falls back to popularity-based if cache miss.</td></tr>
        <tr><td><code>GET /content/{id}/manifest</code></td><td>Returns DASH/HLS manifest with CDN URLs for each quality tier. Includes DRM licence URL. Client's player uses ABR to switch quality every ~2 seconds.</td></tr>
        <tr><td><code>POST /playback/events</code></td><td>Client streams playback telemetry: {position, quality, buffer_health, timestamp}. Used for ABR algorithm tuning and content popularity signals. Async — never blocks playback.</td></tr>
        <tr><td><code>POST /ratings</code></td><td>Body: {content_id, thumbs: up|down}. Feeds into next ML training batch. Not real-time — ratings processed in nightly batch.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Two-tower model</strong> — candidate generation (ANN search over embedding space) + ranking (gradient boosted trees on 100s of features). Don't just say "ML" — explain the two-stage pipeline and why.</li>
        <li><strong>Offline vs online</strong> — embeddings trained offline (weekly Spark job on watch history). But context features (time of day, device, what just finished) injected at serve time. This hybrid approach is the key insight.</li>
        <li><strong>Cold start</strong> — new user has no history. Fallback: onboarding questions (3 genre picks), demographic collaborative filtering, popular in their region. New content: content-based features (genre, cast, director) until watched enough.</li>
      </ul>
      <div class="insight-box">Differentiator: Netflix's <strong>Open Connect</strong> CDN — Netflix ships physical servers to ISPs and places them in ISP data centres. Most Netflix traffic never leaves the ISP's network. This is a huge cost and latency win that general CDNs can't match.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>DVD-era: no streaming. Single monolith. Oracle DB. When streaming launched: single video server + S3 + simple popularity rankings.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>AWS migration. Microservices (Chaos Monkey era). CDN via Akamai. Cassandra for watch history. First ML recommendations (matrix factorisation).</td></tr>
        <tr><td><strong>Stage 3 — 300M subscribers</strong></td><td>Open Connect CDN (ISP-embedded servers). Two-tower ML served by Flink (real-time features). Iceberg + Spark for batch training. Hundreds of microservices. Hystrix for circuit breaking. Per-region active-active.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Cassandra for watch history</strong><br><span style="color:#888;font-size:11px;">vs MySQL</span></td><td>Watch history = time-series append-only. Partition by user_id, cluster by watched_at. 300M users × 100s of titles = billions of rows. Cassandra scales writes linearly by adding nodes. MySQL would require complex sharding to reach this scale.</td></tr>
        <tr><td><strong>Redis for pre-computed recs</strong><br><span style="color:#888;font-size:11px;">vs Memcached</span></td><td>Recommendations are computed offline and stored as lists. Redis lists/hashes with TTL fit perfectly. Redis persistence means recommendations survive a Redis restart. Memcached has no persistence — all recs lost on restart.</td></tr>
        <tr><td><strong>Vector DB (Faiss) for ANN search</strong><br><span style="color:#888;font-size:11px;">vs brute force</span></td><td>User embedding vs 100M content embeddings. Brute force = O(100M) per request. Faiss HNSW index = O(log N) approximate nearest neighbour. 10ms vs 10 seconds. Approximate is fine — "slightly wrong" recommendations are still good recommendations.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>DRM</strong> — Widevine L1 (hardware-backed, highest protection) for 4K. Widevine L3 (software) for HD. FairPlay for Apple devices. Licence server validates subscription status before issuing decryption keys.</li>
        <li><strong>Signed CDN URLs</strong> — content URLs include user_id + content_id + expiry + HMAC. Prevents URL sharing. CDN validates without hitting origin.</li>
        <li><strong>Account sharing controls</strong> — device fingerprinting + IP geolocation to detect simultaneous streams from different households. Introduced household verification in 2023.</li>
        <li><strong>Zero-trust microservices</strong> — inter-service calls authenticated via mutual TLS (mTLS). Each service has an identity cert. No service trusts another just because it's inside the VPC.</li>
      </ul>
    ` },
  ],

  twitch: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /streams/ingest</code></td><td>Broadcaster's OBS pushes RTMP stream to nearest ingest server. Not a REST endpoint — RTMP protocol. Server validates stream key then starts transcoding pipeline.</td></tr>
        <tr><td><code>GET /streams/{channel}/manifest.m3u8</code></td><td>HLS manifest for viewer. Returns URLs for 160p/360p/480p/720p/1080p/source quality. CDN-cached. Viewer's player starts with highest affordable quality.</td></tr>
        <tr><td><code>WS wss://irc.chat.twitch.tv</code></td><td>IRC-over-WebSocket for chat. Send: PRIVMSG #channel :hello. Receive: all chat messages for channel. Rate limited: 20 messages/30sec for normal users.</td></tr>
        <tr><td><code>POST /channels/{id}/subscriptions</code></td><td>Subscribe to channel. Triggers WebSocket push to broadcaster dashboard. Subscriber data persisted in PostgreSQL.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>RTMP ingest → HLS transcode pipeline</strong> — broadcaster pushes RTMP (low latency, TCP). Server transcodes to HLS (HTTP, CDN-friendly) in multiple qualities. The protocol switch (RTMP→HLS) is the key architectural decision. Newer: RTMP→WebRTC for sub-1s latency.</li>
        <li><strong>Chat at scale</strong> — popular streams have 100K+ viewers typing simultaneously. Chat handled via IRC-over-WebSocket, pub/sub per channel. Redis pub/sub routes messages to connection servers. Don't try to fanout via HTTP.</li>
        <li><strong>VOD storage</strong> — live stream segments saved to S3 as they're generated. Viewer can seek back in a live stream. After stream ends, segments concatenated into VOD. Same CDN serves live and VOD.</li>
      </ul>
      <div class="insight-box">Differentiator: Twitch moved from HLS (10s+ latency) to <strong>Low-Latency HLS (LLHLS)</strong> — 2–5 second latency. LLHLS uses smaller segments (0.5s) and HTTP/2 push. For truly interactive streams, WebRTC gives &lt;1s but doesn't scale to millions of viewers without a media server mesh.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single ingest server + ffmpeg transcoding on same box + S3 storage + Cloudfront CDN. Works for hundreds of concurrent viewers.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Regional ingest servers (reduces latency for broadcasters). Separate transcoding cluster (GPU instances). Chat via Redis pub/sub. HLS segments served via CDN. VOD via S3.</td></tr>
        <tr><td><strong>Stage 3 — 2.5M concurrent viewers</strong></td><td>Multi-region active ingest. Transcoding farm with auto-scaling GPU nodes. CDN with 100+ PoPs. Chat: per-channel Redis clusters with Kafka for persistence. Clip generation via async Lambda. ML-powered recommendations for "You might also like".</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Redis pub/sub for chat</strong><br><span style="color:#888;font-size:11px;">vs Kafka</span></td><td>Chat messages are ephemeral — you don't need to replay chat from 6 months ago. Redis pub/sub is simpler and lower latency for ephemeral message fan-out. Kafka is better for durable event logs (used for VOD analytics), not live chat.</td></tr>
        <tr><td><strong>PostgreSQL for subscriptions</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Subscriptions have relational structure (user, channel, tier, renewal_date). Transaction safety matters — double charging on renewal is catastrophic. Postgres ACID guarantees prevent this. Cassandra's eventual consistency is wrong for financial records.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Stream key security</strong> — stream key = RTMP password. If leaked, anyone can stream to your channel. Twitch allows one-click reset. Never expose in client-side code.</li>
        <li><strong>Chat rate limiting</strong> — normal users: 20 messages/30s. Verified users: 100/30s. Bots/API: token bucket. Channel mods can enable "slow mode" (1 message per N seconds per user).</li>
        <li><strong>Content moderation</strong> — live video moderation via ML (AutoMod): analyses audio transcription + visual frame sampling for ToS violations. Flagged streams reviewed by human moderators within minutes.</li>
        <li><strong>DMCA protection</strong> — audio fingerprinting on VODs detects copyrighted music. Mutes or removes segments automatically. Live streams are harder — DMCA notices processed after the fact.</li>
      </ul>
    ` },
  ],

  slack: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /channels/{id}/messages</code></td><td>Send a message. Body: {text, blocks[], thread_ts?}. Returns message with ts (timestamp = unique ID). Rate limited: 1 message/sec per channel via Slack API; internal limit is higher.</td></tr>
        <tr><td><code>GET /channels/{id}/messages?oldest={ts}&limit=100</code></td><td>Fetch message history. Cursor-based via ts. Returns oldest→newest within range. Used on channel load and when catching up after disconnect.</td></tr>
        <tr><td><code>WS wss://wss-primary.slack.com</code></td><td>Real-time events: new messages, reactions, presence updates, typing indicators. One WebSocket per Slack client. Server pushes events; client acks with envelope_id.</td></tr>
        <tr><td><code>POST /reactions</code></td><td>Body: {channel, timestamp, name: "thumbsup"}. Adds emoji reaction. Broadcasts via WebSocket to all channel members online.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>WebSocket connection management</strong> — one WS per client × millions of clients. Each connection server (Go or Erlang) handles tens of thousands of WS connections. Mention sticky load balancing — a client reconnects to the same server to restore subscription state.</li>
        <li><strong>Message ordering</strong> — messages in a channel must appear in order. Slack uses per-channel sequence numbers. MySQL auto-increment within a channel shard gives total ordering without distributed locks.</li>
        <li><strong>Large workspace problem</strong> — a Slack workspace with 50K members. A message in #general must be pushed to 50K WebSocket connections. Fanout via pub/sub, not N individual writes.</li>
      </ul>
      <div class="insight-box">Differentiator: Slack stores messages in <strong>MySQL sharded by workspace_id</strong>, not a NoSQL DB. The reasoning: workspace-scoped queries rarely need cross-shard joins. MySQL's ACID guarantees message ordering integrity better than Cassandra's eventual consistency.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>PHP monolith + MySQL + long-polling (no WebSockets). Works for thousands of users. Bottleneck: long-polling hammers DB with SELECT queries every 30s.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>WebSockets via Go connection servers. Redis pub/sub for message fan-out. MySQL sharded by workspace_id. Separate search service (Elasticsearch). Presence service in Redis.</td></tr>
        <tr><td><strong>Stage 3 — 20M+ DAU</strong></td><td>Per-workspace message partitions. Kafka for durable event log. Vitess for MySQL horizontal scaling. Channel message counts in Redis for sidebar badge numbers. S3 for file storage. Dedicated Calls infrastructure (via Slack Calls, powered by Agora).</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>MySQL for messages</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Messages have a total order within a channel. MySQL auto-increment + transactions enforce this without distributed coordination. Cassandra's eventual consistency can reorder concurrent writes — unacceptable for chat. Sharding by workspace_id contains the scale.</td></tr>
        <tr><td><strong>Redis for presence</strong><br><span style="color:#888;font-size:11px;">vs DB-backed</span></td><td>Online/offline status changes every few seconds per user. Redis SET with TTL handles this at sub-millisecond latency. Writing presence to MySQL would create a write hotspot. Redis pub/sub propagates presence changes to connection servers instantly.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Workspace isolation</strong> — all data (messages, users, channels) is scoped to a workspace_id. SQL queries always include workspace_id in WHERE clause. Enforced at ORM level — no cross-workspace data leakage possible without a bug.</li>
        <li><strong>Enterprise Key Management (EKM)</strong> — enterprise customers can bring their own KMS key. Slack encrypts all message data with a key derived from the customer's KMS. Slack cannot decrypt customer messages without the customer's key.</li>
        <li><strong>OAuth 2.0 for bots/apps</strong> — Slack apps use OAuth scopes (channels:read, chat:write). Apps can't access DMs unless explicitly granted. Token scopes validated on every API call.</li>
        <li><strong>DLP (Data Loss Prevention)</strong> — enterprise tier scans messages for credit card numbers, SSNs, API keys using regex + ML. Alerts admin; optionally blocks message posting.</li>
      </ul>
    ` },
  ],

  whatsapp: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints (WhatsApp Business API — public surface)</div>
      <table class="nfr-table">
        <tr><td><code>POST /messages</code></td><td>Send a message. Body: {to: "+1234567890", type: "text", text: {body: "Hello"}}. Returns message_id. Internal: client → Connection Server via WebSocket/XMPP, not REST.</td></tr>
        <tr><td><code>PUT /messages/{id}/status</code></td><td>Delivery/read receipt callback (webhook). Body: {status: "delivered"|"read", timestamp}. Your server receives this — WhatsApp calls you. Not a call you make.</td></tr>
        <tr><td><code>POST /media</code></td><td>Upload media. Returns media_id. Reference in message body. Media stored encrypted on WhatsApp servers for 30 days.</td></tr>
      </table>
      <div class="insight-box">The actual consumer WhatsApp uses XMPP-over-WebSocket (not REST) for real-time messaging. The Business API wraps this in REST for easier third-party integration. Consumer clients speak a custom binary protocol on top of XMPP.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Store-and-forward vs real-time</strong> — if Bob is online, route directly via WebSocket. If offline, store in Cassandra with 30-day TTL. The key point: messages are deleted from server after delivery. Server = routing layer, not storage.</li>
        <li><strong>Group message fan-out</strong> — 1024 members. Server stores ONE encrypted ciphertext (with shared group key). All 1024 members fetch it — O(1) server writes vs O(N). The sender's device only sends once to server.</li>
        <li><strong>Erlang choice</strong> — explain: Erlang BEAM creates one lightweight process (~300 bytes) per connection. 2M connections = 600MB RAM. Java threads = ~1MB each → 2M threads = 2TB RAM. WhatsApp's entire scale advantage came from Erlang.</li>
      </ul>
      <div class="insight-box">Differentiator: WhatsApp was acquired for $19B with 450M users and only 50 engineers. The Erlang architecture made this possible. Mention the "let it crash" philosophy — if a process fails, it restarts in milliseconds. No defensive error handling needed.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 1M users</strong></td><td>Erlang-based XMPP server + Mnesia (Erlang in-memory DB) for presence. Simple message queue. FreeBSD for better socket performance. Single data centre.</td></tr>
        <tr><td><strong>Stage 2 — 200M users</strong></td><td>Multiple Erlang connection clusters. Cassandra for offline message queue. MySQL for account data. Media on S3. Push notifications via APNs/FCM for truly offline users (device not connected).</td></tr>
        <tr><td><strong>Stage 3 — 2B users</strong></td><td>Global data centres. Region-local connection servers with cross-region routing. Multi-device support (up to 4 linked devices). E2E encrypted backups. Business API layer. Voice/video via separate WebRTC infrastructure.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Cassandra for message queue</strong><br><span style="color:#888;font-size:11px;">vs MySQL</span></td><td>Message queue is append-only, partition by recipient_id, TTL-based expiry. Cassandra handles this natively: write once, read on reconnect, Cassandra's TTL auto-deletes. MySQL would need complex expiry jobs and doesn't scale writes for 100B messages/day without heavy sharding.</td></tr>
        <tr><td><strong>MySQL for user accounts</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Phone number → account is a simple key lookup but needs strong consistency — you can't have two accounts for the same phone number. MySQL CP semantics prevent this. Cassandra AP semantics could allow duplicate accounts in a partition event.</td></tr>
        <tr><td><strong>Mnesia/in-memory for presence</strong><br><span style="color:#888;font-size:11px;">vs Redis</span></td><td>Presence (online/offline) is read millions of times per second by the routing layer. Erlang's Mnesia is distributed in-memory, co-located with the connection servers — no network hop. Redis requires a separate network call (~1ms). At WhatsApp's scale, that 1ms matters.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Signal Protocol (Double Ratchet)</strong> — every message encrypted with a session key that changes per message. Forward secrecy: compromising today's key doesn't expose past messages. Key ratchets forward, old keys deleted.</li>
        <li><strong>Key transparency</strong> — WhatsApp recently published an auditable key directory. Users can verify their contact's public key hasn't been swapped (MITM via compromised key server). "Safety numbers" in-app show key fingerprint.</li>
        <li><strong>Metadata privacy</strong> — WhatsApp sees: who you talk to, when, how often, message size. Not content. In 2021 controversy, WhatsApp updated ToS to share metadata with Facebook for ad targeting. Content remains private.</li>
        <li><strong>Backup encryption</strong> — end-to-end encrypted backups (2021). Key derived from a 64-digit code or stored in a hardware security module on WhatsApp's servers — your choice. Google/Apple cannot decrypt the backup.</li>
      </ul>
    ` },
  ],

  googledocs: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /documents/{id}/operations</code></td><td>Submit an OT (Operational Transformation) operation. Body: {ops: [{type: "insert", pos: 42, text: "hello"}], revision: 17}. Server applies, broadcasts transformed op to all collaborators via WebSocket.</td></tr>
        <tr><td><code>GET /documents/{id}</code></td><td>Full document snapshot at latest revision. Used on initial load. Returns: {content, revision, collaborators[]}. Cached in Memcache; invalidated on each operation.</td></tr>
        <tr><td><code>POST /documents/{id}/cursors</code></td><td>Update cursor position (for showing collaborator positions). Body: {position, color}. Not persisted — ephemeral, broadcast only to current collaborators.</td></tr>
        <tr><td><code>POST /documents</code></td><td>Create new document. Returns doc_id. Initialises empty operation log in Bigtable.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>OT vs CRDT</strong> — Operational Transformation (Google Docs) vs Conflict-free Replicated Data Types (Figma, many modern tools). OT needs a central server to order operations — simpler for text but needs server. CRDT works P2P but more complex. Google Docs uses OT with a central revision counter.</li>
        <li><strong>Revision number</strong> — every operation includes the revision it was based on. Server transforms incoming operations against concurrent operations to produce the correct final state. The revision number is the synchronisation primitive.</li>
        <li><strong>Offline editing</strong> — user goes offline, makes edits, reconnects. Operations buffered locally. On reconnect, buffered ops sent with the last known revision. Server transforms them against all ops that happened while offline.</li>
      </ul>
      <div class="insight-box">Differentiator: mention that Google Docs stores the full <strong>operation log</strong> (not just the current document) — this enables version history, undo across sessions, and real-time collaboration audit trails. The document is a fold over the operation log.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single OT server per document + WebSocket connections + Postgres for operation log. Works for thousands of docs with few collaborators.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Separate document service from auth service. Bigtable for operation log (row key = doc_id + revision). Memcache for document snapshots. Pub/sub for broadcasting to collaborators.</td></tr>
        <tr><td><strong>Stage 3 — billions of docs</strong></td><td>Spanner for document metadata (globally consistent). Bigtable for operation logs. One stateful OT process per active document (in-memory state). Stateless web tier + session affinity for active collaboration. Periodic snapshot compression of operation log.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Bigtable for operation log</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Operation log = append-only time-series per document. Bigtable row key: doc_id + revision (lexicographic scan gives history in order). Billions of operations across billions of docs. Postgres would need partitioning by doc_id and struggles at this write volume.</td></tr>
        <tr><td><strong>Spanner for metadata</strong><br><span style="color:#888;font-size:11px;">vs Bigtable</span></td><td>Document metadata (owner, title, sharing settings, folder) needs SQL joins and ACID transactions. Spanner provides globally-consistent SQL. Bigtable is a key-value store — no joins, no transactions across rows.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Per-document ACLs</strong> — every document has an ACL: owner, editors, commenters, viewers. Checked on every API call at the document service layer. Sharing via link generates a capability token embedded in the URL.</li>
        <li><strong>Capability URLs</strong> — "Share link" contains a long random token (e.g., /document/d/{60-char-id}/edit). Guessing this is computationally infeasible. Token embeds the permission level (view/edit).</li>
        <li><strong>Audit log</strong> — every edit records who made it and when (the operation log is inherently an audit trail). Google Workspace Admin can see document access history.</li>
        <li><strong>Data residency</strong> — enterprise customers can pin data to a specific Google Cloud region. Operations and storage routed to that region only. Meets GDPR data residency requirements.</li>
      </ul>
    ` },
  ],

  airbnb: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /listings?lat=19.07&lng=72.87&checkin=2024-12-20&checkout=2024-12-25&guests=2</code></td><td>Geo + date search. Hits Elasticsearch (geo_distance filter + availability filter). Returns paginated listing summaries. Cached for popular queries.</td></tr>
        <tr><td><code>GET /listings/{id}/availability?month=2024-12</code></td><td>Returns calendar of available/blocked dates. Read from PostgreSQL availability table. Cached in Redis with 30s TTL.</td></tr>
        <tr><td><code>POST /bookings</code></td><td>Body: {listing_id, checkin, checkout, guests}. Runs in a DB transaction with SELECT FOR UPDATE on the listing's availability rows. Returns booking_id or 409 if unavailable.</td></tr>
        <tr><td><code>DELETE /bookings/{id}</code></td><td>Cancel booking. Triggers refund via Saga pattern. Releases availability rows. Notifies host via push notification.</td></tr>
      </table>
      <div class="insight-box">Search and booking use completely different databases. Search is AP (Elasticsearch, slightly stale). Booking is CP (PostgreSQL, pessimistic lock). This split is the core architectural insight of Airbnb.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Double booking prevention</strong> — two users book the same listing same dates simultaneously. Answer: PostgreSQL SELECT FOR UPDATE on the availability rows. Second transaction waits, then sees rows locked, returns 409. Redis SET NX not suitable here — need date-range overlap check, not a single key.</li>
        <li><strong>Geo search</strong> — "show listings near Mumbai". Elasticsearch geo_distance query + date availability filter. Don't try to do geo in Postgres — PostGIS works but Elasticsearch scales better for read-heavy search.</li>
        <li><strong>Availability calendar</strong> — listing has a calendar of available dates. Model as rows: (listing_id, date, status). Overlap check: SELECT WHERE date BETWEEN checkin AND checkout AND status = 'available'. If count = expected nights → available.</li>
      </ul>
      <div class="insight-box">Differentiator: Airbnb uses <strong>CQRS</strong> — writes go to PostgreSQL (CP), reads go to Elasticsearch (AP). The ES index is updated asynchronously via Kafka when a booking is made. A listing may show as available for ~5 seconds after being booked. That's acceptable.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 1K listings</strong></td><td>Single Rails app + PostgreSQL. Search = SQL LIKE query on city name. No geo. Bottleneck: search is too slow as listings grow.</td></tr>
        <tr><td><strong>Stage 2 — 1M listings</strong></td><td>Add Elasticsearch for search (geo + text). PostgreSQL for bookings. Redis cache for availability calendars. S3 + CDN for listing photos. Separate booking service from listing service.</td></tr>
        <tr><td><strong>Stage 3 — 7M+ listings</strong></td><td>Kafka for CQRS sync (Postgres → Elasticsearch). Microservices: Search, Booking, Payments, Messaging, Reviews. Multi-region active-active for read traffic. Payments via Stripe with Saga orchestration for failure handling. ML for pricing suggestions.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Elasticsearch for search</strong><br><span style="color:#888;font-size:11px;">vs PostGIS</span></td><td>Elasticsearch handles geo_distance queries, full-text search on listing descriptions, faceted filters (price range, amenities), and relevance ranking in one query. PostGIS handles geo well but combining with full-text and faceted search requires complex query plans. ES scales horizontally; PostGIS requires vertical scaling.</td></tr>
        <tr><td><strong>PostgreSQL for bookings</strong><br><span style="color:#888;font-size:11px;">vs DynamoDB</span></td><td>Booking requires a multi-row transaction (check availability + insert booking + deduct dates). PostgreSQL ACID transactions handle this atomically. DynamoDB transactions are limited to 25 items and more expensive. A failed transaction in DynamoDB leaves cleanup to the application; Postgres rollbacks automatically.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Identity verification</strong> — hosts and guests must verify government ID before booking high-value stays. ID images uploaded to S3, verified via third-party OCR + liveness check. Fraud score computed per user.</li>
        <li><strong>Payment security</strong> — PCI-DSS compliant. Card data never touches Airbnb servers — tokenised via Stripe/Braintree at client. Airbnb stores only the payment token. Payouts to hosts via bank transfer with delayed release (24h after guest check-in).</li>
        <li><strong>Photo URL signing</strong> — listing photos are signed S3 URLs with expiry. Prevents hotlinking and ensures only authenticated sessions can view photos.</li>
        <li><strong>Rate limiting</strong> — search API: 100 req/min per IP. Booking API: 10 req/min per user. Prevents scraping of listing availability and spam bookings.</li>
      </ul>
    ` },
  ],

  tinder: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /deck</code></td><td>Returns pre-fetched batch of 20 profiles. Server pre-computes the deck asynchronously. Client never waits for matching algorithm — deck is always ready. Refreshed when &lt;5 cards remain.</td></tr>
        <tr><td><code>POST /swipe/{user_id}</code></td><td>Body: {direction: "like"|"pass"}. Writes to swipe table. If mutual like → creates match → sends push notification to both. Returns {match: bool, match_id?}.</td></tr>
        <tr><td><code>GET /matches</code></td><td>Returns list of mutual matches with last message preview. Sorted by most recently active. Paginated.</td></tr>
        <tr><td><code>POST /matches/{id}/messages</code></td><td>Send message to a match. Body: {text}. WebSocket push to recipient. Stored in Cassandra. Only possible after mutual match — prevents cold messaging.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Pre-computed deck</strong> — never run the matching algorithm on-demand per swipe. Pre-compute each user's deck asynchronously. Deck refreshed in background when low. Swipe response is a simple DB write + check for mutual like — not a ranking query.</li>
        <li><strong>Geo indexing</strong> — "show profiles within 10km". Geohash: encode lat/lng as a string prefix. Profiles in nearby geohash cells are candidates. Then filter by age/gender preferences. Don't do a radius query on every swipe.</li>
        <li><strong>Swipe rate limiting</strong> — free users: 100 swipes/day. Prevents bots from mass-liking. Enforced in Redis counter with daily reset.</li>
      </ul>
      <div class="insight-box">Differentiator: Tinder uses an <strong>ELO-like score</strong> (called "Elo" internally, now evolved to a "Swiped Right" score) to rank profiles. More desirable profiles are shown to more desirable users. Mentioning this scoring mechanism separates strong answers.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single server + MySQL. Geo search via SQL LIKE on city name. Simple age filter. No pre-computation. Bottleneck: profile query is slow as users grow.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Geohash-based indexing in Redis. Pre-computed deck stored in Redis per user. Swipe stored in MySQL. Separate match service. Photos on S3 + CDN.</td></tr>
        <tr><td><strong>Stage 3 — 75M+ users</strong></td><td>Deck pre-computation via ML ranking (Spark batch + real-time features). Cassandra for swipe history (billions of rows). Geohash sharded Redis clusters. Per-city sharding for matching. Global presence in 190 countries with regional deployments.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Cassandra for swipes</strong><br><span style="color:#888;font-size:11px;">vs MySQL</span></td><td>75M users × 100 swipes/day = 7.5B swipe rows/day. Append-only, partition by user_id. Cassandra handles this write volume linearly. MySQL would need extreme sharding and still struggle with write throughput at this scale.</td></tr>
        <tr><td><strong>Redis for deck + geo</strong><br><span style="color:#888;font-size:11px;">vs Elasticsearch</span></td><td>Deck is a pre-computed ordered list per user — Redis list is perfect. Geo candidates via geohash prefix scan — Redis SCAN with pattern matching. ES works but is heavier. For Tinder's read-heavy, low-latency deck fetch, Redis sub-millisecond beats ES's ~5ms.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Location fuzzing</strong> — Tinder shows distance ("3km away") but not exact location. Internally stores exact coordinates but rounds display to nearest km. Prevents triangulation attacks (request from 3 positions to pinpoint exact location).</li>
        <li><strong>Photo verification</strong> — optional selfie verification: user takes a selfie matching a pose prompt. ML compares selfie to profile photos. Verified badge shown. Reduces catfishing.</li>
        <li><strong>Block and report</strong> — blocked users can't see each other's profiles. Reports trigger ML classifier + human review queue. Repeated violations lead to ban.</li>
        <li><strong>Anti-bot</strong> — new accounts limited to 50 swipes/day. Phone number verification required. ML detects bot patterns (swipe speed, like-all behaviour).</li>
      </ul>
    ` },
  ],

  payment: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /payments</code></td><td>Body: {amount, currency, source_id, idempotency_key}. <strong>idempotency_key</strong> is client-generated UUID — retrying with same key returns the original result, never double-charges. Returns {payment_id, status: pending|success|failed}.</td></tr>
        <tr><td><code>GET /payments/{id}</code></td><td>Poll payment status. Use webhooks in production — don't poll. Returns final status once processor responds.</td></tr>
        <tr><td><code>POST /payments/{id}/refund</code></td><td>Body: {amount?} — partial refund supported. Creates a new ledger entry (debit to merchant, credit to customer). Never modifies original payment row.</td></tr>
        <tr><td><code>POST /webhooks/processor</code></td><td>Stripe/Adyen calls your server with payment outcome. Verify HMAC signature. Update payment status. Idempotent — processor may retry.</td></tr>
      </table>
      <div class="insight-box">The idempotency_key is the most important field. Network failures mean clients must retry. Without idempotency, retries cause double charges. With it, the server checks if that key was already processed and returns the cached result.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Idempotency</strong> — network fails after charge but before response. Client retries. Must not charge twice. Answer: client generates UUID idempotency_key. Server stores (idempotency_key → payment_id) in DB. On retry, return stored result. This is the most critical payment system concept.</li>
        <li><strong>ACID transactions</strong> — debit sender + credit receiver must be atomic. If the DB crashes between the two updates, neither should happen. PostgreSQL transaction: BEGIN → debit → credit → COMMIT. Cassandra's eventual consistency is wrong for money.</li>
        <li><strong>Saga pattern for failures</strong> — multi-step payment (reserve funds → charge card → credit merchant → notify). If step 3 fails, run compensating transactions to reverse steps 1 and 2. Saga replaces distributed transactions across services.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>double-entry bookkeeping</strong> — every financial event creates two ledger entries (debit one account, credit another). Total debits always equal total credits. Makes the system auditable and detects bugs via balance sheet reconciliation.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single PostgreSQL DB. Direct Stripe API calls. No queue. Synchronous webhook processing. Bottleneck: webhook handler is synchronous — slow processor responses block threads.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Async webhook processing via job queue (Sidekiq/SQS). Idempotency keys in Redis for fast dedup. Separate ledger service. Read replicas for reporting queries.</td></tr>
        <tr><td><strong>Stage 3 — billions of transactions</strong></td><td>Partitioned ledger by account_id. Kafka for event sourcing (every payment event → immutable log). CQRS: writes to event log, read model rebuilt from events. Multi-currency via dedicated FX service. Regulatory reporting via ClickHouse OLAP.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>PostgreSQL for transactions</strong><br><span style="color:#888;font-size:11px;">vs any NoSQL</span></td><td>Money requires ACID. No NoSQL database provides the same level of transaction safety as PostgreSQL. DynamoDB transactions exist but cover max 25 items. Cassandra has no multi-row transactions. For a payment ledger, PostgreSQL's ACID is non-negotiable.</td></tr>
        <tr><td><strong>Redis for idempotency keys</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Idempotency key lookup must be sub-millisecond — it's on the hot path of every payment request. Redis GET is O(1) at &lt;1ms. PostgreSQL index lookup is ~5ms. At 10K payments/sec, 5ms adds 50 seconds of latency per second of throughput.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>PCI-DSS compliance</strong> — never store raw card numbers. Tokenise at client via Stripe.js/Braintree SDK — card data never touches your servers. Store only the payment token. PCI scope is dramatically reduced.</li>
        <li><strong>Webhook signature verification</strong> — Stripe signs every webhook with HMAC-SHA256. Verify signature before processing. Prevents fraudulent webhook injections (attacker POSTing fake "payment_succeeded" events).</li>
        <li><strong>3D Secure (3DS)</strong> — for high-risk transactions, trigger 3DS challenge (bank sends OTP to customer). Shifts fraud liability to the issuing bank. Adds friction but reduces chargebacks.</li>
        <li><strong>HSM for encryption keys</strong> — sensitive keys (signing keys, encryption keys) stored in Hardware Security Modules. Keys never leave the HSM in plaintext. Operations performed inside HSM.</li>
      </ul>
    ` },
  ],

  stockexchange: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /orders</code></td><td>Body: {symbol, side: buy|sell, type: limit|market, quantity, price?}. Returns order_id with status PENDING. Order enters matching engine queue. Never blocks waiting for fill.</td></tr>
        <tr><td><code>DELETE /orders/{id}</code></td><td>Cancel a pending order. Matching engine removes from order book. Returns 409 if already filled. Must be idempotent.</td></tr>
        <tr><td><code>GET /orderbook/{symbol}</code></td><td>Returns current bids and asks (top 10 levels). Read from in-memory order book snapshot. Updated every 100ms. Never hits DB — DB is for durability, not serving.</td></tr>
        <tr><td><code>WS /market-data/{symbol}</code></td><td>Real-time price feed. Server pushes trade executions, best bid/ask updates. Low-latency: co-located clients use UDP multicast, not WebSocket.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Price-time priority</strong> — orders matched by best price first; at same price, earliest order wins (FIFO). The order book is a sorted data structure: bids sorted descending by price, asks ascending. A buy order matches the lowest ask ≤ its limit price.</li>
        <li><strong>Matching engine is single-threaded</strong> — no locks, no concurrency in the matching engine. One thread processes the order queue sequentially. This gives deterministic ordering without distributed coordination. Speed comes from in-memory data structures, not parallelism.</li>
        <li><strong>Durability vs latency</strong> — write-ahead log: every order written to disk before matching. On crash, replay WAL to restore order book state. Latency: WAL write adds ~50μs. Worth it for correctness.</li>
      </ul>
      <div class="insight-box">Differentiator: real exchanges (NASDAQ, LSE) use <strong>FPGA-based matching engines</strong> for sub-microsecond latency. Co-location: HFT firms rent rack space inside the exchange to eliminate network latency. Mentioning these shows awareness of the real-world system.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single matching engine process. PostgreSQL for order persistence. Simple REST API. Works for one instrument with hundreds of orders/sec.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Separate matching engine per symbol (parallelism via process isolation). Write-ahead log for durability. Redis for real-time order book snapshots. WebSocket for market data.</td></tr>
        <tr><td><strong>Stage 3</strong></td><td>FPGA or kernel-bypass networking (DPDK) for microsecond latency. UDP multicast for market data (one packet reaches all subscribers). Kafka for trade event log. Separate risk engine validates orders before matching. Co-location service for HFT clients.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>In-memory order book</strong><br><span style="color:#888;font-size:11px;">vs any DB</span></td><td>Matching must happen in microseconds. Any disk-based DB (even Redis) introduces network + I/O latency. The order book lives in RAM as a sorted data structure (price-level map). DB is only for durability via WAL — never on the matching hot path.</td></tr>
        <tr><td><strong>PostgreSQL for trade records</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Trade records are financial ledger entries — require ACID. Regulatory requirements mandate that every trade is recorded exactly once, durably. PostgreSQL with WAL guarantees this. Cassandra's eventual consistency risks duplicate or missing trade records.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Order authentication</strong> — every order signed with client's private key (HMAC-SHA256). Exchange verifies before accepting. Prevents order injection from unauthorized parties.</li>
        <li><strong>Risk checks</strong> — pre-trade risk engine validates: order size within limits, account has sufficient funds, symbol is not halted. Rejects invalid orders before they reach matching engine.</li>
        <li><strong>Circuit breakers</strong> — if a symbol moves &gt;10% in 5 minutes, trading halted automatically. Prevents flash crashes (e.g., 2010 Flash Crash). Requires human review to resume.</li>
        <li><strong>Regulatory audit trail</strong> — every order, modification, cancellation, and trade logged immutably with microsecond timestamp. Required by SEC/MiFID II for market surveillance.</li>
      </ul>
    ` },
  ],

  bookmyshow: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /events/{id}/seats</code></td><td>Returns seat map with status: available|held|booked. Reads Redis for active holds, PostgreSQL for booked seats. Merges in-memory. Cached for 5s — seat map can be slightly stale.</td></tr>
        <tr><td><code>POST /seats/hold</code></td><td>Body: {seat_ids: ["A7","A8"], event_id}. Runs Redis SET NX for each seat_id atomically. Returns hold_token valid for 10 minutes. All-or-nothing: if any seat fails, release all.</td></tr>
        <tr><td><code>POST /bookings</code></td><td>Body: {hold_token, payment_method_id}. Verifies hold still valid in Redis → charges payment → PostgreSQL transaction (SELECT FOR UPDATE → UPDATE status=BOOKED → INSERT booking) → DEL Redis hold. Returns booking_id + QR code URL.</td></tr>
        <tr><td><code>GET /bookings/{id}/ticket</code></td><td>Returns QR code image (signed URL to S3). QR encodes: booking_id + event_id + HMAC. Venue scanner verifies HMAC to prevent fake tickets.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Two-phase lock</strong> — Redis SET NX is the first gate (fast, atomic, ~1ms). PostgreSQL SELECT FOR UPDATE is the second gate (slow, durable, ~10ms). Two gates because Redis alone isn't durable — a Redis crash loses hold state. Postgres alone can't handle 100K concurrent requests without crashing.</li>
        <li><strong>Waiting room for popular events</strong> — Coldplay tickets drop at 10am. 500K users hit "Book Now" simultaneously. Without a queue, PostgreSQL gets DDoSed. Answer: Redis sorted set as virtual waiting room. Admit N users per second. Others see queue position.</li>
        <li><strong>All-or-nothing seat hold</strong> — user selects 2 seats. Must hold both or neither. Use Redis MULTI/EXEC transaction: SET NX both seats atomically. If one fails, DISCARD and release the other.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>lazy cleanup</strong> — when Redis TTL expires (seat hold abandoned), the PostgreSQL row still says HELD. Every seat read query includes <code>WHERE expires_at &gt; NOW()</code> — expired rows treated as available without needing an UPDATE. A cron job reconciles every 5 minutes for audit purposes only.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single server + PostgreSQL with SELECT FOR UPDATE. Works for hundreds of concurrent bookings. Bottleneck: lock contention during popular events.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Redis SET NX as first gate (reduces DB lock pressure by 99%). Separate Inventory Service + Booking Service. CDN for seat map images. PostgreSQL read replicas for event browsing.</td></tr>
        <tr><td><strong>Stage 3 — Coldplay scale</strong></td><td>Virtual waiting room via Redis sorted set. Kafka for booking events (analytics, notifications). Elasticsearch for event discovery. Per-event Redis cluster for extremely high-demand events. QR code generation as separate async service.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Redis for seat holds</strong><br><span style="color:#888;font-size:11px;">vs Memcached</span></td><td>Redis: atomic SET NX + EX in one command, Lua scripting for multi-seat atomic hold, persistence (RDB/AOF) survives restart, TTL natively supported. Memcached: no atomic test-and-set, no Lua, no TTL on individual keys, no persistence. Redis wins decisively for this use case.</td></tr>
        <tr><td><strong>PostgreSQL for bookings</strong><br><span style="color:#888;font-size:11px;">vs MongoDB</span></td><td>Booking requires: check seat available + mark held + create booking + charge payment — all atomic. PostgreSQL ACID transaction handles this. MongoDB multi-document transactions are available but slower and more complex. Financial data needs the strongest consistency guarantees.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>QR code signing</strong> — QR encodes {booking_id + event_id + HMAC(secret)}. Venue scanner verifies HMAC before admitting. Prevents fake tickets generated with a valid booking_id but no HMAC.</li>
        <li><strong>Hold token</strong> — hold_token is a random UUID returned on seat hold. Required to proceed to payment. Prevents bypassing the hold step and booking without a valid hold.</li>
        <li><strong>Bot prevention</strong> — rate limit: 1 seat hold request per user per event per 30s. CAPTCHA on high-demand events. Device fingerprinting to detect ticket scalping bots.</li>
        <li><strong>Payment security</strong> — PCI-DSS: card data tokenised at client. hold_token + payment_token submitted together. Server verifies hold is still valid (Redis key exists) before charging.</li>
      </ul>
    ` },
  ],

  s3: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>PUT /buckets/{bucket}/objects/{key}</code></td><td>Upload object. Body = raw bytes. Content-Type header determines MIME type. Returns ETag (MD5 of content). Idempotent — PUT same key again overwrites.</td></tr>
        <tr><td><code>GET /buckets/{bucket}/objects/{key}</code></td><td>Download object. Supports Range header for partial download (byte-range requests). Returns object bytes + metadata headers. CDN-cacheable via Cache-Control.</td></tr>
        <tr><td><code>POST /buckets/{bucket}/objects/{key}?uploads</code></td><td>Initiate multipart upload. Returns upload_id. Client uploads parts (min 5MB each) in parallel. Complete with list of part ETags. S3 assembles atomically.</td></tr>
        <tr><td><code>DELETE /buckets/{bucket}/objects/{key}</code></td><td>Delete object. If versioning enabled, creates a delete marker — object recoverable. If not versioned, permanent deletion after delay.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Consistent hashing for routing</strong> — 100 trillion objects across thousands of storage nodes. Route GET/PUT by consistent_hash(bucket+key) → storage node. Adding a new node only moves 1/N of keys. No rehashing of all objects.</li>
        <li><strong>Erasure coding for durability</strong> — don't store 3 full replicas (300% storage overhead). Instead: Reed-Solomon erasure coding — split object into N data chunks + M parity chunks. Any N chunks reconstruct the original. Store chunks on different nodes/racks. 11 nines durability at ~50% overhead.</li>
        <li><strong>Metadata vs data separation</strong> — S3 stores metadata (key, size, ETag, ACL) separately from data bytes. Metadata in a fast key-value store (DynamoDB-like). Data in distributed blob storage. Listing objects = metadata lookup only, no data read.</li>
      </ul>
      <div class="insight-box">Differentiator: AWS S3 achieved <strong>strong read-after-write consistency</strong> in December 2020 (previously eventually consistent). Explain how: metadata writes use Paxos consensus — once the write returns 200, any subsequent read from any node returns the new data.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single storage server + filesystem. Objects stored as files. MySQL for metadata. Simple PUT/GET. Bottleneck: single server disk fills up.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Consistent hash ring across 10 storage nodes. 3-way replication for durability. Separate metadata cluster. CDN in front for popular objects.</td></tr>
        <tr><td><strong>Stage 3 — 100 trillion objects</strong></td><td>Erasure coding (Reed-Solomon). Multiple storage tiers (S3 Standard, Infrequent Access, Glacier). Automated lifecycle policies (move old objects to cheaper tier). Per-region active-active. Versioning via metadata chain. Event notifications via SNS/SQS on object operations.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Custom blob store for data</strong><br><span style="color:#888;font-size:11px;">vs HDFS</span></td><td>HDFS (Hadoop) is optimised for sequential large-file reads (MapReduce). S3's workload is random access to arbitrary object sizes. S3's custom storage engine optimises for both small (1KB config files) and large (10GB video) objects. HDFS has high metadata overhead for small files.</td></tr>
        <tr><td><strong>DynamoDB for metadata</strong><br><span style="color:#888;font-size:11px;">vs MySQL</span></td><td>Metadata lookups are simple key-value (bucket+key → metadata). DynamoDB provides single-digit millisecond reads at any scale without sharding complexity. MySQL at 100 trillion objects would require thousands of shards and complex routing logic.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>IAM + bucket policies</strong> — every S3 request authenticated via AWS Signature V4 (HMAC-SHA256 of request). Bucket policy defines who can read/write. ACLs per object. Principle of least privilege — default deny everything.</li>
        <li><strong>Pre-signed URLs</strong> — generate a time-limited URL (1hr) for a specific object. Share with unauthenticated users. URL encodes credentials + expiry in signature. CDN serves these without S3 credentials.</li>
        <li><strong>Server-side encryption (SSE)</strong> — SSE-S3 (AWS manages keys), SSE-KMS (customer-managed keys in KMS), SSE-C (customer provides key per request). Data encrypted at rest on S3 storage nodes.</li>
        <li><strong>VPC endpoints</strong> — traffic between EC2 and S3 routes through AWS backbone, not public internet. Prevents data exfiltration via public IP. Block public bucket access at the account level to prevent accidental exposure.</li>
      </ul>
    ` },
  ],

  lambda: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>PUT /functions/{name}</code></td><td>Deploy function. Body: {runtime, handler, code: {zip_base64}, memory_mb, timeout_sec, env_vars}. Creates new version. Returns ARN.</td></tr>
        <tr><td><code>POST /functions/{name}/invoke</code></td><td>Invoke function synchronously. Body = event payload (any JSON). Returns function's return value. Header X-Amz-Invocation-Type: Event for async (fire-and-forget).</td></tr>
        <tr><td><code>POST /functions/{name}/event-source-mappings</code></td><td>Configure trigger: {event_source_arn: "arn:aws:sqs:...", batch_size: 10}. Lambda polls SQS/Kinesis and invokes function with batches. Managed by Lambda service.</td></tr>
        <tr><td><code>GET /functions/{name}/logs</code></td><td>Retrieve CloudWatch log stream for function invocations. Each invocation writes START, execution logs, END, REPORT (duration, memory used, billed duration).</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Cold start</strong> — first invocation: download code (50–500ms) + init runtime (100ms–2s for JVM) + run init code. Warm: reuse existing execution environment (~1ms overhead). Mitigation: provisioned concurrency (keep N environments warm), smaller packages, avoid JVM runtimes for latency-sensitive functions.</li>
        <li><strong>Execution environment reuse</strong> — Lambda reuses containers between invocations (same instance). DB connections initialised outside the handler function persist across invocations. Global variables persist. But: don't rely on this — Lambda may create a new container at any time.</li>
        <li><strong>Concurrency model</strong> — each concurrent invocation = one execution environment. 1000 simultaneous requests = 1000 containers. Account-level concurrency limit (default 1000). Burst limit: 500–3000 new containers/minute depending on region.</li>
      </ul>
      <div class="insight-box">Differentiator: Lambda uses <strong>Firecracker</strong> microVMs (open-sourced by AWS) — ultra-lightweight VMs that boot in &lt;125ms and use &lt;5MB memory overhead. Each Lambda execution environment is a Firecracker VM, giving strong isolation without the overhead of full VMs.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>EC2 server running cron jobs and API handlers. Scaling = resize the instance. Pain: paying for idle time, manual scaling.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Move event handlers to Lambda (S3 triggers, SQS consumers, API Gateway routes). Keep long-running services on EC2/ECS. Lambda scales to zero — no idle cost.</td></tr>
        <tr><td><strong>Stage 3</strong></td><td>Full serverless: API Gateway + Lambda + DynamoDB. Step Functions for multi-step workflows. Provisioned concurrency for latency-sensitive paths. Lambda@Edge for CDN-side logic. EventBridge for event routing between services.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>DynamoDB with Lambda</strong><br><span style="color:#888;font-size:11px;">vs RDS</span></td><td>Lambda has no persistent connections — each cold start opens a new DB connection. RDS connection pools are sized for a fixed number of servers. 1000 concurrent Lambdas = 1000 connections → RDS connection pool exhausted. DynamoDB uses HTTP (no persistent connections) — scales to any number of concurrent Lambdas. RDS Proxy helps but adds latency.</td></tr>
        <tr><td><strong>S3 for state between invocations</strong><br><span style="color:#888;font-size:11px;">vs EFS</span></td><td>Lambda execution environments are stateless. Large files (ML models, reference data) fetched from S3 on cold start and cached in /tmp (512MB–10GB). EFS gives persistent shared filesystem but adds latency and cost. S3 is the idiomatic Lambda state store.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>IAM execution role</strong> — each Lambda function has an IAM role defining what AWS services it can call. Principle of least privilege: a function that reads S3 should only have s3:GetObject on that specific bucket, nothing else.</li>
        <li><strong>No persistent environment</strong> — execution environment destroyed after idle timeout (~15min). Secrets can't be stored in global variables across deployments. Use Secrets Manager or Parameter Store — fetched at runtime, cached in memory for the environment lifetime.</li>
        <li><strong>VPC isolation</strong> — Lambda can run inside a VPC to access private RDS/ElastiCache. Adds ~1s cold start for ENI attachment. Necessary for compliance-sensitive workloads.</li>
        <li><strong>Code signing</strong> — configure Lambda to only accept packages signed with your KMS key. Prevents deploying tampered code packages from a compromised CI pipeline.</li>
      </ul>
    ` },
  ],

  kafka: [
    { name: 'API Design', content: `
      <div class="content-label">Key Interfaces (Producer / Consumer API)</div>
      <table class="nfr-table">
        <tr><td><code>producer.send(topic, key, value)</code></td><td>Publish a message. key determines partition (consistent hashing on key). value = bytes (JSON/Avro/Protobuf). Returns Future&lt;RecordMetadata&gt; with offset. Async by default — batches in memory for throughput.</td></tr>
        <tr><td><code>consumer.subscribe([topics])</code></td><td>Subscribe to one or more topics. Kafka assigns partitions across consumer group members. Each partition consumed by exactly one consumer in the group at a time.</td></tr>
        <tr><td><code>consumer.poll(timeout)</code></td><td>Fetch batch of records. Returns list of (topic, partition, offset, key, value). Consumer commits offset after processing to mark progress. On restart, resumes from last committed offset.</td></tr>
        <tr><td><code>AdminClient.createTopic(name, partitions, replication)</code></td><td>Create a topic. partitions = parallelism unit (more partitions = more consumers). replication = 3 for production (ISR guarantees durability).</td></tr>
      </table>
      <div class="insight-box">Kafka has no REST API in the broker itself. Producers/consumers use the Kafka binary protocol over TCP. Kafka REST Proxy (Confluent) wraps this in HTTP for languages without a native client.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Partition = unit of parallelism</strong> — a topic with 12 partitions can have at most 12 consumers in a group processing in parallel. More partitions = more parallelism but more overhead (more leader elections, more connections). Design partition count for peak consumer parallelism needed.</li>
        <li><strong>At-least-once vs exactly-once</strong> — default: at-least-once (consumer may reprocess on crash). Exactly-once: producer idempotency (enabled via enable.idempotence=true) + transactional consumer commits. Most systems design consumers to be idempotent rather than paying the cost of exactly-once.</li>
        <li><strong>Consumer lag</strong> — lag = (latest offset) - (committed offset). High lag = consumers falling behind. Fix: add consumers (up to partition count), or increase consumer throughput. Lag is the primary operational metric to monitor.</li>
      </ul>
      <div class="insight-box">Differentiator: Kafka's durability comes from the <strong>log structure</strong> — messages appended sequentially to disk (sequential I/O is fast). Messages not deleted after consumption — retained for a configurable period (7 days default). Any consumer can replay from offset 0. This replayability is what makes Kafka different from traditional queues.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single Kafka broker. One topic, 3 partitions. One consumer group. Works for thousands of messages/sec. Bottleneck: single broker disk I/O.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>3-broker cluster with replication factor 3. ZooKeeper for leader election (or KRaft without ZooKeeper). Multiple consumer groups for different use cases (analytics vs notifications). Topic compaction for state topics.</td></tr>
        <tr><td><strong>Stage 3 — LinkedIn scale</strong></td><td>Thousands of brokers across multiple data centres. MirrorMaker 2 for cross-DC replication. Cruise Control for automated partition rebalancing. 7 trillion messages/day. Schema Registry (Avro) for schema evolution. Tiered storage (S3) for long-term retention.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why Kafka over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Kafka vs RabbitMQ</strong></td><td>RabbitMQ: message deleted after consumption. Good for task queues (one consumer processes each job). Kafka: messages retained and replayable. Good for event streams (multiple consumers, replay, auditing). If you need replay or multiple independent consumers on the same stream → Kafka. If you need simple job queue → RabbitMQ.</td></tr>
        <tr><td><strong>Kafka vs AWS SQS</strong></td><td>SQS: fully managed, no ops overhead, message deleted after consumption, max 14-day retention. Kafka: self-managed (or Confluent/MSK), indefinite retention, partition-level ordering, replay. SQS is simpler; Kafka is more powerful. Choose SQS if you're AWS-only and don't need replay.</td></tr>
        <tr><td><strong>Kafka vs Kinesis</strong></td><td>Kinesis: AWS managed, 7-day max retention, 1MB/s per shard. Kafka: unlimited retention (with tiered storage), higher throughput per partition, more client library support. Kinesis for simple AWS-integrated streaming; Kafka for complex event-driven architectures.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>SASL authentication</strong> — SASL/PLAIN (username/password) or SASL/SCRAM (stronger hash). Clients authenticate before producing/consuming. Prevents unauthorized producers from injecting events.</li>
        <li><strong>ACLs per topic</strong> — Kafka ACLs: ALLOW user=analytics-service on topic=page-views for operation=READ. DENY everything by default. Prevents a compromised service from reading another service's sensitive events.</li>
        <li><strong>TLS in transit</strong> — Kafka broker-to-broker and client-to-broker traffic encrypted via TLS. Prevents eavesdropping on event streams (which may contain PII).</li>
        <li><strong>Schema Registry + schema validation</strong> — producers must use a registered Avro/Protobuf schema. Prevents malformed messages from corrupting consumer processing. Schema evolution is backwards/forwards compatible with defined rules.</li>
      </ul>
    ` },
  ],

  urlshortener: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /shorten</code></td><td>Body: {long_url, custom_code?, ttl_days?}. Returns {short_code, short_url: "https://bit.ly/aB3xYz", expires_at?}. Rate limited: 100/min per API key.</td></tr>
        <tr><td><code>GET /{code}</code></td><td>The redirect endpoint. Server looks up code in Redis cache → if miss, PostgreSQL. Returns 302 (or 301 for permanent). 302 preferred: browser doesn't cache, analytics counts every visit.</td></tr>
        <tr><td><code>GET /analytics/{code}</code></td><td>Returns: {total_clicks, clicks_by_country, clicks_by_device, clicks_over_time[]}. Read from ClickHouse (OLAP). Not real-time — 1-2 minute lag from Kafka ingestion.</td></tr>
        <tr><td><code>DELETE /{code}</code></td><td>Expire a short URL. Marks as deleted in DB. Redis TTL cleared. Returns 204. Future requests to that code return 404.</td></tr>
      </table>
      <div class="insight-box">301 vs 302: 301 (permanent) = browser caches redirect → no future server hit → analytics break, can't track clicks. 302 (temporary) = browser always hits server → accurate analytics + ability to update destination. Use 302 for analytics-enabled links.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Code generation strategy</strong> — three options: (1) MD5(long_url) truncated to 7 chars — collision-prone; (2) auto-increment ID → Base62 encode — simple, predictable; (3) pre-generated key table — best at scale. Pre-generated: background worker fills a key pool table with unused codes. Redirect service picks a key atomically. No real-time generation under load.</li>
        <li><strong>Cache-Aside pattern</strong> — redirect is the hot path (10B/day). Redis cache: code → long_url. On hit: return immediately. On miss: query PostgreSQL, populate cache with 24h TTL, return. 99%+ cache hit rate for popular links.</li>
        <li><strong>Hash collisions</strong> — two different URLs hash to same short code. Fix: check DB for collision before returning. If collision, append a counter and re-hash. Rare but must be handled.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>301 vs 302</strong> trade-off — this is a common interview trick question. Also: why Base62 (0-9, a-z, A-Z) over Base64 (adds +, / which are URL-unsafe). 7 Base62 characters = 62^7 = 3.5 trillion unique codes — enough for decades.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 100K links</strong></td><td>Single server + PostgreSQL. MD5 truncation for codes. No cache. Bottleneck: every redirect hits PostgreSQL.</td></tr>
        <tr><td><strong>Stage 2 — 10M links</strong></td><td>Redis cache (cache-aside) for redirect path. PostgreSQL read replicas. Click events written async to Kafka → ClickHouse for analytics. CDN for redirect (edge caches 301s).</td></tr>
        <tr><td><strong>Stage 3 — 10B redirects/day</strong></td><td>Pre-generated key pool. DynamoDB for URL mappings (scales writes). Redis cluster for hot links. Global CDN (edge redirect without hitting origin). Kafka → ClickHouse for analytics. Separate analytics service. Rate limiting per API key at gateway.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>DynamoDB for URL mappings</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>URL mapping is a simple key-value lookup: code → long_url. No joins needed. DynamoDB provides single-digit millisecond reads at unlimited scale with no sharding complexity. PostgreSQL at 10B redirects/day requires extensive sharding. DynamoDB's partition key = short_code gives even distribution.</td></tr>
        <tr><td><strong>ClickHouse for analytics</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Click analytics = columnar aggregation (COUNT by country, GROUP BY date). ClickHouse is a columnar OLAP engine — 100x faster than PostgreSQL for analytical queries on billions of rows. Queries like "clicks by country this week" run in milliseconds on ClickHouse, minutes on PostgreSQL.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Malicious URL prevention</strong> — check destination URL against Google Safe Browsing API before shortening. Block known phishing/malware domains. Log all created URLs for abuse investigation.</li>
        <li><strong>Rate limiting</strong> — unauthenticated creation: 10 links/hour per IP. API key holders: configurable limits. Prevents link spam campaigns.</li>
        <li><strong>Code unpredictability</strong> — auto-increment IDs are predictable (enumerate all short links by incrementing). Use random Base62 instead. Pre-generated keys are random — enumeration reveals nothing useful.</li>
        <li><strong>HTTPS enforcement</strong> — all redirects via HTTPS. HTTP requests 301-redirect to HTTPS version first. HSTS header prevents downgrade attacks on the domain.</li>
      </ul>
    ` },
  ],

  ratelimiter: [
    { name: 'API Design', content: `
      <div class="content-label">Rate Limiter is middleware — no external API. Here's the internal interface:</div>
      <table class="nfr-table">
        <tr><td><code>checkLimit(user_id, endpoint) → {allowed: bool, remaining: int, retry_after_ms: int}</code></td><td>Called by API Gateway on every request. If allowed=false, return 429 Too Many Requests with Retry-After header. Must be sub-millisecond — on the hot path of every API call.</td></tr>
        <tr><td><strong>Response headers (RFC 6585)</strong></td><td>X-RateLimit-Limit: 100, X-RateLimit-Remaining: 43, X-RateLimit-Reset: 1703001600 (Unix timestamp when window resets). Good API design includes these on every response, not just 429s.</td></tr>
        <tr><td><strong>Config</strong></td><td>Rules defined per endpoint + user tier: {endpoint: "/payments", tier: "free", limit: 10, window_sec: 60, algorithm: "sliding_window"}. Stored in config service, cached in Gateway.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Algorithm choice</strong> — Token Bucket: smooth bursting, allows burst up to bucket size, then tokens refill at rate R. Sliding Window Log: exact count in last N seconds, memory-intensive. Sliding Window Counter: approximate, memory-efficient, most common in practice. Know all three and when to use each.</li>
        <li><strong>Distributed rate limiting</strong> — multiple API gateway instances share rate limit state. Options: (1) centralised Redis with Lua script for atomic check-and-decrement; (2) approximate local counters with periodic sync (race condition window). Centralised Redis is standard; local counters used only when Redis latency is unacceptable.</li>
        <li><strong>Fixed window problem</strong> — limit 100 req/min. User sends 100 at 11:59 and 100 at 12:00 = 200 in 2 seconds. Fix: sliding window. Know this gotcha — it's a classic interview trap.</li>
      </ul>
      <div class="insight-box">Differentiator: Redis Lua script for atomic sliding window: <code>local count = redis.call('INCR', key); redis.call('EXPIRE', key, window); return count</code>. The Lua script runs atomically — no race condition between INCR and EXPIRE. This is the standard production implementation.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>In-process rate limiter (HashMap in app memory). Works for single server. Fails immediately on multiple servers — each has its own counter.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Centralised Redis with Lua script. All gateway instances share one Redis. Works up to ~100K req/sec before Redis becomes a bottleneck.</td></tr>
        <tr><td><strong>Stage 3</strong></td><td>Redis Cluster (sharded by user_id). Local token bucket in each gateway instance with periodic Redis sync (approximate but handles Redis unavailability gracefully). Fallback: allow all traffic if Redis is down (fail open) vs block all (fail closed) — business decision.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why Redis over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Redis for rate state</strong><br><span style="color:#888;font-size:11px;">vs Memcached</span></td><td>Redis: atomic Lua scripts (check + decrement in one operation = no race condition), native sorted sets for sliding window log, persistence optional. Memcached: no Lua scripts → race condition between check and decrement → inaccurate limiting. Redis wins decisively for rate limiting.</td></tr>
        <tr><td><strong>Redis vs in-memory</strong></td><td>In-memory (per-server): no network latency, but state not shared across servers. User could hit 10 servers × 100 req/server = 1000 req while limit is 100. Redis: shared state, ~1ms latency, accurate across all servers. Trade network latency for accuracy.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Key granularity</strong> — rate limit by: IP (catches unauthenticated attacks), user_id (catches authenticated abuse), API key (catches third-party app abuse), IP+endpoint combination (surgical control). Layer all three for defence in depth.</li>
        <li><strong>Bypass prevention</strong> — clients may rotate IPs to bypass IP-based limits. Fingerprint by: user_id + device ID + IP together. ML anomaly detection for suspicious patterns (new IPs cycling rapidly).</li>
        <li><strong>Fail open vs fail closed</strong> — if Redis is unreachable, should all requests be allowed (fail open) or blocked (fail closed)? Fail open = DDoS risk. Fail closed = service outage. Most production systems fail open with aggressive alerting on Redis downtime.</li>
        <li><strong>DDoS vs rate limiting</strong> — rate limiting handles API abuse per user. DDoS = volumetric attack from thousands of IPs. DDoS requires network-level mitigation (Cloudflare, AWS Shield) before the request reaches your rate limiter.</li>
      </ul>
    ` },
  ],

  notifications: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /notifications/send</code></td><td>Body: {user_ids: [...], title, body, data: {}, priority: high|normal}. Returns {notification_id, queued: true}. Async — notification is queued, not delivered synchronously. Rate limited per sender.</td></tr>
        <tr><td><code>POST /devices/register</code></td><td>Body: {user_id, device_token, platform: ios|android, app_version}. Upserts device token in PostgreSQL. Called on app startup. Token rotates — must re-register on token change.</td></tr>
        <tr><td><code>GET /notifications/{id}/status</code></td><td>Returns delivery status: queued → sent_to_platform → delivered|failed. "delivered" means APNs/FCM accepted it — not that user saw it. True open-rate requires in-app tracking pixel.</td></tr>
        <tr><td><code>DELETE /devices/{token}</code></td><td>Unregister device (app uninstalled). Remove from token registry to stop sending to invalid tokens (causes APNs/FCM error codes that trigger token cleanup).</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Token registry</strong> — device tokens are unstable. APNs/FCM rotates them. App reinstall = new token. Must handle: (1) token rotation → update registry on 200 response with new token; (2) invalid token → APNs/FCM returns 410 Gone → delete from registry immediately.</li>
        <li><strong>Fan-out at scale</strong> — send to 10M users. Don't loop and call APNs/FCM 10M times serially. Fan-out via Kafka: one message per user → N consumers → each consumer calls APNs/FCM for their batch. Parallelize.</li>
        <li><strong>Priority</strong> — high priority (wakes screen) vs normal (delivered when device next wakes up). Use high only for urgent notifications (messages, calls). Normal for marketing/badges. APNs/FCM throttle high-priority overuse.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>why you don't build your own push transport</strong>. APNs and FCM handle the last-mile delivery to the device (which is on a mobile network, behind NAT, with intermittent connectivity). You can't TCP-connect to a phone. APNs/FCM maintain persistent connections to every device globally. You pay their API to use this infrastructure.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single service calls APNs/FCM directly per notification. Works for thousands of users. Bottleneck: serial APNs/FCM calls are slow. Send to 100K users takes 100 seconds.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Kafka queue between sender and delivery workers. Multiple workers in parallel. Priority queue (high-priority notifications processed first). PostgreSQL for token registry + delivery logs.</td></tr>
        <tr><td><strong>Stage 3 — billions of notifications/day</strong></td><td>Separate workers per platform (iOS workers, Android workers). APNs HTTP/2 supports 1500 concurrent connections per worker. Batch notifications (APNs supports up to 1000 in one HTTP/2 stream). Dead letter queue for failed deliveries. ML for best-time-to-deliver (don't send at 3am).</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>PostgreSQL for token registry</strong><br><span style="color:#888;font-size:11px;">vs Cassandra</span></td><td>Token registry: {user_id → [device_tokens]}. Need to: (1) lookup all tokens for a user (one read per user_id); (2) delete invalid tokens atomically; (3) upsert on registration. PostgreSQL handles this with a simple index on user_id. Cassandra works but overkill unless you have 100M+ registered devices.</td></tr>
        <tr><td><strong>Kafka for delivery queue</strong><br><span style="color:#888;font-size:11px;">vs SQS</span></td><td>Notifications need priority lanes (high/normal). Kafka topics per priority. APNs/FCM errors need retry with backoff — Kafka consumer can re-process from offset. SQS works but priority requires multiple queues with complex consumer orchestration. Kafka's log retention enables replay of failed batches.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>APNs certificate / FCM key</strong> — APNs requires a p8 key file or push certificate. FCM requires a service account JSON key. These must be rotated annually and stored in a secrets manager — never in code.</li>
        <li><strong>Notification payload encryption</strong> — sensitive data (e.g., message preview) in notification payload is sent through APNs/FCM servers. For truly private notifications: send an empty push → app wakes up → fetches content from your server over TLS. APNs/FCM never sees content.</li>
        <li><strong>User opt-out</strong> — GDPR/CCPA: users must be able to opt out of all notifications. Store per-user preferences. Filter before fan-out. Unsubscribes must propagate within 24 hours.</li>
        <li><strong>Rate limiting per sender</strong> — prevent notification spam. Limit: 5 notifications/user/hour from the same sender. Users can globally mute senders in settings.</li>
      </ul>
    ` },
  ],

  chatgpt: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /v1/chat/completions</code></td><td>Body: {model, messages: [{role, content}], stream: true, max_tokens}. With stream=true: returns Server-Sent Events (SSE). Each event is a delta token: data: {"choices":[{"delta":{"content":"Hello"}}]}. Stream ends with data: [DONE].</td></tr>
        <tr><td><code>POST /v1/embeddings</code></td><td>Body: {model: "text-embedding-ada-002", input: "text to embed"}. Returns {embedding: [0.123, -0.456, ...]} — 1536-dimensional vector. Used for semantic search, RAG. Synchronous — no streaming.</td></tr>
        <tr><td><code>GET /v1/models</code></td><td>List available models with their context window sizes and capabilities. Used by client to pick appropriate model for task.</td></tr>
      </table>
      <div class="insight-box">SSE (Server-Sent Events) is used instead of WebSockets because streaming is one-directional (server → client). SSE works over plain HTTP/2, requires no special handling, and is automatically buffered and retried by browsers.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>KV cache</strong> — transformer attention is O(n²) in sequence length. KV cache stores computed key/value matrices for the prompt — avoids recomputing them for each new token. For long conversations (4K tokens), KV cache reduces compute from O(n²) per token to O(n) per token. Size: O(layers × heads × seq_len × head_dim).</li>
        <li><strong>Token streaming</strong> — don't buffer the full response then send. Generate one token → send it immediately via SSE → repeat. Users see text appear word by word. Perceived latency (time-to-first-token) is what matters — 500ms TTFT feels fast even if total generation takes 10s.</li>
        <li><strong>Batching for GPU efficiency</strong> — GPUs are most efficient processing multiple requests simultaneously (matrix operations vectorise across batch). Continuous batching: as one request finishes, slot immediately filled by next. Increases GPU utilisation from ~40% to ~80%+.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>model sharding</strong> — GPT-4 doesn't fit on one GPU. Tensor parallelism: split each layer's weight matrix across N GPUs. Pipeline parallelism: put different layers on different GPUs. A single inference call touches 8–32 GPUs simultaneously. Request routing must keep the full conversation on the same GPU group for KV cache locality.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single GPU server running model. Synchronous inference. One request at a time. Works for prototype/research. Bottleneck: GPU is idle between requests.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Multiple GPU servers. Request queue (Redis/Kafka). Continuous batching (vLLM or TGI). Load balancer routes by model. KV cache on GPU HBM. SSE streaming to client.</td></tr>
        <tr><td><strong>Stage 3 — millions of users</strong></td><td>Model sharding (tensor + pipeline parallelism). Per-model GPU clusters (GPT-4 cluster, GPT-3.5 cluster). Speculative decoding (small draft model proposes tokens, large model verifies in parallel). Prompt caching (cache KV state for common system prompts). Global routing to nearest region.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Vector DB (Pinecone/Weaviate) for RAG</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL + pgvector</span></td><td>RAG requires approximate nearest neighbour (ANN) search over billions of vectors. Pinecone/Weaviate use HNSW indexes — query latency ~10ms at billion scale. pgvector: exact search is O(n) — too slow at scale. pgvector with HNSW works for &lt;10M vectors but operational overhead vs managed vector DB is significant.</td></tr>
        <tr><td><strong>Redis for conversation history</strong><br><span style="color:#888;font-size:11px;">vs PostgreSQL</span></td><td>Active conversations fetched on every token generation. Redis sub-millisecond reads vs PostgreSQL ~5ms. At 10K concurrent conversations × 100 tokens each = 1M reads/sec. Redis handles this; PostgreSQL would need extreme read replicas.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Prompt injection detection</strong> — users may embed instructions in content to hijack the model ("Ignore previous instructions and..."). Classifier trained to detect injection attempts. System prompt cannot be overridden by user content in well-designed systems.</li>
        <li><strong>Output filtering</strong> — generated text passes through a content classifier before streaming to user. Blocks harmful content (CSAM, detailed weapon instructions). Classifier runs in parallel with generation — adds minimal latency.</li>
        <li><strong>API key rate limiting</strong> — per-key token limits (input + output tokens). Rate limiting by tokens, not requests — a single request for 100K tokens is more expensive than 100 short requests.</li>
        <li><strong>Training data privacy</strong> — opt-out from training: conversation data not used to train future models if user opts out. Data deleted from training pipelines. Enterprise API: data never used for training by default.</li>
      </ul>
    ` },
  ],

  uber: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /rides/request</code></td><td>Body: {pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, product_type}. Returns {ride_id, estimated_eta_seconds, surge_multiplier, estimated_fare}. Triggers async driver matching. Client polls or receives WebSocket push on match.</td></tr>
        <tr><td><code>GET /rides/{id}/status</code></td><td>Returns {status: matching|accepted|arriving|in_progress|completed, driver?: {name, rating, lat, lng, eta_seconds}}. Client polls every 5s for driver location during trip.</td></tr>
        <tr><td><code>PUT /drivers/location</code></td><td>Driver app sends location every 4 seconds. Body: {lat, lng, heading, speed}. Writes to Redis geospatial index. This endpoint handles millions of writes/minute at peak.</td></tr>
        <tr><td><code>POST /rides/{id}/cancel</code></td><td>Cancels pending or accepted ride. If driver already en route, cancellation fee may apply. Triggers driver notification and returns driver to available pool.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Driver location indexing</strong> — 5M active drivers updating location every 4s = 1.25M location writes/sec. Must find nearest available driver in &lt;100ms. Answer: Redis GEOADD/GEORADIUS — O(N+log M) geo search where N = results, M = total in radius. Geohash for sharding across Redis clusters.</li>
        <li><strong>Surge pricing</strong> — demand/supply imbalance in a geohash cell triggers surge multiplier. Calculated per cell every 1-2 minutes. High demand + low supply → surge increases until equilibrium. Don't overcomplicate — it's a ratio calculation per geo cell.</li>
        <li><strong>Matching algorithm</strong> — nearest driver isn't always best. Consider: driver heading (driving away from pickup is bad), driver ETA (accounting for traffic), acceptance rate (reluctant drivers slow matching). Weighted scoring across multiple factors.</li>
      </ul>
      <div class="insight-box">Differentiator: Uber uses <strong>H3</strong> (Hexagonal Hierarchical Geospatial Indexing) for geo cells. Hexagons have equal distance from centre to any edge (unlike squares). This makes radius queries more uniform and surge pricing cells more accurate. H3 was open-sourced by Uber.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — 1 city</strong></td><td>Single server + PostgreSQL with PostGIS extension for geo queries. Driver locations in PostgreSQL. Simple nearest-driver query. Works for hundreds of drivers.</td></tr>
        <tr><td><strong>Stage 2 — 10 cities</strong></td><td>Redis GEOADD/GEORADIUS for driver locations (replaces PostGIS). Separate matching service from trip service. Kafka for trip events. PostgreSQL for trip history. Per-city surge calculator.</td></tr>
        <tr><td><strong>Stage 3 — 70 countries</strong></td><td>H3 geospatial indexing. Redis Cluster sharded by geo cell. Dispatch service (ML-based matching). Real-time ETA service (OSRM + live traffic). Surge pricing ML model (demand forecasting). Per-region active-active. Payments localised per country.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Redis GEOADD for driver locations</strong><br><span style="color:#888;font-size:11px;">vs PostGIS</span></td><td>Driver locations are write-heavy (5M × 1 update/4s = 1.25M writes/min) and read-latency-critical (find nearest driver in &lt;100ms). Redis in-memory operations are sub-millisecond. PostGIS disk-based geo queries take 10–50ms. At Uber's scale, PostGIS would require thousands of replicas to handle read load.</td></tr>
        <tr><td><strong>Cassandra for trip history</strong><br><span style="color:#888;font-size:11px;">vs MySQL</span></td><td>Trip history = append-only time-series per driver and rider. Billions of trips. Cassandra partition by driver_id + cluster by trip_start_time. O(1) write, efficient range reads. MySQL needs heavy sharding for this volume and struggles with write throughput.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Driver and rider verification</strong> — drivers: background check + license verification + vehicle inspection. Riders: phone verification + payment method. Continuous monitoring: driver behaviour score, rider reports.</li>
        <li><strong>Location privacy</strong> — rider location only shared with matched driver (not all drivers). Driver location visible to rider only during trip. After trip, exact locations stored internally for dispute resolution but not shared.</li>
        <li><strong>Payment fraud</strong> — ML model scores each payment for fraud risk. Suspicious trips flagged for manual review. Chargeback patterns trigger account suspension. Card tokenisation via Braintree — card data never on Uber servers.</li>
        <li><strong>Trip safety features</strong> — anonymous phone numbers (Twilio masks real numbers). Emergency SOS button shares live location with emergency services. RideCheck: if trip takes unexpected route or stops, Uber proactively checks in.</li>
      </ul>
    ` },
  ],

  airtag: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints (Find My Network — consumer-facing via iCloud)</div>
      <table class="nfr-table">
        <tr><td><code>GET /items/{item_id}/location</code></td><td>Returns latest location report: {lat, lng, timestamp, accuracy_meters}. Decrypted on device — server returns encrypted blob. Client-side decryption only. Server sees: {anonymous_id → encrypted_location_blob}.</td></tr>
        <tr><td><code>PUT /items/{item_id}/lost-mode</code></td><td>Activate Lost Mode. Body: {message, contact_phone}. AirTag now advertises "lost" flag in BLE beacon. Any iPhone that scans it shows your message. NFC tap reveals contact info.</td></tr>
        <tr><td><code>POST /items/{item_id}/sound</code></td><td>Trigger a sound on the AirTag. Uses Apple's Find My accessory protocol — command queued, delivered next time AirTag is in range of a relay device. Not instant.</td></tr>
      </table>
      <div class="insight-box">The most important design detail: Apple's servers receive location reports but <strong>cannot decrypt them</strong>. The encryption key is derived from the AirTag's rotating public key — only the owner's device has the corresponding private key series. Apple built a privacy-preserving location network.</div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Rotating public keys</strong> — AirTag rotates its BLE-advertised public key every 15 minutes. Relay iPhones use the current public key to encrypt GPS location → upload to Apple. Owner's device knows the full sequence of keys → can decrypt all reports. Non-owners see an anonymous rotating ID — can't track the AirTag across key rotations.</li>
        <li><strong>Crowd-sourced network design</strong> — 1B+ Apple devices act as passive relays. No consent needed for relay (it's built into iOS Find My setting, on by default). Relay devices upload encrypted blobs with no knowledge of what they're relaying. Explain why this privacy model works: relay sees only ciphertext.</li>
        <li><strong>Anti-stalking algorithm</strong> — unknown AirTag travelling with non-owner for 8+ hours → iOS plays sound on AirTag and alerts the person. Balance false positive (friends carrying shared bags) vs false negative (missing a real stalker). Threshold tuning is the core design challenge.</li>
      </ul>
      <div class="insight-box">Differentiator: contrast with Tile's network. Tile uses the same crowd-sourcing concept but with a much smaller network (Tile app installs vs 1B+ iPhones). The network effect is the entire value of Find My — more devices = better coverage = faster location updates.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1 — prototype</strong></td><td>BLE beacon + GPS-capable relay device (iPhone with Location Services) + S3 for encrypted blobs + iCloud for owner retrieval. Core privacy model in place from day one.</td></tr>
        <tr><td><strong>Stage 2 — launch (200M AirTags)</strong></td><td>Dedicated Find My servers. Encrypted blob store partitioned by anonymous_AirTag_ID. Key rotation service (generates key sequences, distributes to owner's devices via iCloud). Anti-stalking detection service.</td></tr>
        <tr><td><strong>Stage 3 — ecosystem</strong></td><td>Find My Network Accessory Program: third-party devices (Belkin, Chipolo) can join. MFi certified chips. Billions of encrypted reports/day. CDN for blob retrieval. Regional servers for GDPR compliance. Precision Finding service (UWB triangulation assist).</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Encrypted blob store (S3-like)</strong><br><span style="color:#888;font-size:11px;">vs traditional location DB</span></td><td>A traditional location DB stores (device_id, lat, lng, timestamp) — readable by the operator. For AirTag's privacy model, the server must be unable to read the location. Encrypted blobs (opaque bytes) stored by anonymous ID achieve this. The "database" is just a key-value store — no geospatial queries needed on server side (all decryption and processing on owner's device).</td></tr>
        <tr><td><strong>iCloud (CP) for ownership</strong><br><span style="color:#888;font-size:11px;">vs AP store</span></td><td>Mapping of AirTag serial → Apple ID must be strongly consistent. If two requests race (factory reset + re-pair), the ownership record must be deterministic. AP storage could allow split-brain where two Apple IDs both think they own the same AirTag.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>End-to-end encrypted locations</strong> — Apple cannot read any AirTag's location. Location is encrypted with a key Apple never sees. This is the fundamental privacy guarantee and the reason Apple can offer the service without privacy concerns (mostly).</li>
        <li><strong>Rotating IDs prevent tracking</strong> — without key rotation, any Bluetooth scanner could track an AirTag's movement by following its fixed BLE address. 15-minute rotation breaks this. Apple Watch detects stalking across rotations via iCloud-stored key sequence.</li>
        <li><strong>Anti-stalking sound</strong> — after 8–72 hours (depending on owner distance), unknown AirTag plays a sound. This was updated after early abuse cases. Android users can use Apple's "Tracker Detect" app (iOS does it automatically).</li>
        <li><strong>NFC privacy</strong> — in Lost Mode, NFC tap shows contact info. This is a calculated trade-off: revealing contact info to a finder vs keeping it private and losing the item.</li>
      </ul>
    ` },
  ],

  typeahead: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>GET /autocomplete?q={prefix}&limit=5&locale=en-US</code></td><td>Returns: {suggestions: ["apple pie", "apple watch", "apple store", "apple music", "apple tv"]}. Must respond in &lt;50ms — user is typing. Results CDN-cached per prefix (cache hit rate: 95%+ for 1-3 char prefixes).</td></tr>
        <tr><td><code>POST /feedback</code></td><td>Internal API: {query_id, selected_suggestion, position}. Captures which suggestion was clicked. Feeds into next training cycle to update suggestion rankings. Not user-facing.</td></tr>
      </table>
      <div class="insight-box">That's it — typeahead has almost no API surface. The complexity is entirely in the data structure and pre-computation. A client gets one endpoint and one response. Everything else is internal.</div>
      <div class="content-label" style="margin-top:12px;">Data structure: Trie</div>
      <ul class="req-list">
        <li>Trie node: each character = one node. Path from root to node = prefix. Each node stores top-K suggestions for that prefix (pre-computed, not computed on query).</li>
        <li>Query "app" → traverse root→a→p→p → return stored top-5 for that node. O(prefix_length) — extremely fast.</li>
        <li>Trie sharded by prefix: "a*" on server 1, "b*" on server 2. Consistent hashing on first 2 chars.</li>
      </ul>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Pre-computation is the key insight</strong> — don't compute top-K at query time. Pre-compute during trie construction: each node stores the globally top-K queries that pass through it. Query = trie traversal + return pre-stored list. This makes read O(prefix_length), not O(N).</li>
        <li><strong>Frequency ranking</strong> — suggestions ranked by global search frequency + personalisation signals. Frequency data collected from search logs → batch job (Hadoop/Spark) → rebuild trie weekly (or incrementally daily). Fresh queries don't appear immediately — lag is acceptable.</li>
        <li><strong>Prefix partitioning</strong> — trie can't fit in one server's RAM at Google scale. Partition by first 1–2 chars: "a*", "b*", etc. Request routing: hash(prefix[0:2]) → server. Consistent hashing for adding servers.</li>
      </ul>
      <div class="insight-box">Differentiator: mention <strong>CDN caching of suggestions</strong>. Most users type the same popular prefixes. Cache GET /autocomplete?q=app at CDN edge — 95% of traffic served from CDN, 5% hits your trie servers. This is the single biggest scalability win and easy to overlook.</div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>In-memory trie on single server. Rebuilt weekly from search logs CSV. Works for millions of queries/day. Bottleneck: single server RAM (trie for 10M terms ≈ 5–10GB).</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Trie sharded by prefix across 26+ servers (one per first letter). CDN cache in front. Daily trie rebuilds from Hadoop job. Redis for hot prefix caching.</td></tr>
        <tr><td><strong>Stage 3 — Google scale</strong></td><td>Trie sharded by first 2 chars (676 partitions). Each partition in RAM (5–20GB). CDN caches 95%+ of traffic. Personalisation layer: merge global trie results with user's recent search history (in Redis). Real-time frequency updates via streaming (Flink) for trending queries.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why Trie over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Trie vs Redis Sorted Set</strong></td><td>Redis ZRANGEBYLEX can do prefix search on a sorted set. Works for small datasets. But: storing all queries in one sorted set is O(N) memory. Trie with pre-computed top-K per node is O(unique_prefixes × K) — much smaller. Trie also supports wildcard and fuzzy matching more naturally.</td></tr>
        <tr><td><strong>Trie vs Elasticsearch</strong></td><td>Elasticsearch prefix queries work but add 5–20ms latency (network + query overhead). In-memory trie returns in &lt;1ms. For typeahead (50ms budget, called on every keystroke), in-memory trie is the right choice. Elasticsearch is better for full-text search where prefix isn't the only access pattern.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>PII in search queries</strong> — users often type personal information in search boxes (SSN, passwords, medical terms). Search logs must be anonymised before being fed into the trie training pipeline. Log retention: 90 days maximum before deletion.</li>
        <li><strong>Abuse of suggestions</strong> — autocomplete can amplify harmful narratives (e.g., "how to make a b" completing to "bomb"). Content moderation team maintains a blocklist of harmful completions. Blocklist applied as a filter after trie lookup.</li>
        <li><strong>Rate limiting</strong> — typeahead endpoint called on every keystroke — easily 10+ requests/second per user. CDN absorbs most of this. Server-side: rate limit per IP to prevent scraping the entire suggestion database.</li>
        <li><strong>Search query manipulation</strong> — don't let users inject their preferred suggestions by searching frequently. Frequency signals are smoothed and anomalies filtered (sudden spike in one query = suspicious, down-ranked).</li>
      </ul>
    ` },
  ],

  segment: [
    { name: 'API Design', content: `
      <div class="content-label">Key Endpoints</div>
      <table class="nfr-table">
        <tr><td><code>POST /v1/track</code></td><td>Body: {userId, event: "Button Clicked", properties: {button_id: "checkout", page: "/cart"}, timestamp}. Returns 200 immediately (fire-and-forget from client's perspective). Internally queued to Kafka. Auth: workspace write key in Authorization header.</td></tr>
        <tr><td><code>POST /v1/identify</code></td><td>Body: {userId, traits: {name: "Alice", email: "alice@example.com", plan: "pro"}}. Links anonymous events to a known user. Fans out to all enabled destinations (Mixpanel, Salesforce, etc.) with field mappings applied.</td></tr>
        <tr><td><code>POST /v1/page</code></td><td>Body: {userId, name: "Home", properties: {url, referrer, title}}. Pageview tracking. Same pipeline as track — just a semantic alias.</td></tr>
        <tr><td><code>POST /v1/batch</code></td><td>Array of track/identify/page events in one request. Mobile SDKs buffer events locally and flush every 30s or 20 events — reduces battery/network usage vs one call per event.</td></tr>
      </table>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-label">What interviewers are actually testing</div>
      <ul class="req-list">
        <li><strong>Fan-out architecture</strong> — one inbound event must be delivered to 100+ destinations (Amplitude, Mixpanel, Salesforce, Google Analytics, etc.). Don't call all destinations synchronously on the inbound request — timeouts from one slow destination would fail the whole event. Answer: queue to Kafka, separate worker per destination, each worker translates and delivers independently.</li>
        <li><strong>Dead letter queue</strong> — destination API is down. Event fails. Don't drop it. Push to dead letter queue (DLQ). Retry with exponential backoff. After max retries, event in DLQ for manual inspection / replay when destination recovers.</li>
        <li><strong>Schema validation</strong> — "Protocols" product: define expected event schema (required fields, types). Reject or flag events that don't match. Prevents "garbage in → garbage analytics" problem that plagues data pipelines.</li>
      </ul>
      <div class="insight-box">Differentiator: explain <strong>Segment's transformation layer</strong>. Different destinations have different field name conventions (Mixpanel wants "distinct_id", Salesforce wants "external_id", etc.). Segment applies per-destination field mappings and filters before delivery. This transformation is the core value proposition — not just forwarding events.</td></div>
    ` },
    { name: 'Scaling Strategy', content: `
      <div class="content-label">3 stages of growth</div>
      <table class="nfr-table">
        <tr><td><strong>Stage 1</strong></td><td>Single Node.js server. Synchronous destination calls in parallel (Promise.all). Works for thousands of events/day. Bottleneck: slow destinations cause high p99 latency on inbound requests.</td></tr>
        <tr><td><strong>Stage 2</strong></td><td>Kafka between ingest and delivery. One consumer group per destination. Ingest returns 200 immediately after Kafka write. Destination workers retry independently. DLQ for failures. PostgreSQL for workspace config (which destinations enabled).</td></tr>
        <tr><td><strong>Stage 3 — billions of events/day</strong></td><td>Kafka partitioned by workspace_id (isolates noisy tenants). Per-destination worker autoscaling (Kubernetes HPA on consumer lag). Warehouse destinations (Snowflake, BigQuery, Redshift) batched hourly. Real-time destinations (webhooks, Mixpanel) near-instant. Schema validation at ingest (Protocols). PII scrubbing before forwarding.</td></tr>
      </table>
    ` },
    { name: 'DB Comparison', content: `
      <div class="content-label">Why these databases over alternatives</div>
      <table class="nfr-table">
        <tr><td><strong>Kafka for event pipeline</strong><br><span style="color:#888;font-size:11px;">vs SQS per destination</span></td><td>One inbound event needs to fan out to N destinations. With SQS: N separate queues, N separate writes per event. With Kafka: one write to a topic, N consumer groups each reading independently. Kafka's consumer group model is built for this exact fan-out pattern. Adding a new destination = add a new consumer group, no change to ingest.</td></tr>
        <tr><td><strong>PostgreSQL for workspace config</strong><br><span style="color:#888;font-size:11px;">vs DynamoDB</span></td><td>Workspace config (sources, destinations, field mappings, filters) is read on every event. Complex nested JSON structure. Relational model (workspace → sources → destinations) with ACID for config updates. Config cached in Redis with short TTL. PostgreSQL's JSON support handles nested config naturally.</td></tr>
      </table>
    ` },
    { name: 'Security', content: `
      <div class="content-label">Security considerations</div>
      <ul class="req-list">
        <li><strong>Write key isolation</strong> — each source (website, app, server) has its own write key. If a write key is compromised, rotate it — only that source is affected. Write keys are one-way (can only write events, not read data).</li>
        <li><strong>PII scrubbing</strong> — GDPR/CCPA: users can request deletion. Segment's "User Deletion" API propagates delete requests to all connected destinations. Real-time PII scrubbing at ingest: strip email/phone from events before forwarding to third-party destinations that don't need it.</li>
        <li><strong>Destination credential security</strong> — Mixpanel API key, Salesforce OAuth token stored in Segment's secrets vault (HashiCorp Vault or AWS Secrets Manager). Encrypted at rest. Rotated when customer updates credentials. Never logged.</li>
        <li><strong>Workspace isolation</strong> — multi-tenant: each customer's events stored in isolated Kafka partitions and DB schemas. One customer's events can never be seen by another customer's workers. Verified via workspace_id scoping on all DB queries.</li>
      </ul>
    ` },
  ],

  k8s: [
    { name: 'kubectl Cheat Sheet', content: `
      <div class="content-section">
        <div class="content-label">Cluster & Context</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">kubectl config get-contexts           # list all clusters
kubectl config use-context prod       # switch to prod cluster
kubectl config current-context        # show active context
kubectl cluster-info                  # API server URL + CoreDNS</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Pods & Deployments</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">kubectl get pods                      # list pods in default ns
kubectl get pods -n production        # specific namespace
kubectl get pods -o wide              # with node + IP columns
kubectl describe pod my-pod           # full event log + state
kubectl logs my-pod                   # container stdout
kubectl logs my-pod -f                # stream logs live
kubectl logs my-pod -c sidecar        # specific container
kubectl exec -it my-pod -- /bin/sh    # shell into pod
kubectl port-forward pod/my-pod 8080:8080  # local port → pod

# Deployments
kubectl get deployments
kubectl rollout status deployment/api
kubectl rollout undo deployment/api   # rollback
kubectl scale deployment/api --replicas=10
kubectl set image deployment/api app=myapp:v2.1</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Services, ConfigMaps, Secrets</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">kubectl get svc                       # list services
kubectl get endpoints api-svc         # which pods service routes to

kubectl get configmap my-config -o yaml
kubectl create configmap my-cfg --from-literal=ENV=prod

kubectl get secret my-secret -o yaml
kubectl create secret generic db-pass --from-literal=password=s3cr3t
# decode a secret value:
kubectl get secret db-pass -o jsonpath='{.data.password}' | base64 -d</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Apply & Debug</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">kubectl apply -f deployment.yaml      # create or update
kubectl delete -f deployment.yaml     # tear down by file
kubectl get events --sort-by='.lastTimestamp'  # cluster events
kubectl top nodes                     # node CPU/memory usage
kubectl top pods                      # pod resource usage
kubectl get pods --field-selector status.phase=Pending  # stuck pods
kubectl describe node my-node         # node capacity + taints</pre>
      </div>
    ` },
    { name: 'Interview Checklist', content: `
      <div class="content-section">
        <div class="content-label">Questions You Will Get — With Crisp Answers</div>
        <table class="nfr-table">
          <tr><td><strong>What's the difference between a Pod and a Container?</strong></td><td>A pod is a K8s abstraction that wraps one or more containers with shared networking and storage. A container is the actual process. You rarely interact with containers directly in K8s — you interact with pods.</td></tr>
          <tr><td><strong>Why would you use StatefulSet over Deployment?</strong></td><td>When pods need stable identity: fixed hostname (kafka-0), dedicated PersistentVolumeClaim that survives pod deletion, and ordered startup/shutdown. Databases and message brokers need this — REST APIs do not.</td></tr>
          <tr><td><strong>What happens when a pod OOMKills?</strong></td><td>Container exceeds its memory limit → Linux kernel OOMKiller terminates it → kubelet restarts it with CrashLoopBackOff. Fix: increase memory limit, or find the memory leak.</td></tr>
          <tr><td><strong>Readiness vs Liveness probe?</strong></td><td>Readiness failure = removed from Service endpoints (no traffic, pod stays alive). Liveness failure = pod restarted. Wrong choice is dangerous: liveness probe that's too strict → infinite restart loop.</td></tr>
          <tr><td><strong>How does a Service know which pods to route to?</strong></td><td>Label selector. Service spec has <code>selector: {app: api}</code>. kube-proxy watches Endpoints object — as pods matching that label appear/disappear, kube-proxy updates iptables rules on every node.</td></tr>
          <tr><td><strong>What is etcd and why does it matter?</strong></td><td>Distributed key-value store holding all cluster state. If etcd loses quorum, the control plane stops making decisions (no new pods, no scaling). Run as a 3 or 5-node raft cluster for HA. Back it up. Everything else is stateless and recoverable.</td></tr>
          <tr><td><strong>How do you deploy without downtime?</strong></td><td>Rolling update with <code>maxUnavailable: 0</code> and <code>maxSurge: 1</code>. Combine with readiness probes — new pod only gets traffic when probe passes. Old pod only terminated after new one is ready.</td></tr>
          <tr><td><strong>What's the difference between HPA and VPA?</strong></td><td>HPA = add/remove pods horizontally. VPA = resize pod's CPU/memory requests vertically (requires pod restart). Use HPA for traffic-driven scaling. Use VPA for right-sizing. Don't use both on the same resource metric.</td></tr>
          <tr><td><strong>How does pod-to-pod communication work?</strong></td><td>Every pod gets a flat cluster-internal IP. The CNI plugin (Calico, Flannel, Cilium) creates a virtual network so any pod can reach any other pod IP directly, across nodes. No NAT between pods.</td></tr>
          <tr><td><strong>What is a taint/toleration?</strong></td><td>Taint marks a node as "reserved" — scheduler won't place pods there unless the pod has a matching toleration. Use case: GPU nodes (expensive) should only run GPU workloads. Taint: <code>nvidia.com/gpu:NoSchedule</code>. Only pods that tolerate it run there.</td></tr>
        </table>
      </div>
    ` },
    { name: 'K8s vs Alternatives', content: `
      <div class="content-section">
        <div class="content-label">When to Use Kubernetes — and When Not To</div>
        <table class="nfr-table">
          <tr style="background:#f8f8f8;"><td style="font-weight:800;">Option</td><td style="font-weight:800;">Best For</td><td style="font-weight:800;">Avoid When</td></tr>
          <tr>
            <td><strong style="color:#326CE5;">Kubernetes</strong></td>
            <td>Complex microservices (10+ services), need fine-grained control over networking/scheduling/scaling, multi-cloud portability, team already has K8s expertise</td>
            <td>Single-service apps, small team, simple batch jobs, startup with &lt;5 engineers — operational overhead is high</td>
          </tr>
          <tr>
            <td><strong style="color:#f59e0b;">AWS ECS / Fargate</strong></td>
            <td>AWS-only shop, want managed container orchestration without K8s complexity, serverless containers (Fargate = no node management)</td>
            <td>Multi-cloud strategy, need Kubernetes ecosystem (Helm, operators, CRDs), non-AWS environments</td>
          </tr>
          <tr>
            <td><strong style="color:#10b981;">AWS Lambda</strong></td>
            <td>Event-driven functions, unpredictable burst traffic (0 → 10K rps in seconds), &lt;15 min execution time, no idle cost</td>
            <td>Long-running processes, stateful apps, latency-sensitive (cold start 100ms+), container size &gt;10GB, CPU-intensive workloads</td>
          </tr>
          <tr>
            <td><strong style="color:#6366f1;">Bare VMs</strong></td>
            <td>Extreme performance (no container overhead), licensed software that doesn't containerise, very simple single-service deployments</td>
            <td>Anything that benefits from density, fast deployment, rolling updates, or auto-scaling</td>
          </tr>
          <tr>
            <td><strong style="color:#ef4444;">Docker Compose</strong></td>
            <td>Local development, single-machine deployments, &lt;10 containers, no HA needed</td>
            <td>Production multi-node deployments — no cross-node networking, no auto-scheduling, no rolling updates</td>
          </tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Managed K8s — Which to Pick</div>
        <table class="nfr-table">
          <tr><td><strong>EKS (AWS)</strong></td><td>Best ecosystem integration: IAM, ALB Ingress, EBS/EFS, ECR. Most enterprises choose EKS for AWS-first strategy. Control plane managed by AWS — you pay per cluster hour ($0.10/hr).</td></tr>
          <tr><td><strong>GKE (Google)</strong></td><td>K8s was built at Google. GKE Autopilot = fully serverless nodes. Best-in-class cluster autoscaler. Cheapest managed control plane. Good for GCP-native orgs.</td></tr>
          <tr><td><strong>AKS (Azure)</strong></td><td>Best for Microsoft shops (Active Directory integration, Azure Monitor). Free control plane. Good Windows node support.</td></tr>
          <tr><td><strong>Self-managed</strong></td><td>Full control. Use kubeadm, k3s (lightweight), or RKE. High operational overhead. Only for on-prem, air-gapped, or extreme customisation needs.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Helm & Package Management', content: `
      <div class="content-section">
        <div class="content-label">What is Helm?</div>
        <div class="insight-box" style="border-left-color:#0f1689;background:#f0f0ff;">
          Helm is the package manager for Kubernetes — like apt/brew but for K8s resources. A <strong>Chart</strong> is a collection of YAML templates for a complete application. One <code>helm install</code> deploys your app with all its Deployments, Services, ConfigMaps, Ingress, RBAC in one shot. <strong>Values files</strong> override defaults per environment (dev vs prod).
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Core Helm Workflow</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;"># Add a chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install an app from a chart
helm install my-postgres bitnami/postgresql \
  --set auth.postgresPassword=secret \
  --namespace db --create-namespace

# Install your own chart (from ./chart dir)
helm install my-api ./chart -f values.prod.yaml

# Upgrade (rolling update via Helm)
helm upgrade my-api ./chart -f values.prod.yaml --atomic

# Rollback
helm rollback my-api 1             # back to revision 1

# List all releases
helm list --all-namespaces

# Uninstall
helm uninstall my-postgres -n db</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Chart Structure</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">my-api/
├── Chart.yaml            # name, version, description
├── values.yaml           # default values
├── values.prod.yaml      # prod overrides (committed separately)
└── templates/
    ├── deployment.yaml   # uses {{ .Values.image.tag }}
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── hpa.yaml
    └── _helpers.tpl      # shared template helpers</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Operators — K8s on Autopilot</div>
        <div class="insight-box">
          An Operator is a K8s controller that encodes <em>human operational knowledge</em> for a specific app. The PostgreSQL Operator knows how to: create a primary + replica, promote replica on primary failure, take PG-specific backups (not just disk snapshots), handle schema migrations, resize PVC storage. Install it once, create a <code>PostgresCluster</code> custom resource — the operator handles everything.
          <br><br>
          Real-world operators: <strong>Prometheus Operator</strong> (scrape config via CRDs), <strong>Strimzi</strong> (Kafka on K8s), <strong>cert-manager</strong> (auto TLS from Let's Encrypt), <strong>CloudNativePG</strong> (PostgreSQL), <strong>Argo CD</strong> (GitOps deployment).
        </div>
      </div>
    ` },
    { name: 'Security (RBAC & Pod Security)', content: `
      <div class="content-section">
        <div class="content-label">RBAC — Role-Based Access Control</div>
        <div class="insight-box" style="border-left-color:#ef4444;background:#fff5f5;">
          By default, any pod can call the K8s API Server with broad permissions. In production: every pod should run with a dedicated <strong>ServiceAccount</strong> that has minimal permissions (least privilege). Bind a Role to limit what it can do.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">---
# Role: can only read pods in "production" namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]     # NOT create, delete, update

---
# Bind role to a ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: monitoring-sa
  namespace: production
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Security Best Practices Checklist</div>
        <table class="nfr-table">
          <tr><td><strong>Run as non-root</strong></td><td><code>securityContext: { runAsNonRoot: true, runAsUser: 1000 }</code>. A container running as root + a container escape = root on the node. Non-root limits blast radius.</td></tr>
          <tr><td><strong>Read-only filesystem</strong></td><td><code>securityContext: { readOnlyRootFilesystem: true }</code>. Attacker can't write malware to the container filesystem. Mount specific writable dirs via emptyDir volumes.</td></tr>
          <tr><td><strong>Drop capabilities</strong></td><td><code>capabilities: { drop: ["ALL"] }</code>. Linux capabilities are fine-grained root sub-privileges. Most apps need zero. Drop all, add back only what's needed (e.g. NET_BIND_SERVICE for port &lt;1024).</td></tr>
          <tr><td><strong>No privilege escalation</strong></td><td><code>allowPrivilegeEscalation: false</code>. Prevents setuid binaries from gaining root. Should always be false.</td></tr>
          <tr><td><strong>Image scanning</strong></td><td>Use Trivy, Snyk, or AWS ECR scanning. Block images with critical CVEs in CI pipeline. Pin image tags to SHA256 digests — never use <code>:latest</code> in production.</td></tr>
          <tr><td><strong>Network policies</strong></td><td>Default-deny all ingress, then allow only what's needed. Limits lateral movement — a compromised pod can't connect to your DB unless explicitly allowed.</td></tr>
          <tr><td><strong>Secret management</strong></td><td>Don't commit secrets to git. Use external secret managers: AWS Secrets Manager + External Secrets Operator, HashiCorp Vault + Vault Agent. Secrets are synced into K8s Secrets and auto-rotated.</td></tr>
          <tr><td><strong>Admission controllers</strong></td><td>OPA Gatekeeper / Kyverno enforce policies at apply time. Block pods with <code>:latest</code>, missing resource limits, missing security context. Policy-as-code checked in CI/CD.</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Full Pod Security Context Example</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12px;padding:14px;border-radius:8px;line-height:1.8;overflow-x:auto;">spec:
  serviceAccountName: api-sa         # dedicated, least-privilege SA
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: api
    image: myapp@sha256:abc123...    # pinned digest, not :latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    resources:
      requests: { cpu: "100m", memory: "128Mi" }
      limits:   { memory: "256Mi" }  # no CPU limit (throttling)
    volumeMounts:
    - name: tmp
      mountPath: /tmp                # writable temp dir
  volumes:
  - name: tmp
    emptyDir: {}                     # ephemeral, in-memory option available</pre>
      </div>
    ` },
  ],

  rust: [
    { name: 'Smart Pointers', content: `
      <div class="content-section">
        <div class="content-label">Box&lt;T&gt; — Heap Allocation</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Box allocates a value on the heap and stores a pointer to it on the stack
let b = Box::new(5);
println!("{}", *b);   // Deref coercion — use like i32

// Main use case: recursive types (can't have infinite size on stack)
enum List {
    Cons(i32, Box&lt;List&gt;),
    Nil,
}
let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));

// Also: heap-allocated trait objects
let boxed: Box&lt;dyn std::fmt::Display&gt; = Box::new(42);
println!("{boxed}");</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Rc&lt;T&gt; — Reference Counting (Single-threaded)</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::rc::Rc;

let a = Rc::new(String::from("hello"));
let b = Rc::clone(&a);   // increments ref count — same heap data
let c = Rc::clone(&a);

println!("Count: {}", Rc::strong_count(&a));  // 3
// All three read the same String. Freed when count reaches 0.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">RefCell&lt;T&gt; — Interior Mutability</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::cell::RefCell;

let data = RefCell::new(vec![1, 2, 3]);
data.borrow().iter().for_each(|n| print!("{n} "));
data.borrow_mut().push(4);   // borrow rules checked at RUNTIME

// Rc&lt;RefCell&lt;T&gt;&gt; — multiple owners + mutation (single-threaded)
use std::rc::Rc;
let shared = Rc::new(RefCell::new(0));
let a = Rc::clone(&shared);
*a.borrow_mut() += 10;
println!("{}", shared.borrow());   // 10</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Box vs Rc vs Arc?</strong></td><td>Box: single owner, heap allocation, zero overhead. Rc: multiple owners, single thread, ref-counted. Arc: multiple owners, multi-thread, atomic ref count (slightly slower than Rc).</td></tr>
          <tr><td><strong>Q: When would RefCell panic?</strong></td><td>If you hold a borrow_mut() and then call borrow() or borrow_mut() again before releasing the first one — runtime equivalent of the compile-time borrow rules. In safe Rust you cannot cause UB, just a panic with a clear message.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Modules & Cargo', content: `
      <div class="content-section">
        <div class="content-label">Modules — Organise Your Code</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// src/lib.rs or src/main.rs
mod network {                       // inline module
    pub mod http {
        pub fn get(url: &str) -> String { format!("GET {url}") }
        fn internal() {}            // private to this module
    }
}

use crate::network::http;
fn main() { println!("{}", http::get("https://example.com")); }

// File-based modules:
// src/network.rs          OR  src/network/mod.rs
// src/network/http.rs

// In main.rs / lib.rs:
// mod network;   → compiler loads src/network.rs</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cargo Workflow</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">cargo new my_app            # binary
cargo new --lib my_lib      # library
cargo run                   # build + run
cargo test                  # all tests
cargo check                 # fast type-check
cargo clippy                # lint
cargo fmt                   # format
cargo build --release       # optimised binary
cargo doc --open            # documentation</pre>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">[package]
name    = "my_app"
version = "0.1.0"
edition = "2021"

[dependencies]
serde   = { version = "1", features = ["derive"] }
tokio   = { version = "1", features = ["full"] }
anyhow  = "1"
reqwest = { version = "0.11", features = ["json"] }</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Must-Know Crates</div>
        <table class="nfr-table">
          <tr><td><strong>serde + serde_json</strong></td><td>#[derive(Serialize, Deserialize)] — JSON, TOML, YAML, bincode. Most downloaded crate.</td></tr>
          <tr><td><strong>tokio</strong></td><td>Async runtime. Required for async/await I/O. De facto standard.</td></tr>
          <tr><td><strong>reqwest</strong></td><td>Async HTTP client. JSON, streaming, cookies, TLS.</td></tr>
          <tr><td><strong>anyhow / thiserror</strong></td><td>anyhow for apps (easy error propagation). thiserror for libraries (typed errors).</td></tr>
          <tr><td><strong>clap</strong></td><td>#[derive(Parser)] — full CLI from struct annotations.</td></tr>
          <tr><td><strong>rayon</strong></td><td>.par_iter() — data parallelism across all CPU cores, zero config.</td></tr>
          <tr><td><strong>sqlx</strong></td><td>Async SQL with compile-time checked queries (PostgreSQL, MySQL, SQLite).</td></tr>
          <tr><td><strong>axum / actix-web</strong></td><td>Async web frameworks. axum: ergonomic, tower-based. actix-web: very high performance.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Async / Await', content: `
      <div class="content-section">
        <div class="content-label">How Async Works</div>
        <div class="insight-box" style="border-left-color:#326CE5;background:#f0f4ff;">
          <strong>async fn</strong> returns a Future — a paused computation. <strong>.await</strong> resumes it. A runtime (Tokio) polls futures when they're ready. No thread blocked waiting for I/O — one thread handles thousands of concurrent connections.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Cargo.toml: tokio = { version = "1", features = ["full"] }
use tokio::time::{sleep, Duration};

async fn fetch_data(id: u32) -> String {
    sleep(Duration::from_millis(100)).await;   // non-blocking wait
    format!("data-{id}")
}

#[tokio::main]
async fn main() {
    // Sequential — 300ms total
    let a = fetch_data(1).await;
    let b = fetch_data(2).await;
    let c = fetch_data(3).await;

    // Concurrent — ~100ms total
    let (a, b, c) = tokio::join!(
        fetch_data(1),
        fetch_data(2),
        fetch_data(3),
    );
    println!("{a} {b} {c}");
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Real HTTP + JSON</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use serde::Deserialize;
#[derive(Deserialize, Debug)]
struct Post { id: u32, title: String }

#[tokio::main]
async fn main() -> anyhow::Result&lt;()&gt; {
    let post: Post = reqwest::get("https://jsonplaceholder.typicode.com/posts/1")
        .await?.json().await?;
    println!("{}: {}", post.id, post.title);
    Ok(())
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: async vs threads?</strong></td><td>Async: I/O-bound (HTTP, DB, file). Thousands of tasks on few threads. Threads: CPU-bound (compute, encryption). Use rayon for CPU parallelism.</td></tr>
          <tr><td><strong>Q: Why do I need an external runtime?</strong></td><td>Rust's Future trait is runtime-agnostic. Tokio is one runtime; async-std, smol, embassy (embedded) are others. You choose the right runtime for your use case. Zero runtime in the language core = zero overhead for code that doesn't use async.</td></tr>
        </table>
      </div>
    ` },
    { name: 'Common Patterns', content: `
      <div class="content-section">
        <div class="content-label">Builder Pattern</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">struct Config { host: String, port: u16, timeout: u64 }
struct ConfigBuilder { host: String, port: u16, timeout: u64 }

impl ConfigBuilder {
    fn new() -> Self { ConfigBuilder { host: "localhost".into(), port: 8080, timeout: 30 } }
    fn host(mut self, h: &str) -> Self { self.host = h.into(); self }
    fn port(mut self, p: u16)  -> Self { self.port = p; self }
    fn build(self) -> Config { Config { host: self.host, port: self.port, timeout: self.timeout } }
}

let cfg = ConfigBuilder::new().host("api.example.com").port(443).build();</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Newtype Pattern — Type Safety</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">struct Metres(f64);
struct Kilograms(f64);

fn bmi(weight: Kilograms, height: Metres) -> f64 { weight.0 / (height.0 * height.0) }
// bmi(height, weight) → compile error! Can't mix up units.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">From / Into Conversions</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">struct Email(String);
impl From&lt;String&gt; for Email {
    fn from(s: String) -> Self { Email(s) }
}
impl From&lt;&str&gt; for Email {
    fn from(s: &str) -> Self { Email(s.to_owned()) }
}

let e: Email = "user@example.com".into();  // Into given free by From impl
let e = Email::from(String::from("user@example.com"));</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Type State Pattern</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Encode state transitions in the type system — invalid states can't compile
struct Locked;
struct Unlocked;

struct Safe&lt;State&gt; { contents: String, _state: std::marker::PhantomData&lt;State&gt; }

impl Safe&lt;Locked&gt; {
    fn new(contents: &str) -> Self {
        Safe { contents: contents.into(), _state: std::marker::PhantomData }
    }
    fn unlock(self, _password: &str) -> Safe&lt;Unlocked&gt; {
        Safe { contents: self.contents, _state: std::marker::PhantomData }
    }
}
impl Safe&lt;Unlocked&gt; {
    fn get_contents(&self) -> &str { &self.contents }
    fn lock(self) -> Safe&lt;Locked&gt; {
        Safe { contents: self.contents, _state: std::marker::PhantomData }
    }
}

let safe = Safe::new("gold");
// safe.get_contents();    // ERROR: method doesn't exist on Safe&lt;Locked&gt;
let open = safe.unlock("1234");
println!("{}", open.get_contents());   // OK
let safe = open.lock();               // back to Locked</pre>
      </div>
    ` },
    { name: 'Rust vs Other Languages', content: `
      <div class="content-section">
        <div class="content-label">Head-to-Head</div>
        <table class="nfr-table">
          <tr style="background:#f8f8f8;">
            <td style="font-weight:800;">Aspect</td>
            <td style="font-weight:800;color:#B7410E;">Rust</td>
            <td style="font-weight:800;color:#555;">C++</td>
            <td style="font-weight:800;color:#00ACD7;">Go</td>
            <td style="font-weight:800;color:#3572A5;">Python</td>
          </tr>
          <tr><td><strong>Memory model</strong></td><td>Ownership (no GC, no manual free)</td><td>Manual (RAII helps)</td><td>GC</td><td>Ref counting + GC</td></tr>
          <tr><td><strong>Safety</strong></td><td>Safe by default</td><td>Unsafe by default</td><td>Safe (GC)</td><td>Safe (GC)</td></tr>
          <tr><td><strong>Performance</strong></td><td>C/C++ level</td><td>C/C++ level</td><td>~2-5x slower</td><td>~10-100x slower</td></tr>
          <tr><td><strong>Concurrency</strong></td><td>Data races → compile error</td><td>UB possible</td><td>Goroutines, GC pauses</td><td>GIL limits parallelism</td></tr>
          <tr><td><strong>Generics</strong></td><td>Monomorphized (zero-cost)</td><td>Templates (zero-cost)</td><td>Added Go 1.18</td><td>Dynamic (duck typing)</td></tr>
          <tr><td><strong>Ecosystem</strong></td><td>Cargo + crates.io (excellent)</td><td>Fragmented (cmake, vcpkg)</td><td>Go modules (good)</td><td>pip (fragmented)</td></tr>
          <tr><td><strong>Learning curve</strong></td><td>Steep (ownership model)</td><td>Very steep</td><td>Easy</td><td>Very easy</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">When to Pick Each</div>
        <table class="nfr-table">
          <tr><td><strong style="color:#B7410E;">Pick Rust</strong></td><td>Systems programming. GC pauses unacceptable (real-time, games, networking). Replacing unsafe C/C++. WebAssembly. CLI tools (ripgrep, fd, exa). Embedded. Long-running services where memory predictability matters.</td></tr>
          <tr><td><strong style="color:#00ACD7;">Pick Go</strong></td><td>Microservices and APIs. Team velocity matters. Simple concurrency model. Fast compile times. Devops tools (Docker, Kubernetes, Terraform are written in Go).</td></tr>
          <tr><td><strong style="color:#3572A5;">Pick Python</strong></td><td>Data science, ML, scripting. Rapid prototyping. Ecosystem (NumPy, PyTorch, pandas). Glue code between systems. Performance not a primary concern.</td></tr>
          <tr><td><strong style="color:#555;">Pick C++</strong></td><td>Game engines (Unreal). Existing C++ codebase. Maximum low-level control. Hardware-specific optimisations. Team is expert in C++.</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Discord's Real Case Study</div>
        <div class="insight-box">
          Discord's Read States service (tracks which messages you've read) was in Go. At 5M+ concurrent users, Go's GC caused latency spikes every 2 minutes — 99th percentile jumped from ~10ms to ~400ms. Memory use: ~4GB.<br><br>
          After rewriting in Rust: latency consistently under 10ms (no GC spikes). Memory dropped to ~400MB. Same workload, 10× less memory, no latency spikes.<br><br>
          <strong>Lesson:</strong> Go's GC is excellent for most workloads. But when you have millions of concurrent users and need predictable latency, Rust's lack of GC becomes a structural advantage.
        </div>
      </div>
    ` },
  ],

};

// ── PROBLEM STATEMENTS ────────────────────────────────────
