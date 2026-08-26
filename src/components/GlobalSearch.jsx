import {
  useState,
  useMemo,
  useRef,
  useEffect
} from "react";

const MAX_MATCHES_PER_FILE = 5;
const MAX_TOTAL_RESULTS = 200;

function GlobalSearch({
  comparison,
  onNavigate
}) {
  const [query, setQuery] =
    useState("");

  const [dismissed, setDismissed] =
    useState(false);

  const containerRef = useRef(null);


  /* =========================
     CLOSE ON OUTSIDE CLICK
  ========================= */

  useEffect(() => {

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setDismissed(true);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);


  const trimmed = query.trim();

  const isOpen =
    !dismissed &&
    trimmed.length >= 2 &&
    Boolean(comparison);


  /* =========================
     COMPUTE MATCHES
  ========================= */

  const results = useMemo(() => {

    if (!comparison || trimmed.length < 2) {
      return [];
    }

    const needle = trimmed.toLowerCase();

    const grouped = [];

    let totalCount = 0;

    for (const file of comparison.files) {

      if (totalCount >= MAX_TOTAL_RESULTS) {
        break;
      }

      const matches = [];
      let overflow = 0;

      for (
        let index = 0;
        index < file.changes.length;
        index++
      ) {

        const row = file.changes[index];

        const leftHit =
          row.left &&
          row.left
            .toLowerCase()
            .includes(needle);

        const rightHit =
          row.right &&
          row.right
            .toLowerCase()
            .includes(needle);

        if (!leftHit && !rightHit) {
          continue;
        }

        if (
          matches.length >=
          MAX_MATCHES_PER_FILE
        ) {
          overflow++;
          continue;
        }

        matches.push({
          rowIndex: index,
          side: rightHit ? "right" : "left",
          row
        });

        totalCount++;
      }

      if (matches.length > 0) {
        grouped.push({
          file,
          matches,
          overflow
        });
      }
    }

    return grouped;
  }, [comparison, trimmed]);

  const totalMatches = results.reduce(
    (sum, group) => sum + group.matches.length,
    0
  );


  function handleSelect(file, rowIndex) {
    onNavigate(file, rowIndex);
    setDismissed(true);
  }


  return (
    <div
      className="global-search"
      ref={containerRef}
    >

      <div className="global-search-input-wrap">

        <span className="global-search-icon">
          🔍
        </span>

        <input
          type="text"
          placeholder={
            comparison
              ? "Search code across all files..."
              : "Compare folders to search..."
          }
          disabled={!comparison}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setDismissed(false);
          }}
          onFocus={() =>
            setDismissed(false)
          }
        />

        {query.length > 0 && (
          <button
            type="button"
            className="global-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setDismissed(true);
            }}
          >
            ✕
          </button>
        )}

      </div>

      {isOpen && (

        <div className="global-search-results">

          {results.length === 0 ? (

            <div className="no-files">
              No matches found.
            </div>

          ) : (

            <>
              <div className="global-search-summary">
                {totalMatches} match
                {totalMatches === 1 ? "" : "es"}
                {" "}in {results.length} file
                {results.length === 1 ? "" : "s"}
              </div>

              {results.map((group) => (

                <div
                  key={group.file.path}
                  className="search-file-group"
                >

                  <div className="search-file-group-header">

                    <span
                      className={
                        `status ${group.file.status}`
                      }
                    >
                      {getStatusLabel(
                        group.file.status
                      )}
                    </span>

                    <span className="search-file-path">
                      {group.file.path}
                    </span>

                  </div>

                  {group.matches.map((match) => (

                    <button
                      key={
                        `${match.rowIndex}-${match.side}`
                      }
                      type="button"
                      className="search-match-row"
                      onClick={() =>
                        handleSelect(
                          group.file,
                          match.rowIndex
                        )
                      }
                    >

                      <span className="search-match-line">
                        {match.side === "left"
                          ? match.row.leftLineNumber
                          : match.row.rightLineNumber}
                      </span>

                      <span className="search-match-snippet">
                        {highlightMatch(
                          match.side === "left"
                            ? match.row.left
                            : match.row.right,
                          trimmed
                        )}
                      </span>

                    </button>

                  ))}

                  {group.overflow > 0 && (
                    <div className="search-match-overflow">
                      +{group.overflow} more match
                      {group.overflow === 1 ? "" : "es"}
                      {" "}in this file
                    </div>
                  )}

                </div>

              ))}
            </>

          )}

        </div>

      )}

    </div>
  );
}


/* =========================
   HIGHLIGHT MATCHED TEXT
========================= */

function highlightMatch(text, query) {

  if (!text) {
    return text;
  }

  const lower = text.toLowerCase();
  const needle = query.toLowerCase();

  const parts = [];

  let cursor = 0;
  let matchIndex = lower.indexOf(
    needle,
    cursor
  );

  if (matchIndex === -1) {
    return text;
  }

  while (matchIndex !== -1) {

    if (matchIndex > cursor) {
      parts.push(
        <span key={cursor}>
          {text.slice(cursor, matchIndex)}
        </span>
      );
    }

    parts.push(
      <mark key={matchIndex}>
        {text.slice(
          matchIndex,
          matchIndex + needle.length
        )}
      </mark>
    );

    cursor = matchIndex + needle.length;

    matchIndex = lower.indexOf(
      needle,
      cursor
    );
  }

  if (cursor < text.length) {
    parts.push(
      <span key={`tail-${cursor}`}>
        {text.slice(cursor)}
      </span>
    );
  }

  return parts;
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

export default GlobalSearch;