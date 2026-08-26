import { diffLines, diffWordsWithSpace } from "diff";

/* =========================
   CREATE FILE MAP
========================= */

function createFileMap(files) {
  const map = new Map();

  for (const file of files) {
    map.set(file.path, file);
  }

  return map;
}

/* =========================
   INLINE DIFF
========================= */

function createInlineDiff(oldLine, newLine) {
  return diffWordsWithSpace(oldLine, newLine).map((part) => ({
    value: part.value,
    added: Boolean(part.added),
    removed: Boolean(part.removed),
  }));
}

/* =========================
   LINE SIMILARITY

   Returns a 0..1 score for how similar
   two lines are, based on how much of
   their content is shared (Dice
   coefficient over the word-level diff).

   1   = identical
   0   = nothing in common
========================= */

function lineSimilarity(a, b) {
  if (a === b) {
    return 1;
  }

  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const parts = diffWordsWithSpace(a, b);

  let common = 0;

  for (const part of parts) {
    if (!part.added && !part.removed) {
      common += part.value.length;
    }
  }

  /*
    a.length + b.length double-counts the
    shared (unchanged) portion once for
    each side, which is exactly what the
    Dice coefficient wants.
  */

  return (2 * common) / (a.length + b.length);
}

/*
  Minimum similarity required for two lines
  to be treated as "the same line, modified"
  rather than an unrelated removal + addition.

  Tune this if pairing feels too eager or
  too conservative.
*/

const SIMILARITY_THRESHOLD = 0.3;

/* =========================
   SPLIT DIFF INTO LINES
========================= */

function splitLines(value) {
  const lines = value.split("\n");

  /*
    diffLines can create an empty item
    when the file ends with a newline.
  */

  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

/* =========================
   COUNT LINES

   Used for whole-file added/removed
   stats, where there's no diff hunk
   to derive line counts from.
========================= */

function countLines(content) {
  return splitLines(content).length;
}

/* =========================
   CREATE UNCHANGED ROW
========================= */

function createUnchangedRow(line, leftLineNumber, rightLineNumber) {
  return {
    type: "unchanged",

    leftLineNumber,
    rightLineNumber,

    left: line,
    right: line,

    /*
      Empty because there is no
      inline difference.
    */
    leftInline: [],
    rightInline: [],

    inline: [],
  };
}

/* =========================
   CREATE CHANGED ROW
========================= */

function createChangedRow(oldLine, newLine, leftLineNumber, rightLineNumber) {
  const inline = createInlineDiff(oldLine, newLine);

  return {
    type: "changed",

    leftLineNumber,
    rightLineNumber,

    left: oldLine,
    right: newLine,

    /*
      Both sides receive the same diff parts.

      The viewer can decide whether to show
      added or removed parts depending on
      which side it is rendering.
    */
    leftInline: inline,
    rightInline: inline,

    inline,
  };
}

/* =========================
   CREATE REMOVED ROW
========================= */

function createRemovedRow(line, leftLineNumber) {
  return {
    type: "removed",

    leftLineNumber,
    rightLineNumber: null,

    left: line,
    right: "",

    leftInline: [
      {
        value: line,
        removed: true,
        added: false,
      },
    ],

    rightInline: [],

    inline: [],
  };
}

/* =========================
   CREATE ADDED ROW
========================= */

function createAddedRow(line, rightLineNumber) {
  return {
    type: "added",

    leftLineNumber: null,
    rightLineNumber,

    left: "",
    right: line,

    leftInline: [],

    rightInline: [
      {
        value: line,
        added: true,
        removed: false,
      },
    ],

    inline: [],
  };
}

/* =========================
   ALIGN A CHANGED BLOCK

   Given a block of removed lines and a
   block of added lines (from the same
   diffLines hunk), figure out which
   removed lines actually correspond to
   which added lines.

   This is a small sequence-alignment
   (Needleman-Wunsch style) problem:
   maximize total similarity of matched
   pairs while keeping everything in its
   original relative order, and allowing
   any line to be left unmatched (a pure
   removal or pure addition) if nothing
   similar exists on the other side.
========================= */

function alignChangedBlock(removedLines, addedLines) {
  const m = removedLines.length;
  const n = addedLines.length;

  /* =========================
     SIMILARITY MATRIX
  ========================= */

  const sim = [];

  for (let i = 0; i < m; i++) {
    sim.push([]);

    for (let j = 0; j < n; j++) {
      sim[i][j] = lineSimilarity(removedLines[i], addedLines[j]);
    }
  }

  /* =========================
     DP TABLE

     dp[i][j] = best total similarity
     score aligning removed[0..i) with
     added[0..j)
  ========================= */

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  const choice = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(null),
  );

  for (let i = 1; i <= m; i++) {
    choice[i][0] = "remove";
  }

  for (let j = 1; j <= n; j++) {
    choice[0][j] = "add";
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const similarity = sim[i - 1][j - 1];

      const matchScore =
        similarity >= SIMILARITY_THRESHOLD
          ? dp[i - 1][j - 1] + similarity
          : -Infinity;

      const removeScore = dp[i - 1][j];
      const addScore = dp[i][j - 1];

      const best = Math.max(matchScore, removeScore, addScore);

      dp[i][j] = best;

      if (best === matchScore) {
        choice[i][j] = "match";
      } else if (best === removeScore) {
        choice[i][j] = "remove";
      } else {
        choice[i][j] = "add";
      }
    }
  }

  /* =========================
     TRACEBACK
  ========================= */

  const ops = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const move = choice[i][j];

    if (move === "match") {
      ops.push({
        type: "match",
        removedIndex: i - 1,
        addedIndex: j - 1,
      });
      i--;
      j--;
    } else if (move === "remove") {
      ops.push({
        type: "remove",
        removedIndex: i - 1,
      });
      i--;
    } else {
      ops.push({
        type: "add",
        addedIndex: j - 1,
      });
      j--;
    }
  }

  ops.reverse();

  return ops;
}

