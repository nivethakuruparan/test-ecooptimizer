import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getStatusIcon, getStatusMessage } from "../utils/smellStatus"; // Utility functions for status icons and messages

/**
 * Represents a detected smell in the codebase.
 */
interface Smell {
  messageId: string;
  symbol: string;
  occurences: { line: number; endLine?: number }[];
}

/**
 * Represents a smell entry with its occurrences in a file.
 */
interface SmellEntry {
  acronym: string;
  occurrences: { line: number; endLine?: number }[];
}

/**
 * Provides a tree view in VS Code to display detected code smells.
 */
export class SmellsDisplayProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData = new vscode.EventEmitter<string | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private fileStatusMap: Map<string, string> = new Map(); // Maps file paths to their status (queued, passed, failed, etc.)
  private detectedSmells: Map<string, SmellEntry[]> = new Map(); // Stores detected smells per file
  private smellToFileMap: Map<string, string> = new Map(); // Maps smell descriptions to file paths
  private modifiedFiles: Map<string, boolean> = new Map(); // Tracks outdated files

  /**
   * Initializes the smell display provider.
   * @param context - The VS Code extension context.
   */
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Refreshes the tree view, triggering a UI update.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Returns a tree item representing a file, folder, or detected smell.
   * @param element - The file or folder path, or a detected smell.
   */
  getTreeItem(element: string): vscode.TreeItem {
    const status = this.fileStatusMap.get(element) || "not_detected";
    const hasSmells = this.detectedSmells.has(element);
    const isDirectory =
      fs.existsSync(element) && fs.statSync(element).isDirectory();
    const isSmellItem = !fs.existsSync(element) && !isDirectory;

    const item = new vscode.TreeItem(
      path.basename(element),
      isDirectory || hasSmells
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    // Set context values for tree items (used for command execution)
    if (isDirectory) {
      item.contextValue = "ecoOptimizerFolder";
    } else if (!isSmellItem) {
      item.contextValue = "ecoOptimizerFile";
    } else {
      item.contextValue = "ecoOptimizerSmell";
    }

    // Assigns the appropriate icon and description for outdated files
    if (!isDirectory && !isSmellItem) {
      item.command = {
        command: "eco-optimizer.openFile",
        title: "Open File",
        arguments: [vscode.Uri.file(element)],
      };

      // If the file has been modified since last analysis, mark it as outdated
      if (this.modifiedFiles.has(element)) {
        item.description = "outdated"; // Add "outdated" indicator in sidebar
        item.iconPath = new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("charts.orange")
        ); // Warning icon
      } else {
        item.iconPath = getStatusIcon(status); // Normal status icon
      }
    }

    // Assigns a jump-to-smell command for detected smell items
    if (!fs.existsSync(element) && element.includes(": Line")) {
      const parentFile = this.smellToFileMap.get(element);
      if (parentFile) {
        const [, lineStr] = element.split(": Line ");
        const lines = lineStr
          .split(",")
          .map((line) => parseInt(line.trim(), 10));
        const firstLine = lines.length > 0 ? lines[0] - 1 : 0;

        item.command = {
          command: "eco-optimizer.jumpToSmell",
          title: "Jump to Smell",
          arguments: [parentFile, firstLine],
        };
      }
    }

    // Sets the tooltip text for the tree item
    item.tooltip = isSmellItem
      ? element
      : `${path.basename(element)} (${getStatusMessage(status)})`;

    return item;
  }

  /**
   * Retrieves child elements for a given tree item.
   * @param element - The parent tree item (optional).
   */
  async getChildren(element?: string): Promise<string[]> {
    // Return the configured workspace path if no parent element is provided
    if (!element) {
      const configuredPath = this.context.workspaceState.get<string>(
        "workspaceConfiguredPath"
      );
      return configuredPath ? [configuredPath] : [];
    }

    const isDirectory =
      fs.existsSync(element) && fs.statSync(element).isDirectory();

    // If it's a directory, return the Python files inside
    if (isDirectory) {
      return fs
        .readdirSync(element)
        .filter((file) => file.endsWith(".py"))
        .map((file) => path.join(element, file));
    }

    // If it's a file, return the detected smells in that file
    const smells = this.detectedSmells.get(element) || [];
    return smells.map((smell) => {
      const smellItem = `${smell.acronym}: Line ${smell.occurrences
        .map((o) => o.line)
        .join(", ")}`;

      this.smellToFileMap.set(smellItem, element); // Map smell to file
      return smellItem;
    });
  }

  /**
   * Updates the detected smells for a file and refreshes the tree view.
   * @param filePath - The analyzed file path.
   * @param smells - The detected smells in the file.
   * @param smellMetadata - Metadata containing message ID and acronym for each smell.
   */
  updateSmells(
    filePath: string,
    smells: Smell[],
    smellMetadata: Record<string, { message_id: string; acronym: string }>
  ) {
    this.fileStatusMap.set(filePath, "passed");

    const formattedSmells: SmellEntry[] = smells.map((smell) => {
      const foundEntry = Object.values(smellMetadata).find(
        (smellData) => smellData.message_id === smell.messageId
      ) as { message_id: string; acronym: string };

      return {
        acronym: foundEntry ? foundEntry.acronym : smell.messageId,
        occurrences: smell.occurences.map((occ) => ({
          line: occ.line,
          endLine: occ.endLine,
        })),
      };
    });

    // Store smells per file
    this.detectedSmells.set(filePath, formattedSmells);

    // Ensure parent folder also gets updated with smells
    const folderPath = path.dirname(filePath);
    if (!this.detectedSmells.has(folderPath)) {
      this.detectedSmells.set(folderPath, []);
    }
    this.detectedSmells.get(folderPath)?.push(...formattedSmells);

    this.refresh();
  }

  /**
   * Marks a file as outdated, updating its appearance in the UI.
   * @param filePath - The path of the modified file.
   */
  public markFileAsOutdated(filePath: string) {
    this.modifiedFiles.set(filePath, true);
    this.refresh();
  }

  /**
   * Updates the status of a specific file or folder.
   * @param element - The file or folder path.
   * @param status - The new status to set.
   */
  async updateStatus(element: string, status: string) {
    this.fileStatusMap.set(element, status);
    this.refresh();
  }

  /**
   * Clears all detected smells and resets file statuses.
   * This is used when the smells cache is wiped to ensure the UI reflects the cleared state.
   */
  public resetAllSmells(): void {
    this.detectedSmells.clear();
    this.fileStatusMap.clear();
    this.modifiedFiles.clear(); // Clear outdated files tracking

    // Refresh the UI to remove all smells and reset statuses
    this.refresh();
  }

  /**
   * Checks if a file is marked as outdated.
   *
   * @param filePath - The path of the file to check.
   * @returns `true` if the file is outdated, `false` otherwise.
   */
  public isFileOutdated(filePath: string): boolean {
    return this.modifiedFiles.has(filePath);
  }

  /**
   * Clears the outdated status for a file.
   * @param filePath - The path of the file to clear.
   */
  public clearOutdatedStatus(filePath: string): void {
    this.modifiedFiles.delete(filePath);
    this.refresh();
  }
}
