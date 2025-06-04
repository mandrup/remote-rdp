import * as vscode from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { exec } from 'child_process'
import { Prompts } from '../../prompts'
import { Storage } from '../../storage'
import { ConnectionItem } from '../../providers'
import { generateRdpContent } from '../../helpers/generate-rdp-content'
import { setupWindowsCredential } from '../../helpers/setup-windows-credential'
import { handleCommandError } from '..'

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
    if (process.platform !== 'win32') {
      vscode.window.showErrorMessage('This extension currently only supports RDP on Windows.')
      return
    }

    const connection = item && 'type' in item && item.type === 'connection'
      ? (item as ConnectionItem).connection
      : await Prompts.connection.select(context, item)

    if (!connection) {
      return
    }

    if (!connection.credentialUsername) {
      vscode.window.showErrorMessage('This connection has no credentials assigned.')
      return
    }

    const credential = await Storage.credential.getWithPassword(context, connection.credentialUsername)
    if (!credential) {
      vscode.window.showErrorMessage(`Credential not found: "${connection.credentialUsername}".`)
      return
    }

    const rdpContent = generateRdpContent(connection)
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