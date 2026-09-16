// Render's start command for this service is fixed to "node index.js" (see
// package.json's "start" script for the long-term equivalent). This file
// used to BE the compiled app -- a hand-copied, one-time build output that
// silently drifted out of sync with the real TypeScript source in src/.
// Every fix pushed since (SMS/phone capture, real Klaviyo email consent,
// phone normalization) referenced files that only ever existed as .ts, so
// each of those deploys crashed on boot with MODULE_NOT_FOUND and Render
// silently kept serving this stale build instead.
//
// This is now a thin bootstrap that runs the real, freshly-compiled
// entrypoint (dist/index.js, produced by the "postinstall": "tsc" script
// that now runs as part of Render's "npm install" build step) so there is
// exactly one source of truth -- index.ts + src/ -- and no way for this
// file to drift from it again.
require('./dist/index.js');
