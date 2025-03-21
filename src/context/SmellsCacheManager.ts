import * as vscode from "vscode";
import { createHash } from "crypto";
import { SmellsDisplayProvider } from "../providers/SmellsViewProvider";

/**
 * Manages caching of detected smells and file hashes to avoid redundant backend calls.
 */
export class SmellsCacheManager {
  private static readonly SMELL_CACHE_KEY = "ecoOptimizer.smellCache"; // Cache key for storing smells
  private static readonly FILE_HASH_CACHE_KEY = "ecoOptimizer.fileHashes"; // Cache key for storing file hashes

  constructor(private context: vscode.ExtensionContext) {}

  // ============================
  // Smell Caching Methods
  // ============================

  /**
   * Retrieves cached smells for a given file.
   * If the file has been analyzed and found clean, this will return an empty array.
   *
   * @param filePath - The absolute path of the file.
   * @returns An array of detected smells or `undefined` if the file has not been analyzed.
   */
  public getCachedSmells(filePath: string): any[] | undefined {
    const cache = this.context.workspaceState.get<Record<string, any[]>>(
      SmellsCacheManager.SMELL_CACHE_KEY,
      {}
    );

    return cache[filePath]; // Returns an array of smells or `undefined` if not cached
  }

  /**
   * Caches detected smells for a given file.
   * If no smells are detected, caches an empty array to avoid redundant backend calls.
   *
   * @param filePath - The absolute path of the file.
   * @param smells - The detected smells to store (empty array if no smells found).
   */
  public async setCachedSmells(filePath: string, smells: any[]): Promise<void> {
    const cache = this.context.workspaceState.get<Record<string, any[]>>(
      SmellsCacheManager.SMELL_CACHE_KEY,
      {}
    );

    cache[filePath] = smells; // Store detected smells or an empty array if clean

    await this.context.workspaceState.update(
      SmellsCacheManager.SMELL_CACHE_KEY,
      cache
    );
  }

  /**
   * Clears all cached smells from the workspace.
   * This forces a fresh analysis of all files when `detectSmellsFile` is called.
   */
  public async clearSmellsCache(): Promise<void> {
    await this.context.workspaceState.update(
      SmellsCacheManager.SMELL_CACHE_KEY,
      undefined
    );
  }

  /**
   * Clears cached smells for a specific file.
   *
   * @param filePath - The path of the file to clear.
   */
  public async clearCachedSmellsForFile(filePath: string): Promise<void> {
    const cache = this.context.workspaceState.get<Record<string, any[]>>(
      SmellsCacheManager.SMELL_CACHE_KEY,
      {}
    );

    delete cache[filePath]; // Remove the file's cached smells

    await this.context.workspaceState.update(
      SmellsCacheManager.SMELL_CACHE_KEY,
      cache
    );
  }

  // ============================
  // File Hash Caching Methods
  // ============================

  /**
   * Computes a SHA256 hash of a file's contents.
   * @param content - The file content as a string.
   * @returns A SHA256 hash string.
   */
  public computeFileHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Stores a hash of a file's contents in workspaceState.
   * @param filePath - Absolute path of the file.
   * @param hash - The computed file hash.
   */
  public async storeFileHash(filePath: string, hash: string): Promise<void> {
    const hashes = this.context.workspaceState.get<Record<string, string>>(
      SmellsCacheManager.FILE_HASH_CACHE_KEY,
      {}
    );
    hashes[filePath] = hash;
    await this.context.workspaceState.update(
      SmellsCacheManager.FILE_HASH_CACHE_KEY,
      hashes
    );
  }

  /**
   * Retrieves the stored hash for a given file.
   * @param filePath - Absolute path of the file.
   * @returns The stored hash or undefined if not found.
   */
  public getStoredFileHash(filePath: string): string | undefined {
    const hashes = this.context.workspaceState.get<Record<string, string>>(
      SmellsCacheManager.FILE_HASH_CACHE_KEY,
      {}
    );
    return hashes[filePath];
  }

  // ============================
  // UI Refresh Methods
  // ============================

  /**
   * Clears all cached smells and refreshes the UI.
   * Used by both "Clear Smells Cache" and "Reset Configuration".
   *
   * @param smellsDisplayProvider - The tree view provider responsible for the UI.
   */
  public async clearCacheAndRefreshUI(
    smellsDisplayProvider: SmellsDisplayProvider
  ): Promise<void> {
    // Remove all cached smells from the workspace state
    await this.clearSmellsCache();

    // Reset the UI state, including icons and dropdowns
    smellsDisplayProvider.resetAllSmells();

    // Refresh the UI to reflect the cleared cache
    smellsDisplayProvider.refresh();
  }
}
