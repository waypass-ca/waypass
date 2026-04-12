# Graph Report - .  (2026-04-12)

## Corpus Check
- Corpus is ~24,249 words - fits in a single context window. You may not need a graph.

## Summary
- 186 nodes · 156 edges · 61 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend API Layer|Backend API Layer]]
- [[_COMMUNITY_Dev Tooling & Build Assets|Dev Tooling & Build Assets]]
- [[_COMMUNITY_Case Detail & Authorization|Case Detail & Authorization]]
- [[_COMMUNITY_Family Portal Editor|Family Portal Editor]]
- [[_COMMUNITY_Settings & Admin|Settings & Admin]]
- [[_COMMUNITY_New Case Workflow|New Case Workflow]]
- [[_COMMUNITY_Family Widget Steps|Family Widget Steps]]
- [[_COMMUNITY_Crematorium Management|Crematorium Management]]
- [[_COMMUNITY_New Crematorium Wizard|New Crematorium Wizard]]
- [[_COMMUNITY_Funeral Dashboard Shell|Funeral Dashboard Shell]]
- [[_COMMUNITY_App Root & Routing|App Root & Routing]]
- [[_COMMUNITY_Auth Context|Auth Context]]
- [[_COMMUNITY_Operational Alerts|Operational Alerts]]
- [[_COMMUNITY_Backend Test Setup|Backend Test Setup]]
- [[_COMMUNITY_UI Button Component|UI Button Component]]
- [[_COMMUNITY_UI Badge Component|UI Badge Component]]
- [[_COMMUNITY_Status Pill Component|Status Pill Component]]
- [[_COMMUNITY_Stat Card Component|Stat Card Component]]
- [[_COMMUNITY_Progress Track Component|Progress Track Component]]
- [[_COMMUNITY_Crematorium Order Queue|Crematorium Order Queue]]
- [[_COMMUNITY_Crematorium Order Card|Crematorium Order Card]]
- [[_COMMUNITY_Crematorium Earnings Card|Crematorium Earnings Card]]
- [[_COMMUNITY_Widget Order Summary|Widget Order Summary]]
- [[_COMMUNITY_Widget Addon Row|Widget Addon Row]]
- [[_COMMUNITY_Widget Success Screen|Widget Success Screen]]
- [[_COMMUNITY_Widget Package Card|Widget Package Card]]
- [[_COMMUNITY_Login Screen|Login Screen]]
- [[_COMMUNITY_Sidebar Layout|Sidebar Layout]]
- [[_COMMUNITY_Navbar Layout|Navbar Layout]]
- [[_COMMUNITY_Page Header Layout|Page Header Layout]]
- [[_COMMUNITY_Cases Page|Cases Page]]
- [[_COMMUNITY_Revenue Page|Revenue Page]]
- [[_COMMUNITY_Cases Table|Cases Table]]
- [[_COMMUNITY_Revenue Chart|Revenue Chart]]
- [[_COMMUNITY_Stats Row|Stats Row]]
- [[_COMMUNITY_useOrders Hook|useOrders Hook]]
- [[_COMMUNITY_Crematorium Portal Page|Crematorium Portal Page]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Auth Middleware Tests|Auth Middleware Tests]]
- [[_COMMUNITY_Database Seed Script|Database Seed Script]]
- [[_COMMUNITY_Cases Route|Cases Route]]
- [[_COMMUNITY_Portal Route|Portal Route]]
- [[_COMMUNITY_Crematoriums Route|Crematoriums Route]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Frontend Supabase Client|Frontend Supabase Client]]
- [[_COMMUNITY_Mock Data|Mock Data]]
- [[_COMMUNITY_Backend Server|Backend Server]]
- [[_COMMUNITY_Vitest Config|Vitest Config]]
- [[_COMMUNITY_Packages Route Tests|Packages Route Tests]]
- [[_COMMUNITY_Cases Route Tests|Cases Route Tests]]
- [[_COMMUNITY_Health Route Tests|Health Route Tests]]
- [[_COMMUNITY_Orders Route Tests|Orders Route Tests]]
- [[_COMMUNITY_Addons Route Tests|Addons Route Tests]]
- [[_COMMUNITY_Portal Route Tests|Portal Route Tests]]
- [[_COMMUNITY_Crematoriums Route Tests|Crematoriums Route Tests]]
- [[_COMMUNITY_Backend Supabase Client|Backend Supabase Client]]
- [[_COMMUNITY_Addons Route|Addons Route]]
- [[_COMMUNITY_Orders Route|Orders Route]]
- [[_COMMUNITY_Packages Route|Packages Route]]

