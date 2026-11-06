# نِيّة — NIYYAH

Development release 0.1. Frontend: GitHub Pages. API and database: Cloudflare Workers and D1 through Sites. No custom domain.

## Run

Node 22+: `npm ci`, `node scripts/build.mjs`. Serve `public/` locally. Deploy Pages via the included Actions workflow after choosing GitHub Actions as the Pages source.

## Implemented

Arabic responsive PWA; offline shell and optional Quran package; Adhan prayer calculation with method and Asr selection; city coordinates; true-north qibla bearing; Umm al-Qura date and personal adjustment; local optional prayer records, personal duas, verse reflections and bookmarks; JSON export/restore; username/password auth API with salted PBKDF2-SHA256 (100,000 iterations), random hashed session tokens, 24-hour sessions, throttling and single-use recovery codes; optional client-encrypted AES-GCM snapshot vault with conditional version writes. Guest records do not upload on registration. Bearer sessions stay in sessionStorage. Vault phrase is separate from account password and must be backed up independently.

## NOT launch-ready

This is an incomplete development implementation of the supplied specification. Quran structural validation FAILS: see `data/import-report.json`. Source text is never replaced with a different corpus or generated text. The initial source has malformed and inconsistent verse markers; text review, permissions, complete ayah/page mapping and source-basmala separation remain required. Do not represent this as a verified mushaf. Source supplied by project owner, header edition 2.08. No content redistribution license has been verified.

Pending: full English localization, verified Madinah page layout, licensed tafsir/audio/adhkar, memorization and spaced review, khatma plans, learning content and quizzes, seasons and Friday opening, notifications/device support matrix, sensor compass, granular record sync/conflict review, key recovery UX, administrator permissions/MFA/publishing/audit interface, migration/rollback exercises, browser/device accessibility and acceptance testing. Gemini intentionally disabled until trusted retrieval, reference verification, atomic monthly token reservation, actual-usage settlement and total spend cap are implemented and tested. No secrets are shipped in this repository. R2 is not provisioned because no approved media files are ready.

Database schema is versioned under `drizzle/`. Sites applies migrations at deployment, not at request time. The deployment provisions resources under its hosting account, not automatically in the owner's personal Cloudflare dashboard. For a personal-account migration, create D1, apply SQL, bind as DB and deploy `worker/index.js` with Wrangler. Maintain same-origin API or the explicitly allowed Pages origin.

Production operating limits: rate-limit rows and expired sessions require scheduled retention cleanup before launch; no backup retention duration is claimed; delete-account API removes active records only and provider backups follow provider policy. Browser storage is not a guaranteed backup. Complete independent security review before handling real personal data.

The generated hosting manifest identifies a development Sites deployment. GitHub workflow builds frontend assets without credentials. No automatic Cloudflare redeployment from GitHub is configured yet.
