![PixelFree Dark](backend/public/PixelFreeDark.png)

# PixelFree

An open-source, privacy-focused digital photo frame that displays photos from Pixelfed — a decentralized photo-sharing platform in the Fediverse.

## Table of Contents
1. Introduction
2. Features
3. Project Structure
4. Major Components
   - Frontend (Settings UI)
   - Frontend (Display UI)
   - Backend (Controller)
   - Backend (Image Cache)
   - Backend (Pixelfed API)
   - Backend (Config & Prefs)
   - Deployment Target
5. Installation
6. Usage
7. Development
   - Prerequisites
   - Setting up the backend
   - Setting up the frontend
8. Contributing
9. License

## 1. Introduction
- High-level purpose and goals of PixelFree
- Why it exists and what problems it solves

## 2. Features
- Display photos from your own Pixelfed account or public feeds
- Multiple viewing modes (single photo, tiled layout, slideshow)
- Offline caching of images
- Secure OAuth2 authentication
- Open source and privacy-focused

## 3. Project Structure
- `/backend` — Node.js/Express API server
- `/frontend` — Web-based display and settings UI
- `/docs` — Documentation and resources

## 4. Major Components
### Frontend (Settings UI)
- Manages account connections and settings
- Built with HTML/CSS/JS (or React)

### Frontend (Display UI)
- Full-screen photo display
- Supports themes and transitions

### Backend (Controller)
- Handles authentication, photo retrieval, and caching

### Backend (Image Cache)
- Stores images and metadata locally

### Backend (Pixelfed API)
- Manages API requests to Pixelfed

### Backend (Config & Prefs)
- Manages user preferences and credentials

### Deployment Target
- Raspberry Pi in kiosk mode (stretch goal)

## 5. Installation
- Clone repository
- Install dependencies
- Create `.env` file from `example.env`
- Start backend and frontend

## 6. Usage
- Access settings UI to log in and configure feeds
- Run in display mode for photo frame operation

## 7. Development
### Prerequisites
- Node.js
- npm
- Git

### Setting up the backend
- See `/backend/README.md`

### Setting up the frontend
- TBD

## 8. Contributing
- Fork the repo
- Create a feature branch
- Submit pull requests

## 9. License: [![CC BY-NC 4.0][cc-by-nc-shield]][cc-by-nc]
This work is licensed under a
[Creative Commons Attribution-NonCommercial 4.0 International License][cc-by-nc].

[![CC BY-NC 4.0][cc-by-nc-image]][cc-by-nc]

[cc-by-nc]: https://creativecommons.org/licenses/by-nc/4.0/
[cc-by-nc-image]: https://licensebuttons.net/l/by-nc/4.0/88x31.png
[cc-by-nc-shield]: https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg
