# Repository Polish QA Inventory

## User Request

- Run `repository-polish` in full-polish mode.
- Make the already-public repository presentable, documented, verified, committed, pushed, and final-mile published where available.

## Planned Deliverables

| artifact | planned change | QA expectation |
| --- | --- | --- |
| `README.md` | Replace thin README with public-facing English README, badges, language switch, feature summary, screenshots/dataset notes, setup, validation, release link | Links, commands, and claims match code |
| `README.ja.md` | Add Japanese README with parallel structure | Locale parity with English README |
| `LICENSE` | Add an OSS license | File exists and is referenced |
| `.github/workflows/ci.yml` | Add install/build validation workflow | Workflow paths and commands match `package.json` |
| `.github/workflows/pages.yml` | Add GitHub Pages deployment for the static demo shell | Build command and artifact path match Vite output |
| `assets/nekoneko-file-search-logo.svg` | Add simple reusable project SVG identity | SVG is well-formed and referenced |
| `vite.config.ts` | Support GitHub Pages base path only in Pages builds | Local dev remains `/`, Pages build uses repo base |
| repository metadata | Set description, homepage, and topics via `gh` | GitHub metadata readback confirms values |
| GitHub Pages | Enable Pages with Actions when possible | `gh api repos/.../pages` readback confirms status or records blocker |
| QA evidence | Run build/check and inspect staged payload | No large generated/dependency files staged |

## Claims To Verify Before Final Response

| claim | evidence |
| --- | --- |
| README and Japanese README are present and aligned | file inspection |
| CI and Pages workflows exist and use correct commands | workflow inspection |
| Static Pages build is supported without leaking Gemini keys | Vite base env and frontend mock fallback inspection |
| GitHub metadata is updated | `gh repo view` |
| GitHub Pages is enabled or blocker recorded | `gh api repos/.../pages` |
| Validation passed | `npm run check`, `npm run build` |
| Changes were committed and pushed | `git status -sb`, `git push` output |
