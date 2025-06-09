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
  screenModeId: 2,
  desktopWidth: 1920,
  desktopHeight: 1080,
  sessionBpp: 32,
  authenticationLevel: 2,
  promptForCredentials: false,
  redirectClipboard: true,
  redirectPrinters: true,
  driveStoreRedirect: ''
}

export function getResolvedConnectionSettings(connection: ConnectionModel): Required<ConnectionSettings> {
  return {
    ...defaultConnectionSettings,
    ...connection.connectionSettings
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
    `username:s:${username}`,
    `screen mode id:i:${settings.screenModeId}`,
    `desktopwidth:i:${settings.desktopWidth}`,
    `desktopheight:i:${settings.desktopHeight}`,
    `session bpp:i:${settings.sessionBpp}`,
    `authentication level:i:${settings.authenticationLevel}`,
    `prompt for credentials:i:${settings.promptForCredentials ? 1 : 0}`,
    `redirectclipboard:i:${settings.redirectClipboard ? 1 : 0}`,
    `redirectprinters:i:${settings.redirectPrinters ? 1 : 0}`,
    `drivestoredirect:s:${settings.driveStoreRedirect}`
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
    const tmpRdp = path.join(os.tmpdir(), `remote-rdp-${Date.now()}.rdp`)
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