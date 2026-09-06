import type {
  GitTreeItemDto,
  TreeNode,
  KeyDocument,
  KeyDocumentType,
} from "./types.ts";

interface KeyDocRule {
  type: KeyDocumentType;
  label: string;
  badgeColor: string;
  pattern: RegExp;
  priority: number;
}

const KEY_DOC_RULES: KeyDocRule[] = [
  {
    type: "readme",
    label: "README",
    badgeColor: "blue",
    pattern: /^(?:docs\/)?readme(?:\.(?:md|markdown|mdx|rst|txt))?$/i,
    priority: 1,
  },
  {
    type: "contributing",
    label: "Contributing",
    badgeColor: "emerald",
    pattern: /^(?:\.github\/|docs\/)?contributing(?:\.(?:md|markdown|mdx|rst|txt))?$/i,
    priority: 2,
  },
  {
    type: "architecture",
    label: "Architecture",
    badgeColor: "purple",
    pattern: /^(?:docs\/)?(?:architecture|design|design-doc|rfc|adr)(?:\.(?:md|markdown|mdx|txt))?$/i,
    priority: 3,
  },
  {
    type: "manifest",
    label: "Manifest",
    badgeColor: "amber",
    pattern: /^(?:package\.json|cargo\.toml|pyproject\.toml|go\.mod|pom\.xml|build\.gradle|requirements\.txt|dockerfile|docker-compose\.ya?ml)$/i,
    priority: 4,
  },
  {
    type: "license",
    label: "License",
    badgeColor: "zinc",
    pattern: /^(?:license|licence|copying)(?:\.(?:md|txt))?$/i,
    priority: 5,
  },
  {
    type: "code_of_conduct",
    label: "Code of Conduct",
    badgeColor: "pink",
    pattern: /^(?:\.github\/|docs\/)?code_of_conduct(?:\.(?:md|markdown|txt))?$/i,
    priority: 6,
  },
  {
    type: "security",
    label: "Security Policy",
    badgeColor: "rose",
    pattern: /^(?:\.github\/)?security(?:\.(?:md|txt))?$/i,
    priority: 7,
  },
];

/**
 * Detects key onboarding and manifest documents from a list of repository tree items.
 */
export function detectKeyDocuments(items: GitTreeItemDto[]): KeyDocument[] {
  const matchedDocs: (KeyDocument & { priority: number })[] = [];
  const seenPaths = new Set<string>();

  for (const item of items) {
    if (item.type !== "blob") continue;

    for (const rule of KEY_DOC_RULES) {
      if (rule.pattern.test(item.path) && !seenPaths.has(item.path)) {
        seenPaths.add(item.path);
        const fileName = item.path.split("/").pop() || item.path;
        matchedDocs.push({
          type: rule.type,
          name: fileName,
          path: item.path,
          label: rule.label,
          badgeColor: rule.badgeColor,
          size: item.size,
          priority: rule.priority,
        });
        break;
      }
    }
  }

  return matchedDocs.sort((a, b) => a.priority - b.priority);
}

/**
 * Pure algorithm to transform flat GitTreeItemDto items into a nested TreeNode hierarchy.
 * Sorts directories before files alphabetically at all levels and calculates aggregated file counts.
 */
export function buildTreeHierarchy(items: GitTreeItemDto[]): {
  rootNodes: TreeNode[];
  keyDocuments: KeyDocument[];
  totalFiles: number;
  totalDirectories: number;
} {
  const keyDocuments = detectKeyDocuments(items);
  const keyDocPathMap = new Map<string, KeyDocumentType>();
  for (const doc of keyDocuments) {
    keyDocPathMap.set(doc.path, doc.type);
  }

  let totalFiles = 0;
  let totalDirectories = 0;

  // Intermediate lookup map for directory nodes
  const dirMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // Sort items so parent directories are processed before nested children
  const sortedItems = [...items].sort((a, b) => a.path.localeCompare(b.path));

  // Helper to ensure a directory node and all its ancestors exist
  function ensureDirectory(dirPath: string): TreeNode {
    const existing = dirMap.get(dirPath);
    if (existing) return existing;

    const segments = dirPath.split("/");
    const name = segments[segments.length - 1];

    const dirNode: TreeNode = {
      id: dirPath,
      name,
      path: dirPath,
      type: "directory",
      sha: dirPath,
      children: [],
      fileCount: 0,
    };

    dirMap.set(dirPath, dirNode);
    totalDirectories++;

    if (segments.length === 1) {
      rootNodes.push(dirNode);
    } else {
      const parentDirPath = segments.slice(0, -1).join("/");
      const parentNode = ensureDirectory(parentDirPath);
      if (parentNode.children && !parentNode.children.some((c) => c.path === dirPath)) {
        parentNode.children.push(dirNode);
      }
    }

    return dirNode;
  }

  for (const item of sortedItems) {
    const isFile = item.type === "blob";
    if (isFile) {
      totalFiles++;
    }

    const pathSegments = item.path.split("/");
    const name = pathSegments[pathSegments.length - 1];
    const parts = name.split(".");
    const extension = isFile && parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : undefined;

    if (!isFile) {
      ensureDirectory(item.path);
    } else {
      const fileNode: TreeNode = {
        id: item.sha || item.path,
        name,
        path: item.path,
        type: "file",
        size: item.size,
        sha: item.sha,
        extension,
        isKeyDoc: keyDocPathMap.has(item.path),
        keyDocType: keyDocPathMap.get(item.path),
      };

      if (pathSegments.length === 1) {
        rootNodes.push(fileNode);
      } else {
        const parentDirPath = pathSegments.slice(0, -1).join("/");
        const parentNode = ensureDirectory(parentDirPath);
        if (parentNode.children) {
          parentNode.children.push(fileNode);
        }
      }
    }
  }

  // Recursive helper to sort children and aggregate file counts & sizes
  function processDirectory(dirNode: TreeNode): { fileCount: number; totalSize: number } {
    if (!dirNode.children) return { fileCount: 0, totalSize: 0 };

    let count = 0;
    let size = 0;

    for (const child of dirNode.children) {
      if (child.type === "file") {
        count += 1;
        size += child.size || 0;
      } else {
        const subResult = processDirectory(child);
        count += subResult.fileCount;
        size += subResult.totalSize;
      }
    }

    dirNode.fileCount = count;
    dirNode.size = size;

    // Sort: directories first (A-Z), then files (A-Z)
    dirNode.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
    });

    return { fileCount: count, totalSize: size };
  }

  // Process and sort top-level root nodes
  for (const rootNode of rootNodes) {
    if (rootNode.type === "directory") {
      processDirectory(rootNode);
    }
  }

  rootNodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  });

  return {
    rootNodes,
    keyDocuments,
    totalFiles,
    totalDirectories,
  };
}
