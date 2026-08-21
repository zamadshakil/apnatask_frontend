# ApnaTask client

Expo Router application for customer, provider, public-web, and localized Urdu
flows. Copy the required values into an untracked `.env.local`, then use
`npm run web`, `npm run android`, or `npm run ios` for local development.

## Location privacy and cost boundary

The client calls authenticated ApnaTask location endpoints. It does not contain
a public map-provider token. The free bootstrap API resolves addresses through
its private Pakistan-only Nominatim index, so search results may be persisted
with tasks without creating metered API usage.

## Free web deployment

The `Free Cloudflare Pages deploy` workflow creates the production static Expo
export and publishes it to the configured Pages project. Required GitHub
variables and secrets are listed in the infrastructure repository's
`FREE_BOOTSTRAP.md`.
