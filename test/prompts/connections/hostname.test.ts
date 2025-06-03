import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import promptForHostname from '../../../src/prompts/connections/hostname'

vi.mock('vscode', () => ({
  window: {
    showInputBox: vi.fn(),
  },
}))

describe('promptForHostname', () => {
  let mockShowInputBox: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue('host')
  })

  afterEach(() => {
    if (mockShowInputBox && typeof mockShowInputBox.mockRestore === 'function') {
      mockShowInputBox.mockRestore()
    }
  })

  it('shows input box with correct prompt for new hostname', async () => {
    await promptForHostname()
    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: 'Enter hostname',
      value: undefined,
      placeHolder: 'Enter hostname',
    })
  })

  it('shows input box with correct prompt for editing hostname', async () => {
    await promptForHostname('oldhost')
    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: 'Edit hostname',
      value: 'oldhost',
      placeHolder: 'Enter hostname',
    })
  })

  it('returns the entered hostname', async () => {
    mockShowInputBox.mockResolvedValue('myhost')
    const result = await promptForHostname()
    expect(result).toBe('myhost')
  })

  it('returns undefined if input is empty string', async () => {
    mockShowInputBox.mockResolvedValue('')
    const result = await promptForHostname()
    expect(result).toBeUndefined()
  })

  it('returns undefined if input is cancelled', async () => {
    mockShowInputBox.mockResolvedValue(undefined)
    const result = await promptForHostname()
    expect(result).toBeUndefined()
  })
})
