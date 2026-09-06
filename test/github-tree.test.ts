import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTreeHierarchy, detectKeyDocuments } from "../lib/github/tree.ts";
import type { GitTreeItemDto } from "../lib/github/types.ts";

describe("GitHub Tree Hierarchy & Key Document Detector", () => {
  const sampleTreeItems: GitTreeItemDto[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: "sha-readme", size: 2048, url: "" },
    { path: "LICENSE", mode: "100644", type: "blob", sha: "sha-license", size: 1024, url: "" },
    { path: "package.json", mode: "100644", type: "blob", sha: "sha-pkg", size: 512, url: "" },
    { path: ".github", mode: "040000", type: "tree", sha: "sha-gh", url: "" },
    { path: ".github/CONTRIBUTING.md", mode: "100644", type: "blob", sha: "sha-contrib", size: 4096, url: "" },
    { path: ".github/CODE_OF_CONDUCT.md", mode: "100644", type: "blob", sha: "sha-coc", size: 3000, url: "" },
    { path: "src", mode: "040000", type: "tree", sha: "sha-src", url: "" },
    { path: "src/components", mode: "040000", type: "tree", sha: "sha-cmp", url: "" },
    { path: "src/components/Button.tsx", mode: "100644", type: "blob", sha: "sha-btn", size: 1500, url: "" },
    { path: "src/components/Input.tsx", mode: "100644", type: "blob", sha: "sha-inp", size: 1200, url: "" },
    { path: "src/index.ts", mode: "100644", type: "blob", sha: "sha-idx", size: 800, url: "" },
    { path: "tsconfig.json", mode: "100644", type: "blob", sha: "sha-tsc", size: 350, url: "" },
  ];

  it("should detect all key documents and order them by priority", () => {
    const keyDocs = detectKeyDocuments(sampleTreeItems);
    assert.equal(keyDocs.length, 5);

    assert.equal(keyDocs[0].type, "readme");
    assert.equal(keyDocs[0].path, "README.md");

    assert.equal(keyDocs[1].type, "contributing");
    assert.equal(keyDocs[1].path, ".github/CONTRIBUTING.md");

    assert.equal(keyDocs[2].type, "manifest");
    assert.equal(keyDocs[2].path, "package.json");

    assert.equal(keyDocs[3].type, "license");
    assert.equal(keyDocs[3].path, "LICENSE");

    assert.equal(keyDocs[4].type, "code_of_conduct");
    assert.equal(keyDocs[4].path, ".github/CODE_OF_CONDUCT.md");
  });

  it("should build a nested tree hierarchy with directories first", () => {
    const { rootNodes, totalFiles, totalDirectories } = buildTreeHierarchy(sampleTreeItems);

    assert.equal(totalFiles, 9);
    assert.equal(totalDirectories, 3);

    // Root level should have directories first (.github, src) then files
    assert.equal(rootNodes[0].type, "directory");
    assert.equal(rootNodes[0].name, ".github");
    assert.equal(rootNodes[0].fileCount, 2);

    assert.equal(rootNodes[1].type, "directory");
    assert.equal(rootNodes[1].name, "src");
    assert.equal(rootNodes[1].fileCount, 3);
    assert.equal(rootNodes[1].size, 1500 + 1200 + 800);

    // Inside src: components directory first, then index.ts
    const srcChildren = rootNodes[1].children!;
    assert.equal(srcChildren[0].type, "directory");
    assert.equal(srcChildren[0].name, "components");
    assert.equal(srcChildren[0].fileCount, 2);

    assert.equal(srcChildren[1].type, "file");
    assert.equal(srcChildren[1].name, "index.ts");
    assert.equal(srcChildren[1].extension, ".ts");

    // Key documents in tree should be flagged
    const readmeNode = rootNodes.find((n) => n.name === "README.md")!;
    assert.ok(readmeNode.isKeyDoc);
    assert.equal(readmeNode.keyDocType, "readme");
  });

  it("should gracefully handle synthesized parent directories when intermediate trees are omitted", () => {
    const itemsWithoutParents: GitTreeItemDto[] = [
      { path: "deeply/nested/folder/file.js", mode: "100644", type: "blob", sha: "sha-deep", size: 100, url: "" },
    ];

    const { rootNodes, totalFiles } = buildTreeHierarchy(itemsWithoutParents);
    assert.equal(totalFiles, 1);
    assert.equal(rootNodes[0].name, "deeply");
    assert.equal(rootNodes[0].children![0].name, "nested");
    assert.equal(rootNodes[0].children![0].children![0].name, "folder");
    assert.equal(rootNodes[0].children![0].children![0].children![0].name, "file.js");
  });
});
