import * as vscode from 'vscode'
import { ConnectionModel } from '../../models/connection'

export interface BaseTreeItem extends vscode.TreeItem {
    type: 'connection' | 'group' | 'empty'
}

export interface ConnectionItem extends BaseTreeItem {
    type: 'connection'
    connection: ConnectionModel
}

export interface ConnectionGroupItem extends BaseTreeItem {
    type: 'group'
    group: string
    connections: ConnectionModel[]
}

export interface EmptyItem extends BaseTreeItem {
    type: 'empty'
}

export type ConnectionTreeItem = ConnectionItem | ConnectionGroupItem | EmptyItem 