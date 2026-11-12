# Bangladesh AI Governance Platform — Observatory Dashboard TODO

শেষ আপডেট: ২০২৬-১১-১২

## বর্তমান অবস্থার সারাংশ

এই project-এ মূল platform branding হলো **Bangladesh AI Governance Platform**। Platformটি **Atlas AI Institute initiative** হিসেবে branded হয়েছে। এর একটি প্রধান module হলো **Bangladesh AI Observatory**।

Reference হিসেবে `https://ai-governance-observatory.atlasai.institute/observatory` দেখা হয়েছে। Reference dashboard-এ dark command-center layout, telemetry/status indicators, global/country map, evidence/provenance layer, metric cards এবং multi-layer navigation আছে। আমাদের project-এ সেই visual direction-এর সঙ্গে existing Bangladesh green palette মিলিয়ে একটি Bangladesh-focused Observatory dashboard তৈরি করার কাজ শুরু হয়েছে।

## সম্পন্ন কাজ

### ১. Platform branding ও shared header

- Homepage ও internal route-গুলোর জন্য shared fixed header component তৈরি হয়েছে:
  - `client/src/components/SiteHeader.tsx`
- App shell-এ shared header mount করা হয়েছে:
  - `client/src/App.tsx`
- Homepage-এর duplicate header সরানো হয়েছে।
- পুরনো page-specific assessment header hide করে shared header ব্যবহার করা হয়েছে।
- Header-এ official brand রাখা হয়েছে:
  - Bangladesh AI Governance Platform
  - An Atlas AI Institute initiative
- Header-এ একই navigation, language switcher, login/logout control এবং responsive mobile menu আছে।

### ২. Typography

- Bengali UI-এর জন্য **Hind Siliguri** local webfont bundle করা হয়েছে।
- চারটি weight যুক্ত আছে:
  - 400
  - 500
  - 600
  - 700
- Font files:
  - `client/public/fonts/hind-siliguri/HindSiliguri-400.woff2`
  - `client/public/fonts/hind-siliguri/HindSiliguri-500.woff2`
  - `client/public/fonts/hind-siliguri/HindSiliguri-600.woff2`
  - `client/public/fonts/hind-siliguri/HindSiliguri-700.woff2`
- Typography readability pass করা হয়েছে। Body copy, labels, navigation, forms ও headings আগের তুলনায় বেশি readable করা হয়েছে।

### ৩. Observatory-এর existing data workflow

- Published observations দেখানো হয়।
- Indicator catalog দেখানো হয়।
- Source, publisher, URL এবং methodology version সংরক্ষণ করা হয়।
- Admin user source, indicator ও observation create করতে পারে।
- Observation draft/published/archived status workflow আছে।
- CSV import panel আছে।
- Existing comparison chart component আছে।
- Public data fabricated না দেখানোর policy copy আছে।

### ৪. Bangladesh map asset

- Bangladesh-এর geographic boundary asset তৈরি করার কাজ শুরু হয়েছে।
- `client/public/bangladesh-outline.svg` ফাইল তৈরি হয়েছে।
- এটি open Bangladesh geographic data থেকে simplified boundary হিসেবে তৈরি করা হয়েছে।
- Map source/attribution review করা হয়েছে:
  - `https://github.com/ifahimreza/bangladesh-geojson`
  - Boundary data-এর license: CC BY 4.0
- Public-domain Natural Earth route যাচাই করা হয়েছিল, তবে response format usable SVG হিসেবে সরাসরি পাওয়া যায়নি।

### ৫. Observatory command-center component

`client/src/pages/Observatory.tsx`-এ নতুন component structure শুরু হয়েছে:

- `BangladeshSignalMap`
- National governance coverage map panel
- Live register badge
- Bangladesh map image layer
- Dhaka, Khulna, Sylhet ও Chattogram hotspot markers
- System telemetry card
- Data quality card
- Observatory layers card
- Coverage percentage indicator
- Registered signals এবং source-linked coverage legend

এই component existing `observations.length` এবং `indicators.length` ব্যবহার করে dynamic summary দেখায়। জাতীয় পরিসংখ্যান invent করা হয়নি।

## সর্বশেষ যে কাজটি আংশিক হয়েছে

Dark Observatory dashboard-এর React structure এবং map component তৈরি হয়েছে, কিন্তু তার matching CSS visual layer সম্পূর্ণভাবে apply হয়নি। অর্থাৎ:

- React component source যোগ হয়েছে।
- Bangladesh map SVG যোগ হয়েছে।
- Map panel markup যোগ হয়েছে।
- Intelligence rail markup যোগ হয়েছে।
- কিন্তু dark theme, grid background, neon-green map treatment, dashboard card styling এবং responsive layout-এর নতুন CSS block এখনো সম্পূর্ণভাবে `client/src/index.css`-এ যোগ হয়নি।

সুতরাং সর্বশেষ ZIP-এ এই partial implementation থাকবে। এটি ইচ্ছাকৃতভাবে documented রাখা হলো যাতে পরের কাজ শুরু করার সময় অসম্পূর্ণ অংশ ভুল করে complete ধরে নেওয়া না হয়।

## পরবর্তী কাজ — অগ্রাধিকার অনুযায়ী

### P0 — Dark Observatory visual layer সম্পূর্ণ করা