## God Nodes (most connected - your core abstractions)
1. `mutate()` - 13 edges
2. `request()` - 10 edges
3. `React + Vite Template` - 8 edges
4. `@vitejs/plugin-react (Babel/OXC)` - 4 edges
5. `Hot Module Replacement (HMR)` - 3 edges
6. `@vitejs/plugin-react-swc (SWC)` - 3 edges
7. `Babel Transpiler` - 3 edges
8. `OXC Transformer` - 3 edges
9. `SWC Compiler` - 3 edges
10. `TypeScript Integration` - 3 edges

## Surprising Connections (you probably didn't know these)
- `React Logo SVG` --conceptually_related_to--> `React + Vite Template`  [INFERRED]
  frontend/src/assets/react.svg → frontend/README.md
- `Vite Logo SVG` --conceptually_related_to--> `React + Vite Template`  [INFERRED]
  frontend/public/vite.svg → frontend/README.md
- `React Logo SVG` --semantically_similar_to--> `Vite Logo SVG`  [INFERRED] [semantically similar]
  frontend/src/assets/react.svg → frontend/public/vite.svg

## Hyperedges (group relationships)
- **Fast Refresh Plugin Alternatives (Babel/OXC vs SWC)** — readme_plugin_react_babel, readme_plugin_react_swc, readme_hmr [EXTRACTED 0.95]
- **JavaScript Transpiler Options** — readme_babel, readme_oxc, readme_swc [INFERRED 0.82]
- **React + Vite Brand Assets** — asset_react_svg, asset_vite_svg, readme_react_vite_template [INFERRED 0.78]

## Communities

### Community 0 - "Backend API Layer"
Cohesion: 0.18
Nodes (21): addCaseDocument(), addCaseNote(), advanceOrder(), createCase(), createCrematorium(), deleteCrematorium(), fetchAddons(), fetchCase() (+13 more)

### Community 1 - "Dev Tooling & Build Assets"
Cohesion: 0.22
Nodes (14): React Logo SVG, Vite Logo SVG, Babel Transpiler, ESLint Rules, Hot Module Replacement (HMR), OXC Transformer, @vitejs/plugin-react (Babel/OXC), @vitejs/plugin-react-swc (SWC) (+6 more)

### Community 2 - "Case Detail & Authorization"
Cohesion: 0.18
Nodes (2): CustodyModal(), now()

### Community 3 - "Family Portal Editor"
Cohesion: 0.2
Nodes (0): 

### Community 4 - "Settings & Admin"
Cohesion: 0.22
Nodes (0): 

### Community 5 - "New Case Workflow"
Cohesion: 0.29
Nodes (2): NewCasePage(), useData()

### Community 6 - "Family Widget Steps"
Cohesion: 0.29
Nodes (0): 

### Community 7 - "Crematorium Management"
Cohesion: 0.33
Nodes (0): 

### Community 8 - "New Crematorium Wizard"
Cohesion: 0.4
Nodes (0): 

### Community 9 - "Funeral Dashboard Shell"
Cohesion: 0.5
Nodes (2): activeSidebarItem(), FuneralDashboardPage()

### Community 10 - "App Root & Routing"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Auth Context"
Cohesion: 0.67
Nodes (0): 

### Community 12 - "Operational Alerts"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Backend Test Setup"
Cohesion: 1.0
Nodes (2): makeChain(), makeSupabaseMock()

