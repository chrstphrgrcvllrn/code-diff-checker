import { useEffect, useRef, useState } from "react";

import DiffLine from "./DiffLine";
import DiffMinimap from "./DiffMinimap";

/*
  Renders the inline parts for one side of a row.

  - "unchanged" rows have no inline parts; just
    show the plain text.
  - "changed" rows carry the SAME inline array on
    both leftInline and rightInline (it's the full
    word-level diff), so we filter out whichever
    half doesn't belong to this side.
  - "added" / "removed" rows already only have
    parts for the side they belong to.
*/

function renderInline(row, side) {
  if (row.type === "unchanged") {
    return side === "left" ? row.left : row.right;
  }

  const parts = side === "left" ? row.leftInline : row.rightInline;

  return parts
    .filter((part) => (side === "left" ? !part.added : !part.removed))
    .map((part, index) => {
      if (!part.added && !part.removed) {
        return <span key={index}>{part.value}</span>;
      }

      return (
        <span
          key={index}
          className={part.added ? "inline-added" : "inline-removed"}
        >
          {part.value}
        </span>
      );
    });
}

function DiffViewer({ file, scrollTarget }) {
  const leftRef = useRef(null);

  const rightRef = useRef(null);

  const syncing = useRef(false);

  const [language, setLanguage] = useState("plaintext");

  const [flashedRowIndex, setFlashedRowIndex] = useState(null);

  useEffect(() => {
    setLanguage(detectLanguage(file.path));
  }, [file]);

  useEffect(() => {
    const left = leftRef.current;

    const right = rightRef.current;

    if (!left || !right) {
      return;
    }

    function syncLeft() {
      if (syncing.current) {
        return;
      }

      syncing.current = true;

      right.scrollTop = left.scrollTop;

      right.scrollLeft = left.scrollLeft;

      requestAnimationFrame(() => {
        syncing.current = false;
      });
    }

    function syncRight() {
      if (syncing.current) {
        return;
      }

      syncing.current = true;

      left.scrollTop = right.scrollTop;

      left.scrollLeft = right.scrollLeft;

      requestAnimationFrame(() => {
        syncing.current = false;
      });
    }

    left.addEventListener("scroll", syncLeft);

    right.addEventListener("scroll", syncRight);

    return () => {
      left.removeEventListener("scroll", syncLeft);

      right.removeEventListener("scroll", syncRight);
    };
  }, [file]);

  useEffect(() => {
    if (!scrollTarget || scrollTarget.path !== file.path) {
      return;
    }

    const selector = `[data-row-index="${scrollTarget.rowIndex}"]`;

    const leftEl = leftRef.current?.querySelector(selector);

    const rightEl = rightRef.current?.querySelector(selector);

    (leftEl || rightEl)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });

    setFlashedRowIndex(scrollTarget.rowIndex);

    const timeout = setTimeout(() => {
      setFlashedRowIndex(null);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [scrollTarget, file]);

  /*
    `file.changes` comes from compareFolders() and
    is already aligned line-by-line across both
    sides, with word-level inline parts attached.
    No re-diffing needed here.
  */

  const rows = file.changes || [];

  return (
    <div className="diff-viewer">
      <div className="diff-toolbar">
        <div>
          <strong>{file.path}</strong>

          <span className={`toolbar-status ${file.status}`}>{file.status}</span>
        </div>

        <span>{language}</span>
      </div>

      <div className="diff-columns">
        <div className="code-panel">
          <div className="code-panel-header">LEFT</div>

          <div ref={leftRef} className="code-scroll">
            {rows.map((row, index) => (
              <DiffLine
                key={index}
                rowIndex={index}
                highlighted={flashedRowIndex === index}
                lineNumber={row.leftLineNumber ?? ""}
                type={row.type === "added" ? "placeholder" : row.type}
                content={
                  row.leftLineNumber === null ? "" : renderInline(row, "left")
                }
              />
            ))}
          </div>
        </div>

        <div className="code-panel">
          <div className="code-panel-header">RIGHT</div>

          <div ref={rightRef} className="code-scroll">
            {rows.map((row, index) => (
              <DiffLine
                key={index}
                rowIndex={index}
                highlighted={flashedRowIndex === index}
                lineNumber={row.rightLineNumber ?? ""}
                type={row.type === "removed" ? "placeholder" : row.type}
                content={
                  row.rightLineNumber === null ? "" : renderInline(row, "right")
                }
              />
            ))}
          </div>
        </div>

        <DiffMinimap rows={rows} containerRef={rightRef} />
      </div>
    </div>
  );
}

function detectLanguage(filename) {
  const extension = filename.split(".").pop().toLowerCase();

  const languages = {
    js: "JavaScript",
    jsx: "React JSX",
    ts: "TypeScript",
    tsx: "React TSX",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    py: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    cs: "C#",
    go: "Go",
    rs: "Rust",
    php: "PHP",
    rb: "Ruby",
    sql: "SQL",
    sh: "Shell",
    md: "Markdown",
  };

  return languages[extension] || "Plain Text";
}

export default DiffViewer;
