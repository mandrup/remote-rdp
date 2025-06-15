import * as vscode from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { exec } from 'child_process'
import { Prompts } from '../../prompts'
import { Storage } from '../../storage'
import { ConnectionItem } from '../../providers'
import { ConnectionModel, ConnectionSettings } from '../../models/connection'
import { handleCommandError, validatePromptResult, validatePlatformSupport, validateConnectionCredentials, showCredentialNotFoundError } from '../shared'

export const defaultConnectionSettings: Required<ConnectionSettings> = {
  display: {
    screenModeId: 2,
    desktopWidth: 1920,
    desktopHeight: 1080,
    sessionBpp: 32
  },
  authentication: {
    authenticationLevel: 2,
    promptForCredentials: false,
    enableCredSSPSupport: true
  },
  redirection: {
    redirectClipboard: true,
    redirectPrinters: true,
    driveStoreRedirect: '',
    redirectSmartCards: false,
    redirectPorts: false
  },
  audio: {
    audioMode: 0,
    audioQualityMode: 0
  },
  performance: {
    disableWallpaper: false,
    disableFullWindowDrag: false,
    disableMenuAnims: false,
    disableThemes: false,
    compression: true
  },
  network: {
    bandwidthAutoDetect: true,
    displayConnectionBar: true
  },
  gateway: {
    gatewayHostname: '',
    gatewayUsageMethod: 0
  }
}

export function getResolvedConnectionSettings(connection: ConnectionModel): Required<ConnectionSettings> {
  const customSettings = connection.connectionSettings || {}
  
  return {
    display: {
      ...defaultConnectionSettings.display,
      ...customSettings.display
    },
    authentication: {
      ...defaultConnectionSettings.authentication,
      ...customSettings.authentication
    },
    redirection: {
      ...defaultConnectionSettings.redirection,
      ...customSettings.redirection
    },
    audio: {
      ...defaultConnectionSettings.audio,
      ...customSettings.audio
    },
    performance: {
      ...defaultConnectionSettings.performance,
      ...customSettings.performance
    },
    network: {
      ...defaultConnectionSettings.network,
      ...customSettings.network
    },
    gateway: {
      ...defaultConnectionSettings.gateway,
      ...customSettings.gateway
    }
  }
}

export async function generateRdpContent(connection: ConnectionModel, context: any): Promise<string> {
  const settings = getResolvedConnectionSettings(connection)
  let username = ''
  if (connection.credentialId) {
    const credential = await Storage.credential.get(context, connection.credentialId)
    username = credential?.username ?? ''
  }

  return [
    `full address:s:${connection.hostname}`,
    `title:s:${connection.hostname}`,
    `username:s:${username}`,
    
    `screen mode id:i:${settings.display.screenModeId}`,
    `desktopwidth:i:${settings.display.desktopWidth}`,
    `desktopheight:i:${settings.display.desktopHeight}`,
    `session bpp:i:${settings.display.sessionBpp}`,
    
    `authentication level:i:${settings.authentication.authenticationLevel}`,
    `prompt for credentials:i:${settings.authentication.promptForCredentials ? 1 : 0}`,
    `enablecredsspsupport:i:${settings.authentication.enableCredSSPSupport ? 1 : 0}`,
    
    `redirectclipboard:i:${settings.redirection.redirectClipboard ? 1 : 0}`,
    `redirectprinters:i:${settings.redirection.redirectPrinters ? 1 : 0}`,
    `drivestoredirect:s:${settings.redirection.driveStoreRedirect}`,
    `redirectsmartcards:i:${settings.redirection.redirectSmartCards ? 1 : 0}`,
    `redirectcomports:i:${settings.redirection.redirectPorts ? 1 : 0}`,
    
    `audiomode:i:${settings.audio.audioMode}`,
    `audiocapturemode:i:1`,
    `audioqualitymode:i:${settings.audio.audioQualityMode}`,
    
    `disable wallpaper:i:${settings.performance.disableWallpaper ? 1 : 0}`,
    `disable full window drag:i:${settings.performance.disableFullWindowDrag ? 1 : 0}`,
    `disable menu anims:i:${settings.performance.disableMenuAnims ? 1 : 0}`,
    `disable themes:i:${settings.performance.disableThemes ? 1 : 0}`,
    `compression:i:${settings.performance.compression ? 1 : 0}`,
    
    `bandwidthautodetect:i:${settings.network.bandwidthAutoDetect ? 1 : 0}`,
    `displayconnectionbar:i:${settings.network.displayConnectionBar ? 1 : 0}`,
    
    ...(settings.gateway.gatewayHostname ? [
      `gatewayhostname:s:${settings.gateway.gatewayHostname}`,
      `gatewayusagemethod:i:${settings.gateway.gatewayUsageMethod}`
    ] : [])
  ].join('\r\n')
}

export function setupWindowsCredential(
  hostname: string,
  username: string,
  password: string,
  execFn: typeof exec = exec
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteCmd = `cmdkey /delete:"${hostname}"`
    execFn(deleteCmd, () => {
      const addCmd = `cmdkey /generic:"${hostname}" /user:"${username}" /pass:"${password}"`
      execFn(addCmd, (addError) => {
        if (addError) {
          reject(addError)
        } else {
          resolve()
        }
      })
    })
  })
}

interface FileSystem {
  writeFileSync: typeof fs.writeFileSync
  unlinkSync: typeof fs.unlinkSync
}

interface ProcessManager {
  exec: typeof exec
}

export function sanitizeHostnameForFilename(hostname: string): string {
  let sanitized = hostname.replace(/[<>:"/\\|?*]/g, '_')

  if (!hostname.startsWith('[') || !hostname.includes(']')) {
    sanitized = sanitized.replace(/\./g, '-')
  } else {
    sanitized = sanitized.replace(/(\[[^\]]*):([^\]]*\])/g, '$1_$2')
  }

  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50)
  }

  return sanitized
}

export default async function connectConnectionCommand(
  context: vscode.ExtensionContext,
  item?: vscode.TreeItem,
  fileSystem: FileSystem = fs,
  processManager: ProcessManager = { exec }
): Promise<void> {
  try {
    if (!validatePlatformSupport()) {
      return
    }

    const connection = item && 'type' in item && item.type === 'connection'
      ? (item as ConnectionItem).connection
      : await Prompts.connection.select(context, item)

    if (!validatePromptResult(connection)) {
      return
    }
    if (!validateConnectionCredentials(connection)) {
      return
    }

    const credential = await Storage.credential.get(context, connection.credentialId!)
    if (!validatePromptResult(credential)) {
      showCredentialNotFoundError(connection.credentialId!)
      return
    }

    const rdpContent = await generateRdpContent(connection, context)
    const sanitizedHostname = sanitizeHostnameForFilename(connection.hostname)
    const timestamp = Date.now()
    const tmpRdp = path.join(os.tmpdir(), `remote-rdp-${sanitizedHostname}-${timestamp}.rdp`)
    fileSystem.writeFileSync(tmpRdp, rdpContent, { encoding: 'utf8' })

    await setupWindowsCredential(connection.hostname, credential.username, credential.password, processManager.exec)

    processManager.exec(`mstsc "${tmpRdp}"`, (rdpError) => {
      try { fileSystem.unlinkSync(tmpRdp) } catch (_) { }
      if (rdpError) {
        console.error('Failed to launch RDP connection:', rdpError)
        vscode.window.showErrorMessage('Failed to launch RDP connection.')
      }
    })

  } catch (error) {
    await handleCommandError('open connection', error)
  }
}