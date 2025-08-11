/**
 * Shared JSDoc typedefs for PixelFree backend
 * (Pure JS project; these typedefs help with editor intellisense)
 */

/**
 * @typedef {Object} TokenSet
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {number} expires_in   // seconds
 * @property {number} created_at   // epoch seconds
 * @property {string} [scope]
 * @property {string} [token_type]
 */

/**
 * @typedef {Object} Photo
 * @property {string} id
 * @property {string} url
 * @property {string} [preview_url]
 * @property {string} created_at    // ISO
 * @property {{ id:string, username:string, url:string }} [author]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Photo & { localPath?: string, etag?: string, lastFetchedAt: number }} CachedPhoto
 */

/**
 * @typedef {{ type:'tag', tag:string } | { type:'user', accountId:string } | { type:'public', localOnly?:boolean }} Source
 */

/**
 * @typedef {{ limit:number }} FetchOptions
 */

/**
 * @typedef {Object} AppSettings
 * @property {string} instanceUrl
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} redirectUri
 * @property {{ transitionMs:number, showCaptions:boolean }} display
 * @property {Source} source
 * @property {{ intervalMs:number, fetchLimit:number, cacheBudgetBytes:number }} sync
 */
