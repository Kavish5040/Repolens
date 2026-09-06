import type { CitationMatch } from "./types.ts";

/**
 * Regular expression to match file citations in the format:
 * [file:path/to/file.ext]
 * [file:path/to/file.ext#L10-L25]
 * [file:path/to/file.ext:L10-L25]
 */
const CITATION_REGEX = /\[file:([^\]\s]+)\]/gi;

/**
 * Extracts and validates file citations from model response text against a set of known supplied files.
 *
 * @param text The raw response text from the model.
 * @param knownContextFiles Set or Array of valid file paths that were actually supplied in the model's context.
 * @returns Array of CitationMatch objects with validation status.
 */
export function extractAndValidateCitations(
  text: string,
  knownContextFiles: Set<string> | string[]
): CitationMatch[] {
  if (!text) return [];

  const validSet = knownContextFiles instanceof Set
    ? knownContextFiles
    : new Set(knownContextFiles);

  const matches: CitationMatch[] = [];
  const seenRaw = new Set<string>();

  let match: RegExpExecArray | null;
  const regex = new RegExp(CITATION_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    if (seenRaw.has(raw)) continue;
    seenRaw.add(raw);

    const inner = match[1].trim();
    // Parse path and optional line numbers (e.g. "path/to/file.ts#L10-L20" or "path/to/file.ts:L10-L20")
    let filePath = inner;
    let lineRange: string | undefined = undefined;

    const hashIdx = inner.indexOf("#");
    const colonIdx = inner.indexOf(":", inner.lastIndexOf("/"));

    if (hashIdx !== -1) {
      filePath = inner.substring(0, hashIdx);
      lineRange = inner.substring(hashIdx + 1);
    } else if (colonIdx !== -1) {
      filePath = inner.substring(0, colonIdx);
      lineRange = inner.substring(colonIdx + 1);
    }

    // Clean any leading/trailing slashes or quotes
    filePath = filePath.replace(/^[/'"]+|[/'"]+$/g, "");

    // Check if the file is in the supplied context files
    const isValid = validSet.has(filePath) || Array.from(validSet).some(
      (known) => known.endsWith(filePath) || filePath.endsWith(known)
    );

    matches.push({
      raw,
      path: filePath,
      lineRange,
      isValid,
    });
  }

  return matches;
}

/**
 * Sanitizes or formats text by replacing unverified or malformed citations with cleaner text if needed.
 */
export function sanitizeCitations(text: string, knownContextFiles: Set<string> | string[]): string {
  if (!text) return "";
  const validSet = knownContextFiles instanceof Set ? knownContextFiles : new Set(knownContextFiles);

  return text.replace(CITATION_REGEX, (raw, inner) => {
    let filePath = inner.trim().replace(/^[/'"]+|[/'"]+$/g, "");
    const hashIdx = filePath.indexOf("#");
    if (hashIdx !== -1) filePath = filePath.substring(0, hashIdx);

    const isValid = validSet.has(filePath) || Array.from(validSet).some(
      (known) => known.endsWith(filePath) || filePath.endsWith(known)
    );

    // If valid, keep [file:path], if completely invalid/unverified, render as backticked code
    return isValid ? raw : `\`${filePath}\``;
  });
}
