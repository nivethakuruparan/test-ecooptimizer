import * as vscode from "vscode";

export class FolderItemHandler {
  /**
   * Sets the context value for a folder item.
   * @param item - The tree item to update.
   */
  static setContextValue(item: vscode.TreeItem): void {
    item.contextValue = "ecoOptimizerFolder";
  }
}
