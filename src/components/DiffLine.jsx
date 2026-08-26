function DiffLine({
  lineNumber,
  content,
  type = "",
  highlighted = false,
  rowIndex
}) {
  return (
    <div
      className={
        `diff-line ${type} ${
          highlighted ? "search-match" : ""
        }`
      }
      data-row-index={rowIndex}
    >
      <span className="line-number">
        {lineNumber}
      </span>

      <span className="line-content">
        {content}
      </span>
    </div>
  );
}

export default DiffLine;