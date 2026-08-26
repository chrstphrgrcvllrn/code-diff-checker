const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".idea",
  ".vscode"
]);

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",

  "html",
  "htm",

  "css",
  "scss",
  "sass",
  "less",

  "json",
  "jsonc",
  "xml",
  "yaml",
  "yml",
  "toml",

  "py",
  "java",
  "kt",
  "kts",

  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",

  "cs",
  "go",
  "rs",
  "rb",
  "php",
  "swift",
  "dart",

  "sql",

  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",

  "lua",
  "pl",
  "pm",

  "ex",
  "exs",

  "erl",
  "hrl",

  "fs",
  "fsx",

  "sol",

  "graphql",
  "gql",

  "md",
  "mdx"
]);


export function isCodeFile(name) {
  const extension =
    name
      .split(".")
      .pop()
      .toLowerCase();

  return CODE_EXTENSIONS.has(extension);
}


export function shouldIgnoreDirectory(
  name
) {
  return IGNORED_DIRECTORIES.has(name);
}


/*
  Walks a FileSystemDirectoryHandle
  (from showDirectoryPicker) and reads
  every code file's current content.

  Used both for the initial folder pick
  and for re-reading the same handle
  later on demand.
*/

export async function readDirectory(
  directory,
  prefix,
  result
) {
  for await (
    const [name, handle]
    of directory.entries()
  ) {
    if (
      shouldIgnoreDirectory(name)
    ) {
      continue;
    }

    const path = prefix
      ? `${prefix}/${name}`
      : name;

    if (
      handle.kind ===
      "directory"
    ) {
      await readDirectory(
        handle,
        path,
        result
      );

      continue;
    }

    if (
      !isCodeFile(name)
    ) {
      continue;
    }

    try {
      const file =
        await handle.getFile();

      const content =
        await file.text();

      result.push({
        path,
        content
      });

    } catch (error) {
      console.warn(
        `Unable to read ${path}`,
        error
      );
    }
  }
}