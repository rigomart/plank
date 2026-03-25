# Commands
- Package manager: `bun`
- Dev: `bun run dev`
- Build: `bun run build`
- Format: `bun run format` (biome format --write .)
- Lint: `bun run lint` (biome lint .)
- Check (lint + format + imports): `bun run check` (biome check --write .)
- Typecheck: `bun run typecheck`

## Guidelines
- After finishing a change, run check and build
- Do not run the dev environment, assume the user is already running it
- We are using the react compiler, so avoid using optimizations like memoization with useMemo or useCallback
- Avoid the use of `any` type and explicit type casting.