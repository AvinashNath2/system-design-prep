# System Design Interview Prep

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://avinashnath2.github.io/system-design-prep)
[![Systems](https://img.shields.io/badge/Systems%20Covered-25-blue?style=for-the-badge)](https://avinashnath2.github.io/system-design-prep)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> **Crack any system design interview** — 25 real-world systems, each broken down into the exact 7 steps interviewers want to see.

🔗 **[Open the App →](https://avinashnath2.github.io/system-design-prep)**

---

## Why this exists

Most system design resources either give you a vague diagram or dump 50 pages of theory. This tool gives you **exactly what you need to say in an interview** — structured, concise, and focused on the reasoning interviewers care about.

Every system covers the same 7 steps so you build a repeatable mental model you can apply to any new system.

---

## 7-Step Framework

| Step | What you cover |
|------|---------------|
| 1. Functional Requirements | What the system must do (user-facing features) |
| 2. Non-Functional Requirements | CAP theorem choice + design patterns with rationale |
| 3. Capacity Estimation | Step-by-step math — storage, QPS, bandwidth |
| 4. High Level Design | Component diagram showing the full architecture |
| 5. Data Modeling | Schema tables with primary/foreign keys |
| 6. Deep Dive | The one tricky problem that makes this system unique |
| 7. Bottlenecks & Trade-offs | What breaks at scale and why |

---

## Systems Covered (25 total)

### Social & Content
| System | Key Patterns |
|--------|-------------|
| Reddit | Fan-out on Write · Vote Counting · Feed Ranking |
| Twitter Timeline | Fan-out on Read · Celebrity Problem · Hybrid Push-Pull |
| Bluesky | Decentralized · AT Protocol · Federation |
| YouTube | Video Transcoding · CDN · ABR Streaming |
| Spotify | Audio Streaming · CDN · Offline Cache |
| Netflix | Two-Tower ML · Offline Training · ANN Search |
| Twitch | RTMP Ingest · HLS Transcode · WebSocket Chat |

### Messaging & Collaboration
| System | Key Patterns |
|--------|-------------|
| Slack | WebSocket · Pub/Sub · Message Ordering |
| WhatsApp | E2E Encryption · Offline Delivery · Signal Protocol |
| Google Docs | OT / CRDT · Conflict Resolution · Real-time Sync |

### Marketplace & Fintech
| System | Key Patterns |
|--------|-------------|
| Airbnb | Geo Search · Availability Calendar · Double Booking Prevention |
| Tinder | Geo Matching · Swipe Queue · Quadtree Index |
| Payment System | Idempotency · ACID Transactions · Saga Pattern |
| Stock Exchange | Order Matching · Low Latency · Price-Time Priority |
| BookMyShow | Pessimistic Lock · Redis SET NX · Waiting Room |

### Infrastructure & Storage
| System | Key Patterns |
|--------|-------------|
| AWS S3 | Object Storage · Sharding · Multipart Upload |
| Amazon Lambda | Serverless · Cold Start · Event-driven |
| Apache Kafka | Event Streaming · Log Compaction · Consumer Groups |
| URL Shortener | Hashing · Redirect Cache · 301 vs 302 |
| Rate Limiter | Token Bucket · Sliding Window · Redis Atomic Ops |
| Push Notifications | Fan-out Delivery · Token Registry · Priority Queue |

### AI & Location
| System | Key Patterns |
|--------|-------------|
| LLMs / ChatGPT | Token Streaming · KV Cache · Inference at Scale |
| Uber | Geo Index · Driver Matching · Surge Pricing |
| Apple AirTag | BLE Crowd-sourcing · Privacy by Design · Rotating Keys |
| Google Typeahead | Trie · Prefix Index · Consistent Hashing |

### Analytics & Platform
| System | Key Patterns |
|--------|-------------|
| Segment | Event Pipeline · Fan-out · Dead Letter Queue |

---

## How to Use

**Option 1 — Online (recommended):**
Visit **[avinashnath2.github.io/system-design-prep](https://avinashnath2.github.io/system-design-prep)** — no install needed.

**Option 2 — Offline:**
```bash
git clone https://github.com/AvinashNath2/system-design-prep.git
cd system-design-prep
open index.html   # macOS
# or just double-click index.html on Windows/Linux
```

Zero dependencies. No build step. No npm install. Just HTML.

---

## Tech

Single HTML file — no framework, no bundler, no server required. All system content, diagrams (SVG), and styles are embedded in `index.html`. Works completely offline once cloned.

---

## Who this is for

- Software engineers preparing for FAANG / Big Tech system design rounds
- Students learning distributed systems concepts
- Engineers wanting to revise concepts quickly before an interview
- Anyone curious about how large-scale systems actually work

---

## Contributing

Found a mistake, want to add a system, or improve an explanation? PRs welcome.

1. Fork the repo
2. Edit `index.html` — find the relevant `systems['name']` object
3. Open a PR with a clear description of what changed

---

## License

MIT — free to use, share, and modify.
