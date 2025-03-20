import * as vscode from "vscode";

/**
 * Retrieves the appropriate VS Code icon based on the smell analysis status.
 * @param status - The analysis status.
 * @returns The corresponding VS Code theme icon.
 */
export function getStatusIcon(status: string): vscode.ThemeIcon {
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
      return new vscode.ThemeIcon("pass", new vscode.ThemeColor("charts.blue"));
    case "failed":
      return new vscode.ThemeIcon("error", new vscode.ThemeColor("charts.red"));
    default:
      return new vscode.ThemeIcon("circle-outline");
  }
}

/**
 * Retrieves the status message corresponding to the smell analysis state.
 * @param status - The analysis status.
 * @returns A descriptive status message.
 */
export function getStatusMessage(status: string): string {
  switch (status) {
    case "queued":
      return "Analyzing Smells";
    case "passed":
      return "Smells Successfully Detected";
    case "failed":
      return "Error Detecting Smells";
    case "no_issues":
      return "No Smells Found";
    default:
      return "Smells Not Yet Detected";
  }
}
