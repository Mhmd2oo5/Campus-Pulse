# Campus Pulse

A campus resource platform built with HTML, CSS, and vanilla JavaScript. This branch implements the homepage and resource directory frontend.

## Preview the frontend

Use Node.js 20 or newer. The preview and frontend tests use Node's built-in modules, so they do not require `npm install` or a running database.

```sh
npm run start:frontend
```

Open <http://127.0.0.1:4173>. Set `PORT` to use another local port. Serve `public/` over HTTP rather than opening HTML directly, because the directory uses JavaScript modules. `frontend/serve.cjs` is a development-only static server; it does not provide application APIs.

## What is included

- Responsive homepage, desktop navigation, and collapsible mobile navigation.
- Twelve clearly labeled sample resources: three each for study areas, computer labs, printers, and cafeterias.
- Search by name, building, description, and features; category filtering; sorting; result counts and empty states.
- Search, category, sort, and saved-view filters preserved in the URL.
- Resource details in a keyboard-accessible native dialog, with Escape dismissal and focus restoration.
- Browser-local saved places that survive reloads. Browsing still works if storage is unavailable.
- Recommendation controls for category, building, and category-specific preference. The preview shows up to two compatible examples and explains its limits.
- Original signup/login validation and demo account flow. Login moved from `index.html` to `login.html`; `index.html` is now the homepage and `main.html` remains a compatibility redirect. The home screen shows only the username, and new demo sessions no longer store the password.
- Local SVG illustrations with no third-party image, font, or framework dependencies.

## Backend integration status

The starting repository contains frontend account prototypes, a package manifest, and a lockfile. It has no Express entry point, REST route implementations, resource endpoint contracts, MySQL schema, or database seed files. No resource APIs can be connected from that source, and this frontend does not guess or call endpoints. Backend dependencies and the lockfile are unchanged.

`public/js/directory-model.mjs` owns explicit preview fixtures and pure directory helpers. These fixtures are not a database seed or verified campus data. All conditions are `Unknown`; capacity and opening hours remain unprovided. Active status refers only to inclusion in the sample directory. Preview recommendations match category/building, without assigning scores or treating unknown conditions as favorable. Preference ranking, report freshness, reports/votes, report submission, and the dashboard await backend contracts and later frontend work.

Once actual APIs are available, replace the fixture data source with Fetch calls using those documented routes and response fields. Add loading, empty, and retryable error states around those requests; preserve safe text rendering. Use the backend's authoritative session, report timestamps, active status, estimated conditions, and recommendation explanations rather than deriving live claims from preview fixtures.

The retained account implementation uses browser-local demo credentials. It is not secure production authentication and does not implement the project's server sessions, password hashing, or roles. Those remain backend work. Only frontend navigation and password exposure on the former home screen were changed here.

## Frontend checks

```sh
npm run test:frontend
node --check public/js/directory.mjs
node --check public/js/directory-model.mjs
node --check public/js/auth.js
```

The automated suite covers fixture completeness, combined search/filter behavior, sorting, saved filters, malformed storage/URL values, inactive-resource exclusion, category-specific preferences, and compatible preview suggestions without fabricated scores.

Browser review covers phone/tablet/desktop layouts, mobile menu, search/category composition, empty/reset states, sorting, URL/reload persistence, bookmarking, details/Escape/focus restoration, recommendation controls, and the existing signup/login/logout flow. See `frontend/QA.md` for the recorded review and remaining integration limits.
