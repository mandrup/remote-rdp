import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promptForConnectionSettings } from '@/prompts/connections/settings'
import { ConnectionSettings } from '@/models/connection'
import * as vscode from 'vscode'

vi.mock('vscode', () => ({
  window: {
    showQuickPick: vi.fn(),
    showInputBox: vi.fn()
  }
}))

describe('promptForConnectionSettings - Grouped Interface', () => {
  const mockShowQuickPick = vscode.window.showQuickPick as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show category selection first', async () => {
    mockShowQuickPick.mockResolvedValueOnce(undefined)

    const result = await promptForConnectionSettings()

    expect(result).toBeUndefined()
    expect(mockShowQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining('Display Settings'),
          category: 'display'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Authentication'),
          category: 'authentication'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Redirection'),
          category: 'redirection'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Audio & Media'),
          category: 'audio'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Performance'),
          category: 'performance'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Network'),
          category: 'network'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Gateway'),
          category: 'gateway'
        })
      ]),
      expect.objectContaining({
        placeHolder: 'Select a settings category to configure'
      })
    )
  })

  it('should show display settings when display category is selected', async () => {
    mockShowQuickPick.mockResolvedValueOnce({
      category: 'display',
      label: '$(desktop) Display Settings'
    })

    mockShowQuickPick.mockResolvedValueOnce(undefined)

    const result = await promptForConnectionSettings()

    expect(result).toBeUndefined()
    expect(mockShowQuickPick).toHaveBeenCalledTimes(2)
    
    const secondCall = mockShowQuickPick.mock.calls[1]
    expect(secondCall[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining('Screen Resolution'),
          setting: 'resolution',
          category: 'display'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Color Depth'),
          setting: 'sessionBpp',
          category: 'display'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Screen Mode'),
          setting: 'screenModeId',
          category: 'display'
        })
      ])
    )
  })

  it('should show authentication settings when authentication category is selected', async () => {
    mockShowQuickPick.mockResolvedValueOnce({
      category: 'authentication',
      label: '$(shield) Authentication'
    })

    mockShowQuickPick.mockResolvedValueOnce(undefined)

    const result = await promptForConnectionSettings()

    expect(result).toBeUndefined()
    expect(mockShowQuickPick).toHaveBeenCalledTimes(2)
    
    const secondCall = mockShowQuickPick.mock.calls[1]
    expect(secondCall[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining('Authentication Level'),
          setting: 'authenticationLevel',
          category: 'authentication'
        }),
        expect.objectContaining({
          label: expect.stringContaining('CredSSP Support'),
          setting: 'enableCredSSPSupport',
          category: 'authentication'
        }),
        expect.objectContaining({
          label: expect.stringContaining('Prompt for Credentials'),
          setting: 'promptForCredentials',
          category: 'authentication'
        })
      ])
    )
  })

  it('should display current settings values in descriptions', async () => {
    const currentSettings: ConnectionSettings = {
      display: {
        desktopWidth: 1920,
        desktopHeight: 1080,
        sessionBpp: 32
      },
      authentication: {
        authenticationLevel: 2
      }
    }

    mockShowQuickPick.mockResolvedValueOnce(undefined)

    await promptForConnectionSettings(currentSettings)

    const categoryItems = mockShowQuickPick.mock.calls[0][0]
    const displayCategory = categoryItems.find((item: any) => item.category === 'display')
    
    expect(displayCategory.description).toContain('1920x1080')
    expect(displayCategory.description).toContain('32-bit')
  })
})
