/** Mutable registry of RC subscriber fixtures, keyed by app_user_id. */
export const subscriberFixtures = new Map<string, unknown>();

export function subscriberWith(opts: {
  entitled?: boolean;
  productId?: string;
  store?: string;
  periodType?: "normal" | "trial";
  expiresInMs?: number;
  billingIssue?: boolean;
  gracePeriodMs?: number;
  unsubscribed?: boolean;
}) {
  const productId = opts.productId ?? "pro_yearly";
  const expiresDate = new Date(
    Date.now() + (opts.expiresInMs ?? 30 * 24 * 3600 * 1000),
  ).toISOString();
  return {
    subscriber: {
      entitlements:
        opts.entitled === false
          ? {}
          : {
              pro: {
                product_identifier: productId,
                expires_date: expiresDate,
                purchase_date: new Date(Date.now() - 1000).toISOString(),
              },
            },
      subscriptions: {
        [productId]: {
          store: opts.store ?? "app_store",
          period_type: opts.periodType ?? "normal",
          expires_date: expiresDate,
          billing_issues_detected_at: opts.billingIssue
            ? new Date().toISOString()
            : null,
          grace_period_expires_date: opts.gracePeriodMs
            ? new Date(Date.now() + opts.gracePeriodMs).toISOString()
            : null,
          unsubscribe_detected_at: opts.unsubscribed
            ? new Date().toISOString()
            : null,
        },
      },
    },
  };
}

export function rcEvent(opts: {
  id: string;
  type: string;
  appUserId: string;
  aliases?: string[];
  timestampMs?: number;
  environment?: string;
}) {
  return {
    api_version: "1.0",
    event: {
      id: opts.id,
      type: opts.type,
      app_user_id: opts.appUserId,
      aliases: opts.aliases ?? [opts.appUserId],
      event_timestamp_ms: opts.timestampMs ?? Date.now(),
      environment: opts.environment ?? "SANDBOX",
    },
  };
}
