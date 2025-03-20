import * as vscode from "vscode";

export class FileItemHandler {
  /**
   * Sets the context value for a file item.
   * @param item - The tree item to update.
   */
  static setContextValue(item: vscode.TreeItem): void {
    item.contextValue = "ecoOptimizerFile";
  }

  /**
   * Updates the file item's status, including icon, message, and description.
   * @param item - The tree item to update.
   * @param status - The analysis status (e.g., "queued", "passed", "failed", "outdated").
   */
  static updateFileItem(item: vscode.TreeItem, status: string): void {
    // Set the description if the status is "outdated"
    if (status === "outdated") {
      item.description = "outdated";
    }

    // Set the icon based on the status
    item.iconPath = this.getStatusIcon(status);

    // Set the tooltip (status message)
    item.tooltip = this.getStatusMessage(status);
  }

  /**
   * Assigns a command to open a file when the tree item is clicked.
   * @param item - The tree item to update.
   * @param filePath - The path of the file to open.
   */
  static assignOpenFileCommand(item: vscode.TreeItem, filePath: string): void {
    item.command = {
      command: "eco-optimizer.openFile",
      title: "Open File",
      arguments: [vscode.Uri.file(filePath)],
    };
  }

  /**
   * Retrieves the appropriate VS Code icon based on the smell analysis status.
   * @param status - The analysis status.
   * @returns The corresponding VS Code theme icon.
   */
  private static getStatusIcon(status: string): vscode.ThemeIcon {
    switch (status) {
      case "queued":
        return new vscode.ThemeIcon(
          "sync~spin",
          new vscode.ThemeColor("charts.yellow")
        );
      case "passed":
        return new vscode.ThemeIcon(
          "pass",
          new vscode.ThemeColor("charts.green")
        );
      case "no_issues":
        return new vscode.ThemeIcon(
          "pass",
          new vscode.ThemeColor("charts.blue")
        );
      case "failed":
        return new vscode.ThemeIcon(
          "error",
          new vscode.ThemeColor("charts.red")
        );
      case "outdated":
        return new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("charts.orange")
        );
      default:
        return new vscode.ThemeIcon("circle-outline");
    }
  }

  /**
   * Retrieves the status message corresponding to the smell analysis state.
   * @param status - The analysis status.
   * @returns A descriptive status message.
   */
  private static getStatusMessage(status: string): string {
    switch (status) {
      case "queued":
        return "Analyzing Smells";
      case "passed":
        return "Smells Successfully Detected";
      case "failed":
        return "Error Detecting Smells";
      case "no_issues":
        return "No Smells Found";
      case "outdated":
        return "File Outdated - Needs Reanalysis";
      default:
        return "Smells Not Yet Detected";
    }
  }
}
