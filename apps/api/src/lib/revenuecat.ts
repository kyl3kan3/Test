/**
 * RevenueCat REST helpers. The webhook never trusts event payloads for
 * entitlement state — it re-fetches the subscriber and derives state fresh.
 */

export type DerivedSubscription = {
  status: "active" | "trialing" | "grace" | "expired" | "billing_issue";
  productId: string | null;
  store: string | null;
  expiresAt: Date | null;
  willRenew: boolean | null;
};

const RC_API = process.env.REVENUECAT_API_URL ?? "https://api.revenuecat.com";

export async function fetchSubscriber(appUserId: string): Promise<any> {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_KEY is not set");
  const res = await fetch(
    `${RC_API}/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    throw new Error(`RevenueCat subscriber fetch failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Derive our subscriptions-row state from a RC subscriber object for the
 * given entitlement id.
 */
export function deriveSubscription(
  subscriber: any,
  entitlementId = "pro",
): DerivedSubscription {
  const ent = subscriber?.subscriber?.entitlements?.[entitlementId];
  const subs = subscriber?.subscriber?.subscriptions ?? {};

  if (!ent) {
    return {
      status: "expired",
      productId: null,
      store: null,
      expiresAt: null,
      willRenew: null,
    };
  }

  const productId: string | null = ent.product_identifier ?? null;
  const sub = productId ? subs[productId] : undefined;
  const expiresAt = ent.expires_date ? new Date(ent.expires_date) : null;
  const now = Date.now();

  let status: DerivedSubscription["status"];
  if (expiresAt && expiresAt.getTime() <= now) {
    // Grace period: store expiration passed but RC keeps entitlement while
    // billing retries (grace_period_expires_date in the future).
    const grace = sub?.grace_period_expires_date
      ? new Date(sub.grace_period_expires_date)
      : null;
    status = grace && grace.getTime() > now ? "grace" : "expired";
  } else if (sub?.billing_issues_detected_at) {
    status = "billing_issue";
  } else if (sub?.period_type === "trial") {
    status = "trialing";
  } else {
    status = "active";
  }

  const willRenew =
    sub && "unsubscribe_detected_at" in sub
      ? sub.unsubscribe_detected_at == null
      : null;

  return {
    status,
    productId,
    store: sub?.store ?? null,
    expiresAt: status === "grace" && sub?.grace_period_expires_date
      ? new Date(sub.grace_period_expires_date)
      : expiresAt,
    willRenew,
  };
}
