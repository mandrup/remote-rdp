import * as vscode from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { exec } from 'child_process'
import { MESSAGES } from '../../constants'
import { promptConnection } from '../../prompts'
import { getCredentialWithPassword } from '../../storage'
import { ConnectionItem } from '../../providers'

export default async function connectConnectionCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {

        if (process.platform !== 'win32') {
            vscode.window.showErrorMessage('This extension currently only supports RDP on Windows.')
            return
        }

        const connection = item instanceof ConnectionItem
            ? item.connection
            : await promptConnection(context, item)

        if (!connection) return

        if (!connection.credentialUsername) {
            vscode.window.showErrorMessage('This connection has no credentials assigned. Please edit the connection to add credentials.')
            return
        }

        const credential = await getCredentialWithPassword(context, connection.credentialUsername)
        if (!credential) {
            vscode.window.showErrorMessage(`Could not find or access credential for username "${connection.credentialUsername}". The credential may have been deleted.`)
            return
        }

        const rdpContent = [
            `full address:s:${connection.hostname}`,
            `username:s:${connection.credentialUsername}`,
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
        fs.writeFileSync(tmpRdp, rdpContent, { encoding: 'utf8' })

        const cmd = `cmdkey /generic:"${connection.hostname}" /user:"${credential.username}" /pass:"${credential.password}"`
        exec(cmd, (error) => {
            if (error) {
                console.error('Failed to save credentials:', error)
                vscode.window.showErrorMessage('Failed to save credentials for RDP connection.')
                try { fs.unlinkSync(tmpRdp) } catch (_) { }
                return
            }

            exec(`mstsc "${tmpRdp}"`, (error) => {
                try { fs.unlinkSync(tmpRdp) } catch (_) { }
                if (error) {
                    console.error('Failed to launch RDP connection:', error)
                    vscode.window.showErrorMessage('Failed to launch RDP connection.')
                }
            })
        })

    } catch (error) {
        console.error('Failed to open connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('open connection', error))
    }
}