1. `client/src/index.css`-এ Observatory-specific dark theme যোগ করতে হবে।
2. শুধু `/observatory` route-এ dark background apply করতে হবে।
3. Existing green palette-এর compatible dark colors ব্যবহার করতে হবে:
   - deep navy/forest background
   - dark teal surface
   - cyan-green accent
   - muted green-gray text
4. Shared header-কে Observatory route-এ dark variant দিতে হবে, কিন্তু homepage ও অন্যান্য route-এ light variant রাখতে হবে।
5. `.observatory-command-grid` দুই-column responsive layout সম্পূর্ণ করতে হবে।
6. `.observatory-map-card` এবং `.observatory-intel-card` style করতে হবে।
7. Bangladesh SVG map-এর fill, glow, map grid, longitude/latitude labels এবং hotspots style করতে হবে।
8. Mobile layout-এ map, footer legend এবং intel cards stack করতে হবে।

### P0 — Observatory data visualization উন্নত করা

1. Existing `ObservatoryComparisonChart`-কে dark theme-এর সঙ্গে visually align করতে হবে।
2. Chart-এর grid, axis label, tooltip, legend এবং empty state readable করতে হবে।
3. Published observations না থাকলে dashboard-এ “Awaiting source-linked records” state দেখাতে হবে।
4. Indicator count ও observation count-এর জন্য clear metric cards রাখতে হবে।
5. Source-linked provenance state যেন dashboard-এর primary trust signal হয় তা নিশ্চিত করতে হবে।

### P1 — Bangladesh mapকে data-driven করা

1. বর্তমানে hotspot markerগুলো visual orientation-এর জন্য static। এগুলোকে real source-linked records বা division-level coverage data-এর সঙ্গে bind করতে হবে।
2. Division-level indicator coverage data model প্রয়োজন হলে database schema update করতে হবে।
3. Map interaction যোগ করা যেতে পারে:
   - hover tooltip
   - division selection
   - filtered observation list
   - source count
   - last updated date
4. কোনো real data না থাকলে UI-তে placeholder বা fabricated national estimate দেখানো যাবে না।

### P1 — Reference-inspired modules

Reference dashboard-এর visual ideas থেকে নিম্নলিখিত modules ভবিষ্যতে যোগ করা যেতে পারে:

- Mission Control / Observatory overview
- Evidence Graph
- Policy Radar
- Source provenance ledger
- Update activity feed
- Methodology and confidence panel
- Country/division comparison
- Downloadable citation bundle

প্রথম release-এ এগুলোকে actual supported data ছাড়া “live”, “verified”, “telemetry online” বা “AI intelligence” হিসেবে label করা যাবে না।

### P1 — Header ও route consistency

1. Shared fixed header সব route-এ visually check করতে হবে।
2. Workspace-এর existing topbar shared header-এর নিচে cleanly বসে কি না যাচাই করতে হবে।
3. Auth-gated route-এ header overlap হচ্ছে কি না mobile viewport-এ পরীক্ষা করতে হবে।
4. Observatory route-এ dark header এবং other route-এ light header transition ঠিক আছে কি না দেখতে হবে।
5. Header-এর navigation থেকে `/observatory` ও `/assessment` route-এ navigation test করতে হবে।

### P2 — Accessibility ও quality

1. Map-এর accessible title এবং description যাচাই করতে হবে।
2. Hotspot marker-এর keyboard/hover alternative প্রয়োজন কি না নির্ধারণ করতে হবে।
3. Dark theme contrast WCAG AA-এর কাছাকাছি আছে কি না যাচাই করতে হবে।
4. Bengali এবং English locale-এ overflow পরীক্ষা করতে হবে।
5. 375px, 768px এবং 1280px viewport-এ screenshot review করতে হবে।
6. Reduced motion preference থাকলে glow/animation কমাতে হবে।

### P2 — Asset attribution ও documentation

1. Bangladesh map asset-এর source/license note project documentation-এ স্থায়ীভাবে রাখা উচিত।
2. `docs/`-এ Observatory visual system ও data provenance policy লিখতে হবে।
3. Map source update হলে asset regeneration steps লিখে রাখতে হবে।

## বর্তমান validation evidence

শেষ verified state-এ:

- `pnpm check` pass করেছে।
- `pnpm test` pass করেছে: 47 passed, 3 staging tests skipped।
- `pnpm build` pass করেছে।
- Bangladesh catalog verification pass করেছে: 16 controls, 8 sources।
- Live preview HTTP 200 দিচ্ছে।
- Hind Siliguri font files live preview-তে HTTP 200 দিচ্ছে।

Observatory map component এবং সর্বশেষ CSS completion-এর পরে আবার এই তিনটি command চালাতে হবে:

```bash
pnpm check
pnpm test
pnpm build
```

## Relevant files

- `client/src/components/SiteHeader.tsx`
- `client/src/App.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Observatory.tsx`
- `client/src/components/ObservatoryComparisonChart.tsx`
- `client/src/index.css`
- `client/public/bangladesh-outline.svg`
- `client/public/fonts/hind-siliguri/`
- `client/public/manus-routes.json`
- `client/index.html`

## Reference links

- Reference Observatory: https://ai-governance-observatory.atlasai.institute/observatory
- Bangladesh open geographic data: https://github.com/ifahimreza/bangladesh-geojson
- Bangladesh map source information: https://geojson-maps.kyd.au/countries/BGD
