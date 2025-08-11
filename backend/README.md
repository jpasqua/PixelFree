![PixelFree Dark](public/PixelFreeDark.png)

# PixelFree Backend

## Overview
The PixelFree backend is a Node.js application that acts as the controller for the PixelFree digital photo frame project. It handles authentication with the Pixelfed API, retrieves images, and serves them to a frontend display application.

This backend is modular and designed for flexibility, allowing easy enhancement or replacement of components. It is part of a larger system that emphasizes user privacy, decentralization, and freedom from proprietary ecosystems.

## Features
- **Pixelfed OAuth 2.0 Authentication** — Securely authenticate and store access/refresh tokens for a Pixelfed account.
- **Media Retrieval** — Fetches photos from Pixelfed based on user queries (hashtags, usernames).
- **Query Flexibility** — Currently supports searching by tag or username; planned enhancements include multiple combined queries.
- **Token Management** — Securely stores and refreshes access tokens.
- **API Wrapper** — Encapsulates Pixelfed API calls for easy reuse in other modules.
- **Static Frontend Support** — Serves a simple HTML/CSS/JS test frontend for development and testing.

## Tech Stack
- **Node.js** — Core runtime environment.
- **Express.js** — Web framework for API endpoints and static content.
- **Axios / Fetch** — HTTP requests to Pixelfed API.
- **dotenv** — Environment variable management.
- **File System** — Local storage for cached tokens and future image caching.

## Key Files
- `server.js` — Main entry point; initializes Express server and routes.
- `routes/` — Contains Express route definitions for API endpoints.
- `controllers/` — Logic for handling OAuth, token storage, and Pixelfed API queries.
- `.token.json` — Stores OAuth tokens (ignored by Git for security).
- `.env` — Environment variables (ignored by Git; see `example.env`).
- `public/` — Contains the static test frontend (HTML/CSS/JS).

## Security Notes
- **Never commit `.token.json`** — This file contains active OAuth tokens that allow access to a Pixelfed account.
- **Never commit `.env`** — This file contains API credentials and must be kept private.
- A `.gitignore` is provided to ensure sensitive files are not pushed to the repository.

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment configuration**
   - Copy `env.example.txt` to `.env`:
     ```bash
     cp env.example.txt .env
     ```
   - Fill in the required fields in `.env` (see comments in file).

4. Run the backend

    ```bash
    npm start
    ```
    This will start the backend server using the `start` script defined in `package.json`.

    For development with `NODE_ENV` set to `development` (useful for enabling verbose logging or dev-specific settings), run:

    ```bash
    npm run dev
    ```

5. **Access the test frontend**
   - Open `http://localhost:3000` in a browser.

## Basic Tests of the Query API

``` bash
# Find posts from any specified user in the query [OR]
curl -s http://localhost:3000/api/photos/query \
  -H 'Content-Type: application/json' \
  -d '{"type":"tag","tags":["Italy","France"],"limit":20}' | jq .

# Find posts with any of the listed hashtags [OR]
curl -s http://localhost:3000/api/photos/query \
  -H 'Content-Type: application/json' \
  -d '{"type":"user","accts":["rivercityrandom@bitbang.social","@icm@mastodon.sdf.org"],"limit":20}' | jq .

# Find posts with any of the specified tags from any of the specified users
# [OR AND OR]
curl -s http://localhost:3000/api/photos/query \
  -H 'Content-Type: application/json' \
  -d '{"type":"compound","tags":["retrocomputing","retrocomputers"],"users":{"accts":["@rivercityrandom@bitbang.social","@icm@mastodon.sdf.org"]},"limit":20}' | jq .
```

## Planned Enhancements
- Local image caching
- Raspberry Pi deployment in kiosk mode.

## License
This backend is part of the PixelFree project, intended for educational and non-commercial use unless otherwise specified in the main project license.