/* =========================
   PAIR REMOVED + ADDED BLOCKS

   Uses similarity-based alignment so that
   only genuinely-related lines get paired
   into a "changed" row with an inline
   word diff. Lines with no good match on
   the other side stay as plain removed /
   added rows instead of being force-paired
   by position.
========================= */

function pairChangedBlocks(
  removedLines,
  addedLines,
  changes,
  leftStart,
  rightStart,
) {
  const ops = alignChangedBlock(removedLines, addedLines);

  let leftLineNumber = leftStart;
  let rightLineNumber = rightStart;

  for (const op of ops) {
    if (op.type === "match") {
      changes.push(
        createChangedRow(
          removedLines[op.removedIndex],
          addedLines[op.addedIndex],
          leftLineNumber,
          rightLineNumber,
        ),
      );

      leftLineNumber++;
      rightLineNumber++;
    } else if (op.type === "remove") {
      changes.push(
        createRemovedRow(removedLines[op.removedIndex], leftLineNumber),
      );

      leftLineNumber++;
    } else {
      changes.push(createAddedRow(addedLines[op.addedIndex], rightLineNumber));

      rightLineNumber++;
    }
  }
}

/* =========================
   BUILD ALIGNED CHANGES
========================= */

function buildAlignedChanges(lineChanges) {
  const changes = [];

  let leftLineNumber = 1;
  let rightLineNumber = 1;

  let i = 0;

  while (i < lineChanges.length) {
    const change = lineChanges[i];

    /* =========================
       UNCHANGED BLOCK
    ========================= */

    if (!change.added && !change.removed) {
      const lines = splitLines(change.value);

      for (const line of lines) {
        changes.push(createUnchangedRow(line, leftLineNumber, rightLineNumber));

        leftLineNumber++;
        rightLineNumber++;
      }

      i++;

      continue;
    }

    /* =========================
       REMOVED BLOCK
    ========================= */

    if (change.removed) {
      const removedLines = splitLines(change.value);

      let addedLines = [];

      /*
        Check whether an added block
        immediately follows this removed block.
      */

      if (i + 1 < lineChanges.length && lineChanges[i + 1].added) {
        addedLines = splitLines(lineChanges[i + 1].value);
      }

      /* =========================
         PAIR THE BLOCKS
      ========================= */

      pairChangedBlocks(
        removedLines,
        addedLines,
        changes,
        leftLineNumber,
        rightLineNumber,
      );

      /*
        Both sides advance according
        to their actual number of lines.
      */

      leftLineNumber += removedLines.length;
      rightLineNumber += addedLines.length;

      /*
        If an added block was consumed,
        skip it.
      */

      if (addedLines.length > 0) {
        i += 2;
      } else {
        i++;
      }

      continue;
    }

    /* =========================
       ADDED BLOCK
    ========================= */

    if (change.added) {
      const addedLines = splitLines(change.value);

      /*
        This normally happens when the
        added block wasn't preceded by
        a removed block.
      */

      for (const line of addedLines) {
        changes.push(createAddedRow(line, rightLineNumber));

        rightLineNumber++;
      }

      i++;

      continue;
    }

    i++;
  }

  return changes;
}

