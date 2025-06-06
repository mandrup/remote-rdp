import { ExtensionContext } from 'vscode'
import { vi } from 'vitest'

export function createMockContext(overrides = {}): ExtensionContext {
  const globalState = {
    get: vi.fn(),
    update: vi.fn(),
    ...(overrides as any).globalState,
  }
  return {
    globalState,
    ...overrides,
  } as unknown as ExtensionContext
}