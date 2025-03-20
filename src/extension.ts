import * as vscode from "vscode";
import { configureWorkspace } from "./commands/configureWorkspace";
import { resetConfiguration } from "./commands/resetConfiguration";
import { detectSmellsFile, detectSmellsFolder } from "./commands/detectSmells";
import { refactorSmellsFile } from "./commands/refactorSmells";
import { openFile } from "./commands/openFile";
import { registerFilterSmellCommands } from "./commands/filterSmells";
import { jumpToSmell } from "./commands/jumpToSmell";
import { SmellsDisplayProvider } from "./providers/SmellsViewProvider";
import { checkServerStatus } from "./api/backend";
import { FilterSmellsProvider } from "./providers/FilterSmellsProvider";
import { SmellsCacheManager } from "./context/SmellsCacheManager"; // Updated import
import path from "path";

/**
 * Activates the extension and registers all necessary commands and providers.
 * @param context - The VS Code extension context.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 Activating Eco-Optimizer extension...");

  // ✅ Initialize SmellsCacheManager for managing caching
  const smellsCacheManager = new SmellsCacheManager(context);

  // ===========================
  // Initialize Code Smells View
  // ===========================
  const smellsDisplayProvider = new SmellsDisplayProvider(context);
  const codeSmellsView = vscode.window.createTreeView("eco-optimizer.view", {
    treeDataProvider: smellsDisplayProvider,
  });
  context.subscriptions.push(codeSmellsView);

  // ✅ Start periodic backend status checks (every 10 seconds)
  checkServerStatus();
  setInterval(checkServerStatus, 10000);

  // ✅ Track workspace configuration state
  const workspaceConfigured = Boolean(
    context.workspaceState.get<string>("workspaceConfiguredPath")
  );
  vscode.commands.executeCommand(
    "setContext",
    "workspaceState.workspaceConfigured",
    workspaceConfigured
  );

  // ===========================
  // Register Workspace Commands
  // ===========================
  context.subscriptions.push(
    vscode.commands.registerCommand("eco-optimizer.configureWorkspace", () =>
      configureWorkspace(context, smellsDisplayProvider)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("eco-optimizer.resetConfiguration", () =>
      resetConfiguration(context, smellsCacheManager, smellsDisplayProvider)
    )
  );

  // ===========================
  // Initialize Filter Smells View
  // ===========================
  const filterSmellsProvider = new FilterSmellsProvider(context);
  const filterSmellsView = vscode.window.createTreeView(
    "eco-optimizer.filterView",
    {
      treeDataProvider: filterSmellsProvider,
      showCollapseAll: true,
    }
  );

  // Associate the TreeView instance with the provider
  filterSmellsProvider.setTreeView(filterSmellsView);

  // Register filter-related commands
  registerFilterSmellCommands(context, filterSmellsProvider);

  // ===========================
  // Register Code Smell Analysis Commands
  // ===========================
  context.subscriptions.push(
    vscode.commands.registerCommand("eco-optimizer.openFile", openFile)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.detectSmellsFolder",
      (folderPath) =>
        detectSmellsFolder(
          smellsCacheManager,
          smellsDisplayProvider,
          folderPath
        )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.detectSmellsFile",
      (fileUri) =>
        detectSmellsFile(smellsCacheManager, smellsDisplayProvider, fileUri)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.refactorSmellsFile",
      (fileUri) => refactorSmellsFile(smellsDisplayProvider, fileUri)
    )
  );

  // ===========================
  // Register Jump to Smell Command
  // ===========================
  context.subscriptions.push(
    vscode.commands.registerCommand("eco-optimizer.jumpToSmell", jumpToSmell)
  );

  // ===========================
  // Register Clear Smells Cache Command
  // ===========================
  context.subscriptions.push(
    vscode.commands.registerCommand("eco-optimizer.wipeWorkCache", async () => {
      const userResponse = await vscode.window.showWarningMessage(
        "Are you sure you want to clear the smells cache? This action cannot be undone.",
        { modal: true },
        "Confirm"
      );

      if (userResponse === "Confirm") {
        // ✅ Use SmellsCacheManager to clear cache & refresh UI
        await smellsCacheManager.clearCacheAndRefreshUI(smellsDisplayProvider);

        vscode.window.showInformationMessage(
          "Smells cache cleared successfully."
        );
      } else {
        vscode.window.showInformationMessage("Operation cancelled.");
      }
    })
  );

  console.log("✅ Eco-Optimizer extension activated successfully.");

  // Listen for file save events to detect outdated files
  vscode.workspace.onDidSaveTextDocument(async (document) => {
    const filePath = document.fileName;

    // ✅ Ignore files that have no cached smells
    const cachedSmells = smellsCacheManager.getCachedSmells(filePath);
    if (!cachedSmells) return;

    // Compute the new hash and compare it with the stored hash
    const newHash = smellsCacheManager.computeFileHash(document.getText());
    const oldHash = smellsCacheManager.getStoredFileHash(filePath);

    if (oldHash && newHash !== oldHash) {
      vscode.window.showWarningMessage(
        `The file "${path.basename(
          filePath
        )}" has been modified since the last analysis.`
      );

      // ✅ Mark file as outdated in the UI
      smellsDisplayProvider.markFileAsOutdated(filePath);
    }
  });
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
  console.log("⚡ Deactivating Eco-Optimizer extension...");
}