/* =========================
   COMPARE FOLDERS
========================= */

function compareFolders(leftFolder, rightFolder) {
  const leftMap = createFileMap(leftFolder.files);

  const rightMap = createFileMap(rightFolder.files);

  /* =========================
     GET ALL FILE PATHS
  ========================= */

  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()]);

  const files = [];

  /* =========================
     COMPARE EACH FILE
  ========================= */

  for (const path of [...allPaths].sort()) {
    const leftFile = leftMap.get(path);

    const rightFile = rightMap.get(path);

    /* =========================
       FILE ADDED
    ========================= */

    if (!leftFile && rightFile) {
      const addedRows = splitLines(rightFile.content).map((line, index) =>
        createAddedRow(line, index + 1),
      );

      files.push({
        path,

        status: "added",

        left: null,

        right: rightFile,

        changes: addedRows,

        stats: {
          added: countLines(rightFile.content),
          removed: 0,
          changed: 0,
        },
      });

      continue;
    }

    /* =========================
       FILE REMOVED
    ========================= */

    if (leftFile && !rightFile) {
      const removedRows = splitLines(leftFile.content).map((line, index) =>
        createRemovedRow(line, index + 1),
      );

      files.push({
        path,

        status: "removed",

        left: leftFile,

        right: null,

        changes: removedRows,

        stats: {
          added: 0,
          removed: countLines(leftFile.content),
          changed: 0,
        },
      });

      continue;
    }

    /* =========================
       FILE UNCHANGED
    ========================= */

    if (leftFile.content === rightFile.content) {
      const unchangedRows = splitLines(leftFile.content).map((line, index) =>
        createUnchangedRow(line, index + 1, index + 1),
      );

      files.push({
        path,

        status: "unchanged",

        left: leftFile,

        right: rightFile,

        changes: unchangedRows,

        stats: {
          added: 0,
          removed: 0,
          changed: 0,
        },
      });

      continue;
    }

    /* =========================
       FILE CHANGED
    ========================= */

    const lineChanges = diffLines(leftFile.content, rightFile.content);

    /* =========================
       BUILD ALIGNED ROWS
    ========================= */

    const changes = buildAlignedChanges(lineChanges);

    /* =========================
       SAVE FILE
    ========================= */

    /* =========================
       PER-FILE LINE STATS

       Tally how many rows in this
       file's aligned changes are
       added / removed / changed,
       for the summary view.
    ========================= */

    const stats = changes.reduce(
      (totals, row) => {
        if (row.type === "added") {
          totals.added++;
        } else if (row.type === "removed") {
          totals.removed++;
        } else if (row.type === "changed") {
          totals.changed++;
        }

        return totals;
      },
      { added: 0, removed: 0, changed: 0 },
    );

    files.push({
      path,

      status: "changed",

      left: leftFile,

      right: rightFile,

      changes,

      stats,
    });
  }

  /* =========================
     SUMMARY
  ========================= */

  const summary = {
    total: files.length,

    added: files.filter((file) => file.status === "added").length,

    removed: files.filter((file) => file.status === "removed").length,

    changed: files.filter((file) => file.status === "changed").length,

    unchanged: files.filter((file) => file.status === "unchanged").length,

    linesAdded: files.reduce((sum, file) => sum + (file.stats?.added || 0), 0),

    linesRemoved: files.reduce(
      (sum, file) => sum + (file.stats?.removed || 0),
      0,
    ),

    linesChanged: files.reduce(
      (sum, file) => sum + (file.stats?.changed || 0),
      0,
    ),
  };

  /* =========================
     RETURN RESULT
  ========================= */

  return {
    leftFolder: {
      name: leftFolder.name,

      fileCount: leftFolder.files.length,
    },

    rightFolder: {
      name: rightFolder.name,

      fileCount: rightFolder.files.length,
    },

    files,

    summary,
  };
}

/* =========================
   EXPORT
========================= */

export { compareFolders };
