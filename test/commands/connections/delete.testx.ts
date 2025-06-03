import '../../__mocks__/vitest-mocks'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import deleteConnectionCommand from '../../../src/commands/connections/delete'
import { COMMAND_IDS } from '../../../src/constants'
import * as vscode from 'vscode'

// Import the mocks directly after the vi.mock calls have been hoisted
const { __mockGetAll, __mockUpdateAll } = require('../../../src/storage/index');
const { __mockSelectPrompt } = require('../../../src/prompts/index');
const { handleCommandError: mockHandleCommandError } = require('../../../src/commands/connections');

describe('deleteConnectionCommand', () => {
  const context = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a connection when one is selected', async () => {
    const fakeConnection = { id: '1' };
    const fakeConnections = [fakeConnection, { id: '2' }];
    __mockSelectPrompt.mockResolvedValue(fakeConnection);
    __mockGetAll.mockReturnValue(fakeConnections);
    __mockUpdateAll.mockResolvedValue(undefined);

    await deleteConnectionCommand(context);

    expect(__mockSelectPrompt).toHaveBeenCalledWith(context, undefined);
    expect(__mockGetAll).toHaveBeenCalledWith(context);
    expect(__mockUpdateAll).toHaveBeenCalledWith(context, [{ id: '2' }]);
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh);
  });

  it('does nothing if no connection is selected', async () => {
    __mockSelectPrompt.mockResolvedValue(undefined);
    await deleteConnectionCommand(context);
    expect(__mockGetAll).not.toHaveBeenCalled();
    expect(__mockUpdateAll).not.toHaveBeenCalled();
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail');
    __mockSelectPrompt.mockRejectedValue(error);
    await deleteConnectionCommand(context);
    expect(mockHandleCommandError).toHaveBeenCalledWith('remove connection', error);
  });
});
