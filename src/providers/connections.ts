import * as vscode from 'vscode'
import { BaseProvider } from './base-provider'
import { readConnections, updateConnections } from '../storage/connections'
import { type ConnectionModel } from '../models/connection'
import { COMMAND_IDS, MIME_TYPES } from '../constants'

interface BaseTreeItem extends vscode.TreeItem {
  type: 'connection' | 'group' | 'empty'
}

export class ConnectionItem extends vscode.TreeItem implements BaseTreeItem {
  readonly type = 'connection'

  constructor(
    public readonly connection: ConnectionModel,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(connection.hostname, collapsibleState)
    this.id = connection.id
    //this.tooltip = connection.credentialUsername ? `Username: ${connection.credentialUsername}` : 'No credential assigned'
    this.description = connection.credentialUsername ?? 'No credential assigned'
    this.contextValue = 'connectionItem'
    this.iconPath = new vscode.ThemeIcon('remote')
  }
}

class ConnectionGroupItem extends vscode.TreeItem implements BaseTreeItem {
  readonly type = 'group'

  constructor(
    public readonly group: string,
    public readonly connections: ConnectionModel[],
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
  ) {
    super(group, collapsibleState)
    this.tooltip = `${connections.length} connection(s)`
    this.contextValue = 'connectionGroup'
    this.iconPath = new vscode.ThemeIcon('folder')
  }
}

class EmptyItem extends vscode.TreeItem implements BaseTreeItem {
  readonly type = 'empty'

  constructor() {
    super('No connections saved', vscode.TreeItemCollapsibleState.None)
    this.id = 'empty'
    this.tooltip = 'No connections are currently saved'
    this.contextValue = 'empty'
    this.iconPath = new vscode.ThemeIcon('info')
  }
}

type ConnectionTreeItem = ConnectionItem | ConnectionGroupItem | EmptyItem

export class ConnectionsProvider
  extends BaseProvider<ConnectionTreeItem>
  implements vscode.TreeDragAndDropController<ConnectionTreeItem> {
  private readonly groups = new Map<string, ConnectionModel[]>()

  readonly dragMimeTypes = [MIME_TYPES.connection]
  readonly dropMimeTypes = [MIME_TYPES.connection]

  constructor(private readonly context: vscode.ExtensionContext) {
    super()
    if (!process.env.VSCODE_TEST) {
      context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_IDS.connection.refresh, () => this.refresh())
      )
    }
    this.refresh()
  }

  getTreeItem(element: ConnectionTreeItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: ConnectionTreeItem): Promise<ConnectionTreeItem[]> {
    try {
      const connections = readConnections(this.context)

      if (element) {
        return element.type === 'group'
          ? element.connections.map(conn => new ConnectionItem(conn))
          : []
      }

      if (!connections.length) {
        return [new EmptyItem()]
      }

      this.updateGroups(connections)

      const ungrouped = connections
        .filter(conn => !conn.group?.trim())
        .map(conn => new ConnectionItem(conn))

      const grouped = [...this.groups.entries()]
        .filter(([group]) => group !== 'Ungrouped')
        .map(([group, conns]) => new ConnectionGroupItem(group, conns))

      return [...ungrouped, ...grouped]
    } catch (err) {
      console.error('Failed to get connections:', err)
      vscode.window.showErrorMessage('Failed to load connections.')
      return []
    }
  }

  private updateGroups(connections: ConnectionModel[]): void {
    this.groups.clear()
    for (const conn of connections) {
      const group = conn.group?.trim() || 'Ungrouped'
      if (!this.groups.has(group)) {
        this.groups.set(group, [])
      }
      this.groups.get(group)!.push(conn)
    }
  }

  getDragMimeTypes(source: ConnectionTreeItem[]): string[] {
    return source.every(item => item.type === 'connection') ? [MIME_TYPES.connection] : []
  }

  getDropMimeTypes(target: ConnectionTreeItem): string[] {
    return target.type === 'group' ? [MIME_TYPES.connection] : []
  }

  async handleDrop(
    target: ConnectionTreeItem,
    sources: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (token.isCancellationRequested || target.type !== 'group') return

    const targetGroup = (target as ConnectionGroupItem).group
    const data = sources.get(MIME_TYPES.connection)
    if (!data) return

    let draggedItems: ConnectionTreeItem[]
    try {
      draggedItems = JSON.parse(await data.asString())
    } catch (err) {
      console.error('Failed to parse dragged items:', err)
      return
    }

    const draggedConnections = draggedItems
      .filter((item): item is ConnectionItem => item.type === 'connection')
      .map(item => item.connection)

    if (!draggedConnections.length) return

    const allConnections = readConnections(this.context)
    const updated = allConnections.map(conn =>
      draggedConnections.some(d => d.id === conn.id)
        ? { ...conn, group: targetGroup === 'Ungrouped' ? undefined : targetGroup }
        : conn
    )

    try {
      await updateConnections(this.context, updated)
      this.updateGroups(updated)
      this.refresh()
    } catch (err) {
      console.error('Failed to update connections:', err)
      vscode.window.showErrorMessage('Failed to update connection.')
    }
  }

  async handleDrag(
    source: ConnectionTreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (token.isCancellationRequested) return

    const items = source.filter((item): item is ConnectionItem => item.type === 'connection')
    if (!items.length) return

    try {
      dataTransfer.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify(items)))
    } catch (err) {
      console.error('Failed to handle drag:', err)
    }
  }
}