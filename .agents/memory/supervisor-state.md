---
name: Supervisor state persistence
description: FarmerConnect supervisor controls currently use the API process state because no application database/auth provider is configured.
---

The supervisor notice and slot-delay flows use server-side API state and role headers, while the browser session uses sessionStorage for the MVP role marker. These records reset when the API restarts.

**Why:** The existing project had no configured application database or real authentication provider, so introducing a new persistence/auth stack would have expanded the current request beyond the working artifact.

**How to apply:** Preserve the current API contracts when migrating these records to durable storage and replace the browser role marker with server-side authentication and authorization.