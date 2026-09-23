# Changelog

All notable changes to the Kuja Na Stock (KNS) platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-09-22

### Added
- Official 3D Boda Courier brand mascot integrated across navigation bars, hero showcase card, and authentication views.
- Multi-resolution PWA asset pipeline (`logo.jpg`, `logo-square.png`, `icon-192.png`, `icon-512.png`, `favicon.ico`).
- `metadataBase` configuration in `layout.tsx` for social sharing graph cards.

### Changed
- Rebranded platform identity to **Kuja Na Stock (KNS)** across manifests, store states, and page titles.
- Complete theme overhaul from dark brutalist palette to an accessible **White & Orange** high-contrast field design (`#ffffff` surfaces, `#f8fafc` substrate, `#ea580c` action triggers).
- Integrated Google Font **Inconsolata** with optical sizing across all numerical telemetry and tabular data displays.

---

## [0.2.0] - 2026-09-21

### Added
- Sourcing intelligence engine highlighting **Cheapest vs. Fastest** routing across all commodities.
- Dual decision radar cards on the public homepage and retailer requisition modal.
- Automated safety stock threshold alerts on the retailer dashboard.
- ElevenLabs neural text-to-speech route (`/api/tts`) utilizing Bella voice profile (`hpp4J3VqNfWAUOO0d1Us`).
- Fallback inline tactical command input bar for environments where microphone access or cloud speech recognition is restricted.
- 1-tap hardware macro test buttons inside the voice terminal.

### Fixed
- Web Speech API premature disconnection by switching recognition mode to continuous and implementing a 1.8-second auto-silence timer.
- Standardized recognition language to `en-US` to avoid regional dialect drops on Chromium speech cloud servers.

---

## [0.1.0] - 2026-09-20

### Added
- Initial release of the Kuja Na Stock B2B dispatch architecture.
- 4 interactive operator nodes:
  - Retailer Kiosk HUD (`/dashboard/retailer`)
  - Bulk Wholesale Terminal (`/dashboard/wholesaler`)
  - Farm Gate Direct Terminal (`/dashboard/farmer`)
  - Boda Rider Telemetry Cockpit (`/dashboard/boda_rider`)
- Full B2B requisition and courier dispatch lifecycle state machine.
- Supabase PostgreSQL schema with Row Level Security (RLS) policies.
- Demo role switcher component for rapid role evaluation.
- Progressive Web App manifest and basic service worker configuration.
