import { useRef } from "react";

import {
  FolderIcon
} from "@heroicons/react/24/outline";

import {
  readDirectory,
  isCodeFile
} from "../utils/folderReader";

function FolderSelector({
  side,
  folder,
  onFolderSelected
}) {

  const inputRef = useRef(null);

  async function handleSelectFolder() {
    if ("showDirectoryPicker" in window) {
      try {
        const directory =
          await window.showDirectoryPicker();

        const files = [];

        await readDirectory(
          directory,
          "",
          files
        );

        onFolderSelected({
          name: directory.name,
          files,
          handle: directory
        });
      } catch (error) {
        if (
          error.name !==
          "AbortError"
        ) {
          console.error(error);
        }
      }

      return;
    }

    inputRef.current?.click();
  }

  async function handleInputChange(event) {
    const selectedFiles =
      [...event.target.files];

    if (!selectedFiles.length) {
      return;
    }

    const files =
      selectedFiles.map(file => ({
        path: file.webkitRelativePath
          .split("/")
          .slice(1)
          .join("/"),
        content: ""
      }));

    for (
      let index = 0;
      index < selectedFiles.length;
      index++
    ) {
      const file =
        selectedFiles[index];

      if (isCodeFile(file.name)) {
        files[index].content =
          await file.text();
      }
    }

    onFolderSelected({
      name:
        selectedFiles[0]
          .webkitRelativePath
          .split("/")[0],
      files:
        files.filter(
          file =>
            file.content !== ""
        ),
      handle: null
    });

    event.target.value = "";
  }

  return (
    <>
      <button
        className={`folder-button ${side}`}
        onClick={handleSelectFolder}
      >
        <FolderIcon className="icon" />

        {folder
          ? `Change ${
              side === "left"
                ? "Left"
                : "Right"
            } Folder`
          : `Select ${
              side === "left"
                ? "Left"
                : "Right"
            } Folder`}
      </button>

      <input
        ref={inputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        hidden
        onChange={handleInputChange}
      />
    </>
  );
}

export default FolderSelector;