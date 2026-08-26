import { useState } from "react";

function FileTree({ files, selectedFile, onSelect }) {
  const [search, setSearch] = useState("");

  const [onlyChanges, setOnlyChanges] = useState(false);

  const filteredFiles = files
    .filter((file) => file.path.toLowerCase().includes(search.toLowerCase()))
    .filter((file) => !onlyChanges || file.status !== "unchanged");

  const changedCount = files.filter(
    (file) => file.status !== "unchanged",
  ).length;

  return (
    <div className="file-tree">
      <div className="file-header">
        <div>
          <strong>Files</strong>

          <span>
            {onlyChanges || search
              ? `${filteredFiles.length}/${files.length}`
              : files.length}
          </span>
        </div>

        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label className="file-filter-toggle">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={(event) => setOnlyChanges(event.target.checked)}
          />

          <span>
            Show only files with changes
            {changedCount > 0 && ` (${changedCount})`}
          </span>
        </label>
      </div>

      <div className="file-list">
        {filteredFiles.length === 0 ? (
          <div className="no-files">
            {onlyChanges && !search ? "No changed files." : "No files found."}
          </div>
        ) : (
          filteredFiles.map((file) => (
            <button
              key={file.path}
              className={
                "file-item " + (selectedFile === file.path ? "selected" : "")
              }
              onClick={() => onSelect(file)}
            >
              <span className="file-name">{file.path}</span>

              <span className={`status ${file.status}`}>
                {getStatusLabel(file.status)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  switch (status) {
    case "added":
      return "+";

    case "removed":
      return "-";

    case "changed":
      return "~";

    case "unchanged":
      return "=";

    default:
      return "?";
  }
}

export default FileTree;
