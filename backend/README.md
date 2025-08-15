![PixelFree Dark](public/PixelFreeDark.png)

# PixelFree Backend

## Overview
The PixelFree backend is a Node.js application that acts as the controller for the PixelFree digital photo frame project. It handles authentication with the Pixelfed API, retrieves images, and serves them to a frontend display application. Images can be queried based on hashtags, users, or both. The interface can:

1. Retrieve images from any of the specified users regardless of how or if they are tagged.
2. Retrieve images with any|all of the specified hashtags, regardless of which users posted them.
3. Retrieve images with any|all of the specified hashtags, but only from the specified users.

A Pixelfed client ID (public) and corresponding client secret have already been obtained for the project.

In the future the backend will be enhanced to provide:

* Virtual albums
* Image caching (see [separate caching strategy document](Caching.md))
* Time-based queries (e.g. new photos since)
* Unit tests


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

## Directory Overview

| Directory  | Purpose |
|------------|---------|
| `api`    | Defines HTTP API endpoints and their routing logic. Handles request/response processing for frontend interactions. |
| `modules`| Holds self-contained feature modules, each responsible for a specific business domain or functionality. |
| `public` | A small test UI for the backend. Not intended for roduction use. |
| `server` | The main server initialization and setup code, including Express app creation, middleware registration, and server startup logic. |
| `services`| Encapsulates core business logic and external service integrations (e.g., database queries, API calls). |
| `utils`  | Shared utility functions and helper classes that can be reused across multiple parts of the backend. |

### Key Files
- `server.js` — Main entry point; initializes Express server and routes.
- `.token.json` — Stores OAuth tokens (ignored by Git for security).
- `.env` — Environment variables (ignored by Git; see `example.env`).

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

## License
This backend is part of the PixelFree project, intended for educational and non-commercial use unless otherwise specified in the main project license.
