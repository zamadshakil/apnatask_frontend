# ApnaTask client

Expo Router application for customer, provider, public-web, and localized Urdu
flows. Copy the required values into an untracked `.env.local`, then use
`npm run web`, `npm run android`, or `npm run ios` for local development.

For a seeded local API test only, `EXPO_PUBLIC_LOCAL_AUTH_TOKEN` may contain a
short-lived development JWT. The runtime rejects this setting whenever
`APP_VARIANT=production`; never commit a token or use this path in staging.

## Location privacy and cost boundary

The client calls authenticated ApnaTask location endpoints. It does not contain
a public map-provider token. The free bootstrap API resolves addresses through
its private Pakistan-only Nominatim index, so search results may be persisted
with tasks without creating metered API usage.

## Vercel web deployment

The `Vercel web deploy` workflow creates an Expo web export and publishes a
prebuilt deployment. Vercel Hobby is suitable only for a private,
non-commercial prototype under Vercel's current terms. The workflow refuses a
production deploy unless `VERCEL_COMMERCIAL_PLAN=pro` is configured. Required
GitHub secrets are listed in the infrastructure repository's
`FREE_BOOTSTRAP.md`.

The authenticated marketplace uses Expo's single-page web output so provider
and task URLs survive refreshes without server-rendered authentication state.
`EXPO_WEB_OUTPUT=static` is reserved for a separate public SEO export; do not
mix private application routes into that build.
