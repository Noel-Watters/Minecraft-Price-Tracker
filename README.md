# MC Exchange

MC Exchange is a trade tracking and price discovery platform for the CivMC Minecraft server. It captures in-game shop exchange data in real time and presents it through a public web interface, enabling players to browse shops, compare prices, and track item availability across server regions.

The project is composed of three independent components:

* **Minecraft Chat Relay** — A Fabric client-side mod that intercepts in-game shop messages and forwards them to the backend.
* **Backend** — A Node.js REST API that ingests, validates, stores, and serves exchange data.
* **Frontend** — A Next.js web application for browsing regions, shops, and exchange listings.

---

## Architecture Overview

```
[Minecraft Client]
        |
        | (Fabric mod intercepts chat)
        v
[mc-exchange-chat-relay]
        |
        | POST /api/exchanges (JSON over HTTP)
        v
[mc-exchange-backend] <---> [Supabase (PostgreSQL)]
        |
        | REST API
        v
[mc-exchange-frontend]
        |
        | Served to browser
        v
[End User]
```

---

## Components

---

### Minecraft Chat-relay

A Fabric client mod for Minecraft 1.21.8. When the player interacts with a shop sign, the game outputs a structured multi-line chat message. This mod listens for those messages, parses the exchange details (items, quantities, enchantments, coordinates, dimension), and sends a JSON payload to the backend API asynchronously.

#### Key files

* `ChatRelayMod.java` — Entry point. Registers the client message listener and handles multi-line message assembly with a 1-second timeout window.
* `ExchangeParser.java` — Parses raw chat into structured `ExchangeData`, including enchantment detection and compaction flags.
* `ChatRelayService.java` — Sends payloads to backend using Java `HttpClient`.

Default backend URL:

```
https://minecraft-price-tracker-1.onrender.com
```

#### Requirements

* Minecraft 1.21.8
* Fabric Loader >= 0.16.5
* Fabric API
* Java 21

#### Build

```bash
./gradlew build
```

Output:

```
build/libs/
```

---

### Backend

A Node.js (ESM) Express application that acts as the central data layer.

#### Responsibilities

* Ingest and deduplicate exchange events
* Validate payloads (types, coordinates, required fields)
* Store data in Supabase
* Compute floating exchange rates
* Serve API to frontend
* Handle role-based access (user/admin)

#### Route groups

| Route            | Auth       | Purpose                    |
| ---------------- | ---------- | -------------------------- |
| `/api/exchanges` | None       | Ingest exchange events     |
| `/user/*`        | None       | Public data access         |
| `/owner/*`       | User token | Shop management            |
| `/admin/*`       | Admin role | Full data + region control |

#### Environment variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=8080
```

#### Run locally

```bash
npm install
npm run dev
```

#### Docker

```bash
docker build -t mc-backend .
docker run -p 8080:8080 mc-backend
```

#### Dependencies

* Express 5
* @supabase/supabase-js
* helmet
* morgan
* cors
* node-cron
* axios

---

### Frontend

A Next.js 16 app using App Router, TypeScript, and Tailwind CSS.

#### Routes

| Route      | Access | Description                     |
| ---------- | ------ | ------------------------------- |
| `/`        | Public | Redirects to default region     |
| `/[slug]`  | Public | Region view (shops + exchanges) |
| `/search`  | Public | Cross-region item search        |
| `/login`   | Public | Auth page                       |
| `/owner/*` | Auth   | Shop management                 |
| `/admin/*` | Admin  | Region/admin tools              |

#### Key components

* `SearchNavBar`, `SearchBar`, `FilterMenu`, `FilterPillRow` — URL-driven filtering system
* `ShopCard` — Displays shop exchanges grouped by buy/sell/trade
* `ShopEditAddModal` — Create/edit shop
* `CreateRegionModal` — Admin region creation
* Role-based navigation bars

#### Data model

* **Region** — Named area with bounds + slug
* **Shop** — Player-owned entity inside region
* **Exchange** — Trade event (items, qty, price, timestamp)
* **FloatingExchange** — Computed best price per item

#### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

#### Run locally

```bash
npm install
npm run dev
```

#### Build

```bash
npm run build
```

---

## Database

Hosted on Supabase (PostgreSQL)

### Core tables

| Table              | Description              |
| ------------------ | ------------------------ |
| regions            | Region definitions       |
| shops              | Shop records             |
| exchanges          | Raw trade events         |
| floating_exchanges | Computed price summaries |
| users              | User roles               |

---

## Prerequisites

| Component  | Requirement            |
| ---------- | ---------------------- |
| Chat Relay | Java 21, Fabric Loader |
| Backend    | Node.js 20+            |
| Frontend   | Node.js 20+            |
| Database   | Supabase project       |

---

## License

The chat relay mod is licensed under CC0-1.0.
See individual component directories for additional licenses.
