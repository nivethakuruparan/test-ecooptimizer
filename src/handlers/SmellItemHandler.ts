import * as vscode from "vscode";

export class SmellItemHandler {
  /**
   * Sets the context value for a smell item.
   * @param item - The tree item to update.
   */
  static setContextValue(item: vscode.TreeItem): void {
    item.contextValue = "ecoOptimizerSmell";
  }

  /**
   * Assigns a command to jump to a specific line in a file when the tree item is clicked.
   * @param item - The tree item to update.
   * @param filePath - The path of the file containing the smell.
   * @param line - The line number to jump to.
   */
  static assignJumpToSmellCommand(
    item: vscode.TreeItem,
    filePath: string,
    line: number
  ): void {
    item.command = {
      command: "eco-optimizer.jumpToSmell",
      title: "Jump to Smell",
      arguments: [filePath, line],
    };
  }

  /**
   * Sets the tooltip for a smell item.
   * @param item - The tree item to update.
   * @param smellDescription - The description of the smell.
   */
  static setSmellTooltip(
    item: vscode.TreeItem,
    smellDescription: string
  ): void {
    item.tooltip = smellDescription;
  }
}
