import { useState } from "react";

function FileTree({
  files,
  selectedFile,
  onSelect
}) {
  const [search, setSearch] =
    useState("");

  const filteredFiles =
    files.filter(file =>
      file.path
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div className="file-tree">

      <div className="file-header">

        <div>
          <strong>
            Files
          </strong>

          <span>
            {files.length}
          </span>
        </div>

        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={event =>
            setSearch(
              event.target.value
            )
          }
        />

      </div>

      <div className="file-list">

        {filteredFiles.length ===
        0 ? (

          <div className="no-files">
            No files found.
          </div>

        ) : (

          filteredFiles.map(
            file => (

              <button
                key={file.path}
                className={
                  "file-item " +
                  (
                    selectedFile ===
                    file.path
                      ? "selected"
                      : ""
                  )
                }
                onClick={() =>
                  onSelect(file)
                }
              >

                <span className="file-name">
                  {file.path}
                </span>

                <span
                  className={
                    `status ${file.status}`
                  }
                >
                  {getStatusLabel(
                    file.status
                  )}
                </span>

              </button>

            )
          )

        )}

      </div>

    </div>
  );
}

function getStatusLabel(
  status
) {
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