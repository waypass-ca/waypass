# Graph Report - .  (2026-04-28)

## Corpus Check
- 64 files · ~31,753 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 216 nodes · 185 edges · 63 communities detected
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend API Handlers|Backend API Handlers]]
- [[_COMMUNITY_Cases List UI|Cases List UI]]
- [[_COMMUNITY_Vite Build Tooling|Vite Build Tooling]]
- [[_COMMUNITY_Case Detail UI|Case Detail UI]]
- [[_COMMUNITY_Family Page Editor|Family Page Editor]]
- [[_COMMUNITY_Settings Page|Settings Page]]
- [[_COMMUNITY_Inbox Messaging|Inbox Messaging]]
- [[_COMMUNITY_New Case Wizard|New Case Wizard]]
- [[_COMMUNITY_Family Widget Flow|Family Widget Flow]]
- [[_COMMUNITY_Home Dashboard|Home Dashboard]]
- [[_COMMUNITY_Crematoriums Management|Crematoriums Management]]
- [[_COMMUNITY_App Shell & States|App Shell & States]]
- [[_COMMUNITY_New Crematorium Wizard|New Crematorium Wizard]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Test Utilities|Test Utilities]]
- [[_COMMUNITY_App Root|App Root]]
- [[_COMMUNITY_Auth Context|Auth Context]]
- [[_COMMUNITY_Operational Alerts|Operational Alerts]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Auth Tests|Auth Tests]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_Cases Route|Cases Route]]
- [[_COMMUNITY_Portal Route|Portal Route]]
- [[_COMMUNITY_Crematoriums Route|Crematoriums Route]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Badge Component|Badge Component]]
- [[_COMMUNITY_Status Pill|Status Pill]]
- [[_COMMUNITY_Stat Card|Stat Card]]
- [[_COMMUNITY_Progress Track|Progress Track]]
- [[_COMMUNITY_Order Queue|Order Queue]]
- [[_COMMUNITY_Order Card|Order Card]]
- [[_COMMUNITY_Earnings Card|Earnings Card]]
- [[_COMMUNITY_Order Summary|Order Summary]]
- [[_COMMUNITY_Addon Row|Addon Row]]
- [[_COMMUNITY_Success Screen|Success Screen]]
- [[_COMMUNITY_Package Card|Package Card]]
- [[_COMMUNITY_Login Screen|Login Screen]]
- [[_COMMUNITY_Navbar|Navbar]]
- [[_COMMUNITY_Page Header|Page Header]]
- [[_COMMUNITY_Revenue Page|Revenue Page]]
- [[_COMMUNITY_Cases Table|Cases Table]]
- [[_COMMUNITY_Revenue Chart|Revenue Chart]]
- [[_COMMUNITY_Stats Row|Stats Row]]
- [[_COMMUNITY_Orders Hook|Orders Hook]]
- [[_COMMUNITY_Crematorium Portal|Crematorium Portal]]
- [[_COMMUNITY_Express Server|Express Server]]
- [[_COMMUNITY_Test Config|Test Config]]
- [[_COMMUNITY_Packages Tests|Packages Tests]]
- [[_COMMUNITY_Cases Tests|Cases Tests]]
- [[_COMMUNITY_Health Tests|Health Tests]]
- [[_COMMUNITY_Orders Tests|Orders Tests]]
- [[_COMMUNITY_Addons Tests|Addons Tests]]
- [[_COMMUNITY_Portal Tests|Portal Tests]]
- [[_COMMUNITY_Crematoriums Tests|Crematoriums Tests]]
- [[_COMMUNITY_Supabase Client (Backend)|Supabase Client (Backend)]]
- [[_COMMUNITY_Addons Route|Addons Route]]
- [[_COMMUNITY_Orders Route|Orders Route]]
- [[_COMMUNITY_Packages Route|Packages Route]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_React Entry Point|React Entry Point]]
- [[_COMMUNITY_Supabase Client (Frontend)|Supabase Client (Frontend)]]
- [[_COMMUNITY_Mock Data|Mock Data]]

## God Nodes (most connected - your core abstractions)
1. `mutate()` - 13 edges
2. `request()` - 10 edges
3. `React + Vite Template` - 7 edges
4. `@vitejs/plugin-react (Babel/OXC)` - 4 edges
5. `Hot Module Replacement (HMR)` - 3 edges
6. `@vitejs/plugin-react-swc (SWC)` - 3 edges
7. `Babel Transpiler` - 3 edges
8. `OXC Transformer` - 3 edges
9. `SWC Compiler` - 3 edges
10. `TypeScript Integration` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Vite Logo SVG` --conceptually_related_to--> `React + Vite Template`  [INFERRED]
  frontend/public/vite.svg → frontend/README.md

## Hyperedges (group relationships)
- **Fast Refresh Plugin Alternatives (Babel/OXC vs SWC)** — readme_plugin_react_babel, readme_plugin_react_swc, readme_hmr [EXTRACTED 0.95]
- **JavaScript Transpiler Options** — readme_babel, readme_oxc, readme_swc [INFERRED 0.82]

## Communities

### Community 0 - "Backend API Handlers"
Cohesion: 0.18
Nodes (21): addCaseDocument(), addCaseNote(), advanceOrder(), createCase(), createCrematorium(), deleteCrematorium(), fetchAddons(), fetchCase() (+13 more)

### Community 1 - "Cases List UI"
Cohesion: 0.13
Nodes (2): calcAge(), CasePreviewBody()

### Community 2 - "Vite Build Tooling"
Cohesion: 0.23
Nodes (13): Vite Logo SVG, Babel Transpiler, ESLint Rules, Hot Module Replacement (HMR), OXC Transformer, @vitejs/plugin-react (Babel/OXC), @vitejs/plugin-react-swc (SWC), React Compiler (+5 more)

### Community 3 - "Case Detail UI"
Cohesion: 0.18
Nodes (2): LogCustodyModal(), now()

### Community 4 - "Family Page Editor"
Cohesion: 0.2
Nodes (0): 

### Community 5 - "Settings Page"
Cohesion: 0.22
Nodes (0): 

### Community 6 - "Inbox Messaging"
Cohesion: 0.25
Nodes (0): 

### Community 7 - "New Case Wizard"
Cohesion: 0.29
Nodes (2): NewCasePage(), useData()

### Community 8 - "Family Widget Flow"
Cohesion: 0.29
Nodes (0): 

### Community 9 - "Home Dashboard"
Cohesion: 0.4
Nodes (2): getGreeting(), HomeDashboard()

### Community 10 - "Crematoriums Management"
Cohesion: 0.33
Nodes (0): 

### Community 11 - "App Shell & States"
Cohesion: 0.4
Nodes (2): activeSidebarItem(), FuneralDashboardPage()

### Community 12 - "New Crematorium Wizard"
Cohesion: 0.4
Nodes (0): 

### Community 13 - "Sidebar Navigation"
Cohesion: 0.5
Nodes (0): 

### Community 14 - "Test Utilities"
Cohesion: 1.0
Nodes (2): makeChain(), makeSupabaseMock()

### Community 15 - "App Root"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Auth Context"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Operational Alerts"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Auth Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Auth Tests"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Database Seeding"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Cases Route"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Portal Route"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Crematoriums Route"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Button Component"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Badge Component"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Status Pill"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Stat Card"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Progress Track"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Order Queue"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Order Card"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Earnings Card"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Order Summary"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Addon Row"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Success Screen"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Package Card"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Login Screen"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Navbar"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Page Header"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Revenue Page"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Cases Table"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Revenue Chart"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Stats Row"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Orders Hook"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Crematorium Portal"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Express Server"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Test Config"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Packages Tests"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Cases Tests"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Health Tests"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Orders Tests"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Addons Tests"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Portal Tests"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Crematoriums Tests"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Supabase Client (Backend)"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Addons Route"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Orders Route"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Packages Route"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "React Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Supabase Client (Frontend)"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Mock Data"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **3 isolated node(s):** `React Compiler Disabled — Dev/Build Performance Rationale`, `typescript-eslint`, `Vite Logo SVG`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Auth Middleware`** (2 nodes): `requireAuth()`, `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Tests`** (2 nodes): `makeRes()`, `auth.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Seeding`** (2 nodes): `seed.js`, `seed()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Route`** (2 nodes): `cases.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Portal Route`** (2 nodes): `portal.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematoriums Route`** (2 nodes): `crematoriums.js`, `shapeRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button Component`** (2 nodes): `Button()`, `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge Component`** (2 nodes): `Badge()`, `Badge.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Status Pill`** (2 nodes): `StatusPill.jsx`, `StatusPill()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stat Card`** (2 nodes): `StatCard.jsx`, `StatCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress Track`** (2 nodes): `ProgressTrack.jsx`, `ProgressTrack()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Order Queue`** (2 nodes): `OrderQueue.jsx`, `OrderQueue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Order Card`** (2 nodes): `OrderCard.jsx`, `OrderCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Earnings Card`** (2 nodes): `EarningsCard()`, `EarningsCard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Order Summary`** (2 nodes): `OrderSummary.jsx`, `OrderSummary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Addon Row`** (2 nodes): `AddonRow()`, `AddonRow.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Success Screen`** (2 nodes): `SuccessScreen.jsx`, `SuccessScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Card`** (2 nodes): `PackageCard.jsx`, `PackageCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Screen`** (2 nodes): `LoginScreen.jsx`, `LoginScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navbar`** (2 nodes): `Navbar.jsx`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Header`** (2 nodes): `PageHeader.jsx`, `PageHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Revenue Page`** (2 nodes): `RevenuePage.jsx`, `RevenuePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Table`** (2 nodes): `CasesTable()`, `CasesTable.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Revenue Chart`** (2 nodes): `RevenueChart.jsx`, `RevenueChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stats Row`** (2 nodes): `StatsRow.jsx`, `StatsRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orders Hook`** (2 nodes): `useOrders.js`, `useOrders()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematorium Portal`** (2 nodes): `CrematoriumPortalPage()`, `CrematoriumPortalPage.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Express Server`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Config`** (1 nodes): `vitest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Packages Tests`** (1 nodes): `packages.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cases Tests`** (1 nodes): `cases.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Health Tests`** (1 nodes): `health.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orders Tests`** (1 nodes): `orders.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Addons Tests`** (1 nodes): `addons.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Portal Tests`** (1 nodes): `portal.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crematoriums Tests`** (1 nodes): `crematoriums.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Client (Backend)`** (1 nodes): `supabase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Addons Route`** (1 nodes): `addons.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orders Route`** (1 nodes): `orders.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Packages Route`** (1 nodes): `packages.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Client (Frontend)`** (1 nodes): `supabase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mock Data`** (1 nodes): `mockData.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `React Compiler Disabled — Dev/Build Performance Rationale`, `typescript-eslint`, `Vite Logo SVG` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Cases List UI` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._