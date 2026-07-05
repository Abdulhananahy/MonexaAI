---
name: Stripe webhook test/live mode isolation
description: Why a working test-mode webhook endpoint + secret doesn't carry over to production, and how to verify an endpoint is real (not just a plausible-looking secret).
---

Stripe webhook endpoints and their signing secrets are scoped per API key mode (test vs live). A `STRIPE_WEBHOOK_SECRET` that works against a test-mode endpoint will never verify live-mode events, and vice versa — there is no shared or convertible secret between modes.

**Why:** Discovered when a webhook signature-verification fix was code-correct but the configured secret didn't match any endpoint actually registered in the Stripe account — `stripe.WebhookEndpoint.list()` returned zero results. A secret alone proves nothing; only a registered endpoint + matching secret does.

**How to apply:**
- To verify a webhook secret is real (not just correctly-formatted), call `stripe.WebhookEndpoint.list()` with the account's API key and confirm an endpoint exists whose URL matches the app's current domain.
- If none exists, create one via `stripe.WebhookEndpoint.create(url=..., enabled_events=[...])` — the response's `.secret` is only ever returned at creation time, so capture it immediately (don't print/log it) and store it via the environment-secrets request flow.
- You can fully verify end-to-end acceptance without the Stripe CLI or dashboard by HMAC-signing a synthetic payload yourself using the real `STRIPE_WEBHOOK_SECRET` (`t={timestamp},v1={hmac_sha256(secret, f"{timestamp}.{payload}")}`) and POSTing it to the running server's webhook route — this proves the exact secret in use is accepted, without needing a real subscription/customer to exist.
- Before publishing/going live, a **second** webhook endpoint must be created against live-mode keys, with its own secret set separately — the dev/test one does not transfer.
