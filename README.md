# ApnaTask client

Expo Router application for customer, provider, public-web, English, and Roman
Urdu flows. Copy the required values into an untracked `.env.local`, then use
`npm run web`, `npm run android`, or `npm run ios` for local development.

For a seeded local API test only, `EXPO_PUBLIC_LOCAL_AUTH_TOKEN` may contain a
short-lived development JWT. The runtime rejects this setting in every hosted
build; never commit a token or use this path in alpha, staging, or production.

## Location privacy and cost boundary

The client calls authenticated ApnaTask location endpoints and renders dynamic
OpenFreeMap vector tiles through MapLibre without an API key. The zero-cost
closed alpha uses button-triggered, server-cached public Nominatim lookups at a
strict maximum of one upstream request per second. It never uses Nominatim for
autocomplete. This is an alpha constraint, not the production geocoder design.

## Vercel web deployment

The `Vercel web deploy` workflow creates an Expo web export and publishes a
prebuilt deployment. Vercel Hobby is suitable only for a private,
non-commercial prototype under Vercel's current terms. The workflow refuses a
production deploy unless `VERCEL_COMMERCIAL_PLAN=pro` is configured. Required
GitHub secrets are listed in the infrastructure repository's
`FREE_BOOTSTRAP.md`.

The `alpha` app variant uses invite-only Supabase email OTP because real phone
SMS has a provider cost. Public production continues to require Pakistani phone
verification; email alpha access is not a silent product-policy change.

The authenticated marketplace uses Expo's single-page web output so provider
and task URLs survive refreshes without server-rendered authentication state.
`EXPO_WEB_OUTPUT=static` is reserved for a separate public SEO export; do not
mix private application routes into that build.