### Community 14 - "UI Button Component"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "UI Badge Component"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Status Pill Component"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Stat Card Component"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Progress Track Component"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Crematorium Order Queue"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Crematorium Order Card"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Crematorium Earnings Card"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Widget Order Summary"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Widget Addon Row"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Widget Success Screen"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Widget Package Card"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Login Screen"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Sidebar Layout"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Navbar Layout"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Page Header Layout"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Cases Page"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Revenue Page"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Cases Table"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Revenue Chart"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Stats Row"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "useOrders Hook"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Crematorium Portal Page"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Auth Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Auth Middleware Tests"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Database Seed Script"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Cases Route"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Portal Route"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Crematoriums Route"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "App Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Frontend Supabase Client"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Mock Data"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Backend Server"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Vitest Config"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Packages Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Cases Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Health Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Orders Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Addons Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Portal Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Crematoriums Route Tests"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Backend Supabase Client"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Addons Route"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Orders Route"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Packages Route"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **2 isolated node(s):** `React Compiler Disabled — Dev/Build Performance Rationale`, `typescript-eslint`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `UI Button Component`** (2 nodes): `Button()`, `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UI Badge Component`** (2 nodes): `Badge()`, `Badge.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Status Pill Component`** (2 nodes): `StatusPill.jsx`, `StatusPill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stat Card Component`** (2 nodes): `StatCard.jsx`, `StatCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress Track Component`** (2 nodes): `ProgressTrack.jsx`, `ProgressTrack()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematorium Order Queue`** (2 nodes): `OrderQueue.jsx`, `OrderQueue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematorium Order Card`** (2 nodes): `OrderCard.jsx`, `OrderCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematorium Earnings Card`** (2 nodes): `EarningsCard()`, `EarningsCard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Widget Order Summary`** (2 nodes): `OrderSummary.jsx`, `OrderSummary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Widget Addon Row`** (2 nodes): `AddonRow()`, `AddonRow.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Widget Success Screen`** (2 nodes): `SuccessScreen.jsx`, `SuccessScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Widget Package Card`** (2 nodes): `PackageCard.jsx`, `PackageCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Screen`** (2 nodes): `LoginScreen.jsx`, `LoginScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Layout`** (2 nodes): `Sidebar.jsx`, `Sidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navbar Layout`** (2 nodes): `Navbar.jsx`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Header Layout`** (2 nodes): `PageHeader.jsx`, `PageHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Page`** (2 nodes): `CasesPage()`, `CasesPage.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Revenue Page`** (2 nodes): `RevenuePage.jsx`, `RevenuePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Table`** (2 nodes): `CasesTable()`, `CasesTable.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Revenue Chart`** (2 nodes): `RevenueChart.jsx`, `RevenueChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stats Row`** (2 nodes): `StatsRow.jsx`, `StatsRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useOrders Hook`** (2 nodes): `useOrders.js`, `useOrders()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematorium Portal Page`** (2 nodes): `CrematoriumPortalPage()`, `CrematoriumPortalPage.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Middleware`** (2 nodes): `requireAuth()`, `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Middleware Tests`** (2 nodes): `makeRes()`, `auth.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Seed Script`** (2 nodes): `seed.js`, `seed()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Route`** (2 nodes): `cases.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Portal Route`** (2 nodes): `portal.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematoriums Route`** (2 nodes): `crematoriums.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Supabase Client`** (1 nodes): `supabase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mock Data`** (1 nodes): `mockData.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Server`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config`** (1 nodes): `vitest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Packages Route Tests`** (1 nodes): `packages.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Route Tests`** (1 nodes): `cases.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Health Route Tests`** (1 nodes): `health.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orders Route Tests`** (1 nodes): `orders.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Addons Route Tests`** (1 nodes): `addons.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Portal Route Tests`** (1 nodes): `portal.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematoriums Route Tests`** (1 nodes): `crematoriums.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Supabase Client`** (1 nodes): `supabase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Addons Route`** (1 nodes): `addons.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orders Route`** (1 nodes): `orders.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Packages Route`** (1 nodes): `packages.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `React + Vite Template` (e.g. with `React Logo SVG` and `Vite Logo SVG`) actually correct?**
  _`React + Vite Template` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `React Compiler Disabled — Dev/Build Performance Rationale`, `typescript-eslint` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._