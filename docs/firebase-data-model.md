# Firebase Data Model

This project uses Firebase as the shared source of truth for the main business data, with local fallback only to keep the app usable when the network is unstable.

## Collections

### `accounts/{email}`
Stores login data for password-based access.

Fields:
- `uid`
- `email`
- `name`
- `role`
- `passwordHash`
- `updatedAt`
- `lgpdAcceptedAt`

### `users/{uid}`
Stores public profile information.

Fields:
- `uid`
- `email`
- `name`
- `role`
- `photoUrl`
- `phone`
- `updatedAt`
- `lgpdAcceptedAt`

### `organizations/uniodonto/months/{monthId}`
Stores the monthly dashboard record used by:
- dashboard
- reports
- envio / integração

Fields:
- `month`
- `summary`
- `beneficiariesData`
- `funnelData`
- `npsData`
- `investments`
- `metrics`
- `updatedAt`
- `updatedBy`

## Storage

### `profile-photos/{uid}/{filename}`
Stores profile pictures uploaded from the settings screen.

## Sync rules used by the app

- Profile edits write to Firestore and update the local session cache.
- Monthly saves write to Firestore and immediately update the local cache.
- Monthly readers subscribe to Firestore and keep the screen updated when another device changes the same month.
- If Firebase is unavailable, the app keeps a local fallback copy so the UI does not break.

