![PixelFree Dark](doc/images/PixelFreeDark.png)


PixelFree is a free and open digital photo frame that connects to the
**Pixelfed** decentralized photo-sharing platform in the Fediverse.  
Unlike commercial photo frames that lock users into proprietary ecosystems,
PixelFree emphasizes **freedom, privacy, and interoperability**.

With PixelFree, users can display photos from their own Pixelfed accounts or
from public feeds they admire—without subscriptions, hidden costs, or
surrendering data to Big Tech platforms.


## Key Features

- **Pixelfed Integration** – Connects directly to a Fediverse photo-sharing
  instance using secure OAuth2 authentication.
- **Virtual Albums** – Define albums based on hashtags, users, or compound queries
  (e.g., “all posts tagged #Italy by @user@instance”).
- **Flexible Display** – Fullscreen carousel or tiled layouts with configurable
  transitions and display intervals.
- **Offline Support** – Caches images locally to keep albums available even when
  the network is down.
- **Open & Extensible** – Modular backend, frontend testbed, and kiosk-mode
  deployment target (e.g., Raspberry Pi).


## Major Components

| Component                | Description                                                                 | Language / Tech         |
|--------------------------|-----------------------------------------------------------------------------|-------------------------|
| **Frontend (Settings UI)** | Setup, styling, and operational settings (e.g., hours of operation). On par with existing commercial offerings. | HTML/CSS/JS (or React) |
| **Frontend (Display UI)**  | Photo carousel interface. Runs full screen. Comparable to commercial frames (e.g., tiled photo views). | HTML/CSS/JS (or React) |
| **Backend (Controller)**   | Handles OAuth authentication, token management, photo retrieval, caching, and scheduling updates. | Node.js |
| **Backend (Image Cache)**  | Stores image metadata and files locally, maintains freshness of cache. | Node.js / File system |
| **Backend (Pixelfed API)** | Wraps API calls (OAuth token exchange, photo queries, refreshes). | Node.js module |
| **Backend (Config & Prefs)** | User-specific config (e.g., accounts, tags to follow, refresh interval). | JSON / dotenv |
| **Deployment Target**      | Kiosk-mode Raspberry Pi or similar device, auto-starting app at boot. | Raspberry Pi OS |
For **setup instructions, architecture details, and developer workflow**, see: [Backend README](backend/README.md)

## Getting Started

### Quick Start (Non-Developers)
PixelFree is still under development as part of a university capstone project.  
For now, the system is intended for demonstration and evaluation.

A packaged release for non-technical users may be provided in the future.

### Developers
If you want to run or contribute to PixelFree:  
- Clone the repository  
- Follow the [backend README](backend/README.md) for setup and usage details  


## About the Project

PixelFree is being developed as a Capstone project at [Cal State Monterey Bay](https://csumb.edu). The project will deliver a functional digital photo frame, and also serves as a case study in building **open, decentralized alternatives** to consumer tech products.


## License: [![CC BY-NC 4.0][cc-by-nc-shield]][cc-by-nc]
This work is licensed under a
[Creative Commons Attribution-NonCommercial 4.0 International License][cc-by-nc].

[![CC BY-NC 4.0][cc-by-nc-image]][cc-by-nc]

[cc-by-nc]: https://creativecommons.org/licenses/by-nc/4.0/
[cc-by-nc-image]: https://licensebuttons.net/l/by-nc/4.0/88x31.png
[cc-by-nc-shield]: https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg
