// OAuth client: build authorize URL, exchange code, refresh tokens

// NOTE: JSDoc typedefs are in ../types.js

export function buildAuthorizeUrl() {
  // TODO: read from settings/env and construct /oauth/authorize URL
  // include client_id, redirect_uri, response_type=code, scope=read
  throw new Error('Not implemented');
}

/**
 * @param {string} code
 * @returns {Promise<TokenSet>}
 */
export async function exchangeCodeForToken(code) {
  // TODO: POST to {instance}/oauth/token with grant_type=authorization_code
  // body: client_id, client_secret, redirect_uri, code
  throw new Error('Not implemented');
}

/**
 * @param {TokenSet} oldToken
 * @returns {Promise<TokenSet>}
 */
export async function refreshToken(oldToken) {
  // TODO: POST to {instance}/oauth/token with grant_type=refresh_token
  // body: client_id, client_secret, refresh_token
  throw new Error('Not implemented');
}
