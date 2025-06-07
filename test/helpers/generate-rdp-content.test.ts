import { describe, it, expect } from 'vitest'
import { generateRdpContent, defaultConnectionSettings } from '@/helpers/generate-rdp-content'
import type { ConnectionModel, ConnectionSettings } from '@/models/connection'

describe('generateRdpContent', () => {
  const baseConnection: ConnectionModel = {
    id: '1',
    hostname: 'host.example',
    credentialUsername: 'user',
    created_at: '2024-01-01',
  }

  it('generates RDP content with default settings if connectionSettings is missing', () => {
    const content = generateRdpContent(baseConnection)
    expect(content).toContain('full address:s:host.example')
    expect(content).toContain('username:s:user')
    expect(content).toContain(`screen mode id:i:${defaultConnectionSettings.screenModeId}`)
    expect(content).toContain(`desktopwidth:i:${defaultConnectionSettings.desktopWidth}`)
    expect(content).toContain(`desktopheight:i:${defaultConnectionSettings.desktopHeight}`)
    expect(content).toContain(`session bpp:i:${defaultConnectionSettings.sessionBpp}`)
    expect(content).toContain(`authentication level:i:${defaultConnectionSettings.authenticationLevel}`)
    expect(content).toContain(`prompt for credentials:i:0`)
    expect(content).toContain(`redirectclipboard:i:1`)
    expect(content).toContain(`redirectprinters:i:1`)
    expect(content).toContain(`drivestoredirect:s:`)
  })

  it('overrides default settings with connectionSettings', () => {
    const customSettings: ConnectionSettings = {
      screenModeId: 1,
      desktopWidth: 800,
      desktopHeight: 600,
      sessionBpp: 16,
      authenticationLevel: 0,
      promptForCredentials: true,
      redirectClipboard: false,
      redirectPrinters: false,
      driveStoreRedirect: 'D:'
    }
    const connection: ConnectionModel = {
      ...baseConnection,
      connectionSettings: customSettings
    }
    const content = generateRdpContent(connection)
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

  it('uses empty string for credentialUsername if missing', () => {
    const connection: ConnectionModel = {
      ...baseConnection,
      credentialUsername: undefined
    }
    const content = generateRdpContent(connection)
    expect(content).toContain('username:s:')
  })
})
