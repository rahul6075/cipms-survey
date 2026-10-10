<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# App map (read first, keep current)

`docs/app-map/` is the source of truth for how CIPMS fits together: modules, pages, API routes, data stores, roles and known gaps.

- **Before any work:** read `docs/app-map/cipms-architecture.json` (the cards hold the core journey, roles, data model and known gaps). Open `cipms-architecture.html` in a browser for the visual map.
- **Branch workflow:** only `main` is kept. The map always describes the latest code on `main`.
- **Before every push to `main`:** if the change adds, removes or rewires a page, API route, model, role rule or external service, update the map in the same push:
  1. Edit `docs/app-map/cipms-architecture.json` (components, connections, cards, and `sources` line numbers).
  2. Set `meta.repository.revision` to the commit being pushed (`git rev-parse HEAD` after committing the code change).
  3. Delete the old `cipms-architecture.*.json` receipts and the `.html`, then regenerate with the archify skill:
     `node ~/.claude/skills/archify/bin/archify.mjs finalize architecture docs/app-map/cipms-architecture.json docs/app-map/cipms-architecture.html --repo-root . --quality showcase --json`
  4. Only push when all four gates pass (validate, deliver, check, browser-check).
