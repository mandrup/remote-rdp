import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import promptForHostname from '@/prompts/connections/hostname'
import { standardBeforeEach, mockShowInputBox } from '../../test-utils'

describe('promptForHostname', () => {
  beforeEach(standardBeforeEach)

  afterEach(() => {
    mockShowInputBox.mockReset()
  })

  it('shows input box for new hostname', async () => {
    await promptForHostname()
    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: 'Enter hostname',
      value: undefined,
      placeHolder: 'Enter hostname',
    })
  })

  it('shows input box for editing hostname', async () => {
    await promptForHostname('oldhost')
    expect(mockShowInputBox).toHaveBeenCalledWith({
      prompt: 'Edit hostname',
      value: 'oldhost',
      placeHolder: 'Enter hostname',
    })
  })

  it('returns entered hostname', async () => {
    mockShowInputBox.mockResolvedValue('myhost')
    const result = await promptForHostname()
    expect(result).toBe('myhost')
  })

  it('returns undefined for empty input', async () => {
    mockShowInputBox.mockResolvedValue('')
    const result = await promptForHostname()
    expect(result).toBeUndefined()
  })

  it('returns undefined when cancelled', async () => {
    mockShowInputBox.mockResolvedValue(undefined)
    const result = await promptForHostname()
    expect(result).toBeUndefined()
  })
})
