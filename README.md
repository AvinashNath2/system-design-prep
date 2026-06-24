# System Design Interview Prep

An interactive, single-page study tool covering 25 real-world systems — each broken down into the 7 steps that matter most in interviews.

🔗 **[Open the app →](https://avinashnath2.github.io/system-design-prep)**

---

## What's inside

Every system card covers:

1. **Functional Requirements** — what the system must do
2. **Non-Functional Requirements** — CAP theorem choice + design patterns with rationale
3. **Capacity Estimation** — step-by-step math (not just final numbers)
4. **High Level Design** — component diagram showing the full architecture
5. **Data Modeling** — schema tables with primary/foreign keys
6. **Deep Dive** — the one tricky problem that makes this system unique
7. **Bottlenecks & Trade-offs** — what breaks at scale and why

---

## Systems covered

### Social & Content
| System | Key Patterns |
|--------|-------------|
| Reddit | Fan-out on Write · Vote Counting · Feed Ranking |
| Twitter Timeline | Fan-out on Read · Celebrity Problem |
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
| Airbnb | Geo Search · Availability Calendar · Double Booking |
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
| Rate Limiter | Token Bucket · Sliding Window · Redis Atomic |
| Push Notifications | Fan-out Delivery · Token Registry · Priority Queue |

### AI & Location
| System | Key Patterns |
|--------|-------------|
| LLMs / ChatGPT | Token Streaming · KV Cache · Inference at Scale |
| Uber | Geo Index · Driver Matching · Surge Pricing |
| Apple AirTag | BLE Crowd-source · Privacy by Design · Rotating Keys |
| Google Typeahead | Trie · Prefix Index · Consistent Hash |

### Analytics & Platform
| System | Key Patterns |
|--------|-------------|
| Segment | Event Pipeline · Fan-out · Dead Letter Queue |

---

## Tech

Single HTML file — no build step, no dependencies, no framework. Open `index.html` directly in a browser or visit the GitHub Pages link above.
