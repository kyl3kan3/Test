/**
 * The purchases module must behave as a stub on web/E2E (no RC native module)
 * and expose a consistent entitlement lifecycle.
 */
import {
  __resetStubForTests,
  getEntitlement,
  onEntitlementChange,
  presentPaywall,
  purchasesAvailable,
  restorePurchases,
} from "../src/lib/purchases";

describe("purchases stub (E2E mode)", () => {
  beforeEach(() => __resetStubForTests());

  it("reports purchases unavailable under E2E", () => {
    expect(purchasesAvailable).toBe(false);
  });

  it("starts without entitlement", async () => {
    expect((await getEntitlement()).isPro).toBe(false);
  });

  it("grants pro through the stub paywall and notifies listeners", async () => {
    const seen: boolean[] = [];
    const off = onEntitlementChange((s) => seen.push(s.isPro));
    const result = await presentPaywall();
    off();
    expect(result).toBe(true);
    expect((await getEntitlement()).isPro).toBe(true);
    expect(seen).toEqual([true]);
  });

  it("restore reflects current stub state", async () => {
    expect(await restorePurchases()).toBe(false);
    await presentPaywall();
    expect(await restorePurchases()).toBe(true);
  });
});
