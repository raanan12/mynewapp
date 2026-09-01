# MyNewApp

React Native app built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing, TypeScript).

## Getting started

```bash
npm install
cp .env.example .env.local   # optional, for API config
npm start                    # then press i / a / w, or scan the QR code
```

Other scripts: `npm run ios`, `npm run android`, `npm run web`, `npm run lint`.

## Project structure

```
src/
  app/              # Routes only — every file here is a screen or layout
    _layout.tsx     # Root layout: navigation theme + safe-area provider
    index.tsx       # "/" screen
  components/       # Reusable presentational components
    screen.tsx      # Themed page container
    ui/             # Generic design-system primitives (Button, ...)
  config/
    env.ts          # Runtime config from EXPO_PUBLIC_* env vars
  constants/
    theme.ts        # Design tokens: colors, spacing, radius, font sizes
  hooks/
    use-theme.ts    # Resolves the active color scheme into tokens
  services/
    api/client.ts   # fetch wrapper: base URL, JSON, timeouts, ApiError
  types/
    index.ts        # Shared domain types
  utils/
    format.ts       # Pure helpers
assets/images/      # Icons, splash, static images
```

Conventions:

- **`src/app` holds routes and nothing else.** Anything reusable moves into a sibling folder.
- Import with the `@/` alias (`@/components/ui/button`), never with `../../..`.
- File names are `kebab-case`; components and hooks are named exports.
- Colors, spacing and radii come from `@/constants/theme` — no magic numbers in components.
- Network calls go through `@/services/api/client`; secrets never live in `EXPO_PUBLIC_*`.
