import '#mocks/vscode'
import { mockShowInputBox } from '#mocks/vscode'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import promptForHostname from '@/prompts/connections/hostname'


describe('promptForHostname', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockShowInputBox.mockReset()
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
