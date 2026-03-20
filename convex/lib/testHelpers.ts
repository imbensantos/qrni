import { vi } from "vitest";

/** Builds a chainable query mock that resolves to `result`. */
export function chainableQuery(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.withIndex = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.filter = vi.fn().mockReturnValue(chain);
  chain.first = vi.fn().mockResolvedValue(result);
  chain.take = vi.fn().mockResolvedValue([]);
  return chain;
}

export type MockCtx = {
  db: {
    query: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

export function createMockCtx(overrides?: Partial<MockCtx["db"]>): MockCtx {
  return {
    db: {
      query: vi.fn(),
      get: vi.fn(),
      insert: vi.fn().mockResolvedValue("new_id" as never),
      patch: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    },
  };
}
