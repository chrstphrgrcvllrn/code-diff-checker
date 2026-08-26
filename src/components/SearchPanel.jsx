// import { useState, useMemo } from "react";

// const MAX_MATCHES_PER_FILE = 5;
// const MAX_TOTAL_RESULTS = 200;

// function SearchPanel({
//   comparison,
//   onNavigate
// }) {
//   const [query, setQuery] =
//     useState("");

//   /*
//     Grouped results:
//     [
//       {
//         file,
//         matches: [{ rowIndex, side, row }]
//         overflow: number
//       }
//     ]
//   */

//   const results = useMemo(() => {

//     const trimmed = query.trim();

//     if (trimmed.length < 2) {
//       return [];
//     }

//     const needle = trimmed.toLowerCase();

//     const grouped = [];

//     let totalCount = 0;

//     for (const file of comparison.files) {

//       if (totalCount >= MAX_TOTAL_RESULTS) {
//         break;
//       }

//       const matches = [];
//       let overflow = 0;

//       for (
//         let index = 0;
//         index < file.changes.length;
//         index++
//       ) {

//         const row = file.changes[index];

//         const leftHit =
//           row.left &&
//           row.left
//             .toLowerCase()
//             .includes(needle);

//         const rightHit =
//           row.right &&
//           row.right
//             .toLowerCase()
//             .includes(needle);

//         if (!leftHit && !rightHit) {
//           continue;
//         }

//         if (
//           matches.length >=
//           MAX_MATCHES_PER_FILE
//         ) {
//           overflow++;
//           continue;
//         }

//         matches.push({
//           rowIndex: index,
//           side: rightHit ? "right" : "left",
//           row
//         });

//         totalCount++;
//       }

//       if (matches.length > 0) {
//         grouped.push({
//           file,
//           matches,
//           overflow
//         });
//       }
//     }

//     return grouped;
//   }, [query, comparison]);

//   return (
//     <div className="search-panel">

//       <div className="search-panel-header">

//         <input
//           type="text"
//           autoFocus
//           placeholder="Search code across all files..."
//           value={query}
//           onChange={(event) =>
//             setQuery(event.target.value)
//           }
//         />

//         {query.trim().length > 0 && (
//           <span className="search-result-count">
//             {results.reduce(
//               (sum, group) =>
//                 sum + group.matches.length,
//               0
//             )} matches
//           </span>
//         )}

//       </div>

//       <div className="search-results">

//         {query.trim().length < 2 ? (

//           <div className="no-files">
//             Type at least 2 characters to search.
//           </div>

//         ) : results.length === 0 ? (

//           <div className="no-files">
//             No matches found.
//           </div>

//         ) : (

//           results.map((group) => (

//             <div
//               key={group.file.path}
//               className="search-file-group"
//             >

//               <div className="search-file-group-header">

//                 <span
//                   className={
//                     `status ${group.file.status}`
//                   }
//                 >
//                   {getStatusLabel(
//                     group.file.status
//                   )}
//                 </span>

//                 <span className="search-file-path">
//                   {group.file.path}
//                 </span>

//               </div>

//               {group.matches.map((match) => (

//                 <button
//                   key={
//                     `${match.rowIndex}-${match.side}`
//                   }
//                   className="search-match-row"
//                   onClick={() =>
//                     onNavigate(
//                       group.file,
//                       match.rowIndex
//                     )
//                   }
//                 >

//                   <span className="search-match-line">
//                     {match.side === "left"
//                       ? match.row.leftLineNumber
//                       : match.row.rightLineNumber}
//                   </span>

//                   <span className="search-match-snippet">
//                     {highlightMatch(
//                       match.side === "left"
//                         ? match.row.left
//                         : match.row.right,
//                       query.trim()
//                     )}
//                   </span>

//                 </button>

//               ))}

//               {group.overflow > 0 && (
//                 <div className="search-match-overflow">
//                   +{group.overflow} more match
//                   {group.overflow === 1 ? "" : "es"}
//                   {" "}in this file
//                 </div>
//               )}

//             </div>

//           ))

//         )}

//       </div>

//     </div>
//   );
// }


// /* =========================
//    HIGHLIGHT MATCHED TEXT
// ========================= */

// function highlightMatch(text, query) {

//   if (!text) {
//     return text;
//   }

//   const lower = text.toLowerCase();
//   const needle = query.toLowerCase();

//   const parts = [];

//   let cursor = 0;
//   let matchIndex = lower.indexOf(
//     needle,
//     cursor
//   );

//   if (matchIndex === -1) {
//     return text;
//   }

//   while (matchIndex !== -1) {

//     if (matchIndex > cursor) {
//       parts.push(
//         <span key={cursor}>
//           {text.slice(cursor, matchIndex)}
//         </span>
//       );
//     }

//     parts.push(
//       <mark key={matchIndex}>
//         {text.slice(
//           matchIndex,
//           matchIndex + needle.length
//         )}
//       </mark>
//     );

//     cursor = matchIndex + needle.length;

//     matchIndex = lower.indexOf(
//       needle,
//       cursor
//     );
//   }

//   if (cursor < text.length) {
//     parts.push(
//       <span key={`tail-${cursor}`}>
//         {text.slice(cursor)}
//       </span>
//     );
//   }

//   return parts;
// }


// function getStatusLabel(status) {
//   switch (status) {
//     case "added":
//       return "+";

//     case "removed":
//       return "-";

//     case "changed":
//       return "~";

//     case "unchanged":
//       return "=";

//     default:
//       return "?";
//   }
// }

// export default SearchPanel;