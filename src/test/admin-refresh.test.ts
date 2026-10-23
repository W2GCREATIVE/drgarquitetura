import { expect, it } from "vitest";
import { adminRefreshOptions } from "@/lib/admin-refresh";

it("refreshes received contacts automatically without a page reload", () => {
  expect(adminRefreshOptions.refetchInterval).toBe(3000);
  expect(adminRefreshOptions.refetchOnWindowFocus).toBe(true);
  expect(adminRefreshOptions.staleTime).toBe(0);
});