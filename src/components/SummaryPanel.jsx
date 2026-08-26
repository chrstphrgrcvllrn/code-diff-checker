function SummaryPanel({ comparison }) {
  const { summary, files } = comparison;

  const changedFiles = files
    .filter((file) => file.status !== "unchanged")
    .map((file) => ({
      ...file,
      totalLines:
        (file.stats?.added || 0) +
        (file.stats?.removed || 0) +
        (file.stats?.changed || 0),
    }))
    .sort((a, b) => b.totalLines - a.totalLines);

  return (
    <div className="summary-panel">
      <div className="summary-panel-header">
        <h2>Comparison Summary</h2>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-card-value">{summary.total}</span>
          <span className="summary-card-label">Total Files</span>
        </div>

        <div className="summary-card added">
          <span className="summary-card-value">{summary.added}</span>
          <span className="summary-card-label">Added</span>
        </div>

        <div className="summary-card removed">
          <span className="summary-card-value">{summary.removed}</span>
          <span className="summary-card-label">Removed</span>
        </div>

        <div className="summary-card changed">
          <span className="summary-card-value">{summary.changed}</span>
          <span className="summary-card-label">Changed</span>
        </div>

        <div className="summary-card unchanged">
          <span className="summary-card-value">{summary.unchanged}</span>
          <span className="summary-card-label">Unchanged</span>
        </div>
      </div>

      <div className="summary-lines">
        <span className="lines-added">+{summary.linesAdded} lines</span>

        <span className="lines-removed">-{summary.linesRemoved} lines</span>

        <span className="lines-changed">~{summary.linesChanged} lines</span>
      </div>

      <div className="summary-file-list">
        <div className="summary-file-list-header">
          <strong>Changed Files</strong>
          <span>{changedFiles.length}</span>
        </div>

        {changedFiles.length === 0 ? (
          <div className="no-files">No differences found.</div>
        ) : (
          changedFiles.map((file) => (
            <div key={file.path} className="summary-file-row">
              <span className={`status ${file.status}`}>
                {getStatusLabel(file.status)}
              </span>

              <span className="summary-file-path">{file.path}</span>

              <span className="summary-file-stats">
                {file.stats?.added > 0 && (
                  <span className="lines-added">+{file.stats.added}</span>
                )}

                {file.stats?.removed > 0 && (
                  <span className="lines-removed">-{file.stats.removed}</span>
                )}

                {file.stats?.changed > 0 && (
                  <span className="lines-changed">~{file.stats.changed}</span>
                )}
              </span>
            </div>
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

export default SummaryPanel;
