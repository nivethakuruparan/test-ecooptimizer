import * as vscode from "vscode";
import { FilterSmellsProvider } from "../providers/FilterSmellsProvider";

/**
 * Registers VS Code commands for managing smell filters.
 * @param context - The VS Code extension context.
 * @param filterSmellsProvider - The provider responsible for handling smell filtering.
 */
export function registerFilterSmellCommands(
  context: vscode.ExtensionContext,
  filterSmellsProvider: FilterSmellsProvider
) {
  /**
   * Toggles the state of a specific smell filter.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.toggleSmellFilter",
      (smellKey: string) => {
        filterSmellsProvider.toggleSmell(smellKey);
      }
    )
  );

  /**
   * Edits a specific smell filter option.
   * Prompts the user for input, validates the value, and updates the setting.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.editSmellFilterOption",
      async (item: any) => {
        if (!item || !item.smellKey || !item.optionKey) {
          vscode.window.showErrorMessage("Error: Missing smell or option key.");
          return;
        }

        const { smellKey, optionKey, value: oldValue } = item;

        const newValue = await vscode.window.showInputBox({
          prompt: `Enter a new value for ${optionKey}`,
          value: oldValue?.toString() || "",
          validateInput: (input) =>
            isNaN(Number(input)) ? "Must be a number" : undefined,
        });

        if (newValue !== undefined && !isNaN(Number(newValue))) {
          filterSmellsProvider.updateOption(
            smellKey,
            optionKey,
            Number(newValue)
          );
          filterSmellsProvider.refresh();
        }
      }
    )
  );

  /**
   * Enables all smell filters.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.selectAllFilterSmells",
      () => {
        filterSmellsProvider.setAllSmellsEnabled(true);
      }
    )
  );

  /**
   * Disables all smell filters.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eco-optimizer.deselectAllFilterSmells",
      () => {
        filterSmellsProvider.setAllSmellsEnabled(false);
      }
    )
  );
}
