import * as vscode from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { exec } from 'child_process'
import { MESSAGES } from '../../constants'
import { Prompts } from '../../prompts'
import { Storage } from '../../storage'
import { ConnectionItem } from '../../providers'

interface FileSystem {
    writeFileSync: typeof fs.writeFileSync
    unlinkSync: typeof fs.unlinkSync
}

interface ProcessManager {
    exec: (command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => ReturnType<typeof exec>
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
            : await Prompts.connection.connection(context, item)

        if (!connection) {
            return
        }

        if (!connection.credentialUsername) {
            vscode.window.showErrorMessage('This connection has no credentials assigned. Please edit the connection to add credentials.')
            return
        }

        const credential = await Storage.credential.readWithPassword(context, connection.credentialUsername)
        if (!credential) {
            vscode.window.showErrorMessage(`Could not find or access credential for username "${connection.credentialUsername}". The credential may have been deleted.`)
            return
        }

        const rdpContent = [
            `full address:s:${connection.hostname}`,
            `username:s:${connection.credentialUsername}`,
            `remoteapplicationname:s:${connection.hostname}`,
            'screen mode id:i:2',
            'desktopwidth:i:1920',
            'desktopheight:i:1080',
            'session bpp:i:32',
            'authentication level:i:2',
            'prompt for credentials:i:0',
            'redirectclipboard:i:1',
            'redirectprinters:i:1',
            'drivestoredirect:s:'
        ].join('\n')

        const tmpRdp = path.join(os.tmpdir(), `remote-rdp-${Date.now()}.rdp`)
        fileSystem.writeFileSync(tmpRdp, rdpContent, { encoding: 'utf8' })

        const deleteCmd = `cmdkey /delete:"${connection.hostname}"`
        processManager.exec(deleteCmd, (deleteError) => {
            if (deleteError) {
                console.warn('Could not delete existing credentials (might not exist):', deleteError.message)
            }

            const addCmd = `cmdkey /generic:"${connection.hostname}" /user:"${credential.username}" /pass:"${credential.password}"`
            processManager.exec(addCmd, (addError) => {
                if (addError) {
                    console.error('Failed to save credentials:', addError)
                    vscode.window.showErrorMessage('Failed to save credentials for RDP connection.')
                    try { fileSystem.unlinkSync(tmpRdp) } catch (_) { }
                    return
                }

                processManager.exec(`mstsc "${tmpRdp}"`, (rdpError) => {
                    try { fileSystem.unlinkSync(tmpRdp) } catch (_) { }
                    if (rdpError) {
                        console.error('Failed to launch RDP connection:', rdpError)
                        vscode.window.showErrorMessage('Failed to launch RDP connection.')
                    }
                })
            })
        })

    } catch (error) {
        console.error('Failed to open connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('open connection', error))
    }
}
