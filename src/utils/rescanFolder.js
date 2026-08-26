import { readDirectory } from "./folderReader";

/*
  Re-reads a folder's current contents
  from disk right before comparing.

  - If the folder was picked via
    showDirectoryPicker, `folder.handle`
    is a live FileSystemDirectoryHandle:
    re-walk it, no dialog needed (beyond
    a permission re-check, which is
    normally silent once already granted).

  - If the folder was picked via the
    <input webkitdirectory> fallback,
    there's no handle - the browser gives
    a one-time file snapshot with no way
    to re-read from disk later. In that
    case we can't silently rescan, so we
    surface a clear error instead of
    pretending the data is fresh.
*/

export async function rescanFolder(
  folder,
  label
) {
  if (!folder) {
    return folder;
  }

  if (!folder.handle) {
    throw new Error(
      `${label} folder can't be rescanned automatically in this browser. ` +
      `Click "Change ${label} Folder" to pick it again with the latest files.`
    );
  }

  if (folder.handle.queryPermission) {
    const permission =
      await folder.handle.queryPermission(
        { mode: "read" }
      );

    if (permission !== "granted") {
      const requested =
        await folder.handle.requestPermission(
          { mode: "read" }
        );

      if (requested !== "granted") {
        throw new Error(
          `Permission to read the ${label} folder was denied.`
        );
      }
    }
  }

  const files = [];

  await readDirectory(
    folder.handle,
    "",
    files
  );

  return {
    name: folder.handle.name,
    files,
    handle: folder.handle
  };
}