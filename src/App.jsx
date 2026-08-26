import { useState } from "react";

import {
  SunIcon,
  MoonIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

import FolderSelector from "./components/FolderSelector";
import FileTree from "./components/FileTree";
import DiffViewer from "./components/DiffViewer";
import SummaryPanel from "./components/SummaryPanel";
import GlobalSearch from "./components/GlobalSearch";
import BuyMeACoffeeButton from "./components/BuyMeACoffeeButton";

import { compareFolders } from "./utils/compareFolders";
import { rescanFolder } from "./utils/rescanFolder";
;



function App() {
  const [leftFolder, setLeftFolder] = useState(null);
  const [rightFolder, setRightFolder] = useState(null);
  const [lightMode, setLightMode] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCompare() {
    if (!leftFolder || !rightFolder) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const freshLeft = await rescanFolder(leftFolder, "Left");
      const freshRight = await rescanFolder(rightFolder, "Right");

      setLeftFolder(freshLeft);
      setRightFolder(freshRight);

      /*
       * Yield to the browser for one tick so
       * the "Comparing..." state actually
       * paints before compareFolders (which
       * is synchronous CPU work) blocks the
       * main thread.
       */
      await new Promise((resolve) => setTimeout(resolve, 0));

      const data = compareFolders(freshLeft, freshRight);

      setComparison(data);

      const firstDifferent = data.files.find(
        (file) => file.status !== "unchanged"
      );

      setSelectedFile(firstDifferent || data.files[0] || null);
      setShowSummary(true);
    } catch (err) {
      console.error(err);

      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`app ${lightMode ? "light-mode" : ""}`}>
      <header className="header">
        <button
          className="theme-button"
          onClick={() => setLightMode(!lightMode)}
          aria-label={
            lightMode ? "Switch to dark mode" : "Switch to light mode"
          }
          title={lightMode ? "Dark Mode" : "Light Mode"}
        >
          {lightMode ? (
            <MoonIcon className="icon" />
          ) : (
            <SunIcon className="icon" />
          )}

          <span>{lightMode ? "Dark Mode" : "Light Mode"}</span>
        </button>

        <section className="search-bar-section">
          <GlobalSearch
            comparison={comparison}
            onNavigate={(file, rowIndex) => {
              setSelectedFile(file);
              setShowSummary(false);
              setScrollTarget({
                path: file.path,
                rowIndex,
              });
            }}
          />
        </section>

        <div className="header-actions">
          <FolderSelector
            side="left"
            folder={leftFolder}
            onFolderSelected={setLeftFolder}
          />

          <FolderSelector
            side="right"
            folder={rightFolder}
            onFolderSelected={setRightFolder}
          />

          <button
            className="compare-button"
            disabled={!leftFolder || !rightFolder || loading}
            onClick={handleCompare}
          >
            {loading ? "Comparing..." : "Compare Folders"}
          </button>

         <BuyMeACoffeeButton />
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="folder-bar">

            <button
            className="summary-button"
            disabled={!comparison}
            onClick={() => setShowSummary(!showSummary)}
          >
            {showSummary ? (
              <>
                <ArrowsRightLeftIcon className="icon" />
                <span>Back to Diff</span>
              </>
            ) : (
              <>
                <ChartBarIcon className="icon" />
                <span>Summary</span>
              </>
            )}
          </button>

  <div className="folder-info left">
    <FolderIcon className="folder-icon" />
    <div>
      <strong>
        {leftFolder?.name || "No left folder"}
      </strong>
      <small>
        {leftFolder
          ? `${leftFolder.files.length} files`
          : "Select a folder"}
      </small>
    </div>
  </div>

  <div className="folder-info right">
    <FolderIcon className="folder-icon" />
    <div>
      <strong>
        {rightFolder?.name || "No right folder"}
      </strong>
      <small>
        {rightFolder
          ? `${rightFolder.files.length} files`
          : "Select a folder"}
      </small>
    </div>
  </div>
</section>

      <main className="workspace">
        <aside className="sidebar">
          <FileTree
            files={comparison?.files || []}
            selectedFile={selectedFile?.path}
            onSelect={(file) => {
              setSelectedFile(file);
              setShowSummary(false);
            }}
          />
        </aside>

        <section className="viewer">
          {showSummary && comparison ? (
            <SummaryPanel comparison={comparison} />
          ) : selectedFile ? (
            <DiffViewer
              file={selectedFile}
              scrollTarget={scrollTarget}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <ArrowsRightLeftIcon />
              </div>

              <h2>Compare two folders</h2>

              <p>
                Select your left and right project folders,
                then click Compare Folders.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;