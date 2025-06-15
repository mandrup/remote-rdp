import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRdpContent, defaultConnectionSettings } from '@/commands/connections/connect'
import { Storage } from '@/storage'
import type { ConnectionModel, ConnectionSettings } from '@/models/connection'
import { standardBeforeEach } from '../../../test-utils'

describe('generateRdpContent', () => {
  const baseConnection: ConnectionModel = {
    id: '1',
    hostname: 'host.example',
    credentialId: 'cred-1',
    createdAt: '2024-01-01',
  }
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
    Storage.credential.get = vi.fn().mockResolvedValue({ id: 'cred-1', username: 'user', password: 'pass' })
  })

  it('generates RDP content with default settings', async () => {
    const content = await generateRdpContent(baseConnection, context)
    expect(content).toContain('full address:s:host.example')
    expect(content).toContain('username:s:user')
    expect(content).toContain(`screen mode id:i:${defaultConnectionSettings.display.screenModeId}`)
    expect(content).toContain(`desktopwidth:i:${defaultConnectionSettings.display.desktopWidth}`)
    expect(content).toContain(`desktopheight:i:${defaultConnectionSettings.display.desktopHeight}`)
    expect(content).toContain(`session bpp:i:${defaultConnectionSettings.display.sessionBpp}`)
    expect(content).toContain(`authentication level:i:${defaultConnectionSettings.authentication.authenticationLevel}`)
    expect(content).toContain(`prompt for credentials:i:0`)
    expect(content).toContain(`redirectclipboard:i:1`)
    expect(content).toContain(`redirectprinters:i:1`)
    expect(content).toContain(`drivestoredirect:s:`)
  })

  it('overrides default settings with connectionSettings', async () => {
    Storage.credential.get = vi.fn().mockResolvedValue({ id: 'cred-1', username: 'user', password: 'pass' })
    const customSettings: ConnectionSettings = {
      display: {
        screenModeId: 1,
        desktopWidth: 800,
        desktopHeight: 600,
        sessionBpp: 16
      },
      authentication: {
        authenticationLevel: 0,
        promptForCredentials: true
      },
      redirection: {
        redirectClipboard: false,
        redirectPrinters: false,
        driveStoreRedirect: 'D:'
      }
    }
    const connection: ConnectionModel = {
      ...baseConnection,
      connectionSettings: customSettings
    }
    const content = await generateRdpContent(connection, context)
    expect(content).toContain('screen mode id:i:1')
    expect(content).toContain('desktopwidth:i:800')
    expect(content).toContain('desktopheight:i:600')
    expect(content).toContain('session bpp:i:16')
    expect(content).toContain('authentication level:i:0')
    expect(content).toContain('prompt for credentials:i:1')
    expect(content).toContain('redirectclipboard:i:0')
    expect(content).toContain('redirectprinters:i:0')
    expect(content).toContain('drivestoredirect:s:D:')
  })

  it('uses empty string for username when credential not found', async () => {
    Storage.credential.get = vi.fn().mockResolvedValue(undefined)
    const connection: ConnectionModel = { ...baseConnection, credentialId: 'notfound' }
    const content = await generateRdpContent(connection, context)
    expect(content).toContain('username:s:')
  })
})
