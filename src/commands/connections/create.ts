import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'
import { handleCommandError } from '..'

export default async function createConnectionCommand(context: vscode.ExtensionContext): Promise<void> {
    try {
        const hostname = await Prompts.connection.hostname()
        if (!hostname) {
            return
        }

        const groupResult = await Prompts.connection.group(context)
        if (groupResult.cancelled) {
            return
        }

        const credential = await Prompts.credential.credential(context, undefined)
        if (!credential) {
            return
        }

        await Storage.connection.create(context, hostname, credential, groupResult.value)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    } catch (error) {
        await handleCommandError('create connection', error)
    }
}