import {
  useState,
  useEffect,
  useRef
} from "react";

function DiffMinimap({
  rows,
  containerRef
}) {
  const minimapRef = useRef(null);

  const [viewport, setViewport] = useState({
    top: 0,
    height: 100
  });


  /* =========================
     TRACK VISIBLE VIEWPORT

     Keeps the highlighted band in
     sync with actual scroll position,
     so it's clear whether a change
     is above or below what's
     currently on screen.
  ========================= */

  useEffect(() => {

    const container = containerRef.current;

    if (!container) {
      return;
    }

    function updateViewport() {

      const {
        scrollTop,
        scrollHeight,
        clientHeight
      } = container;

      if (scrollHeight <= clientHeight) {
        setViewport({ top: 0, height: 100 });
        return;
      }

      setViewport({
        top:
          (scrollTop / scrollHeight) * 100,

        height:
          (clientHeight / scrollHeight) * 100
      });
    }

    updateViewport();

    container.addEventListener(
      "scroll",
      updateViewport
    );

    const resizeObserver =
      new ResizeObserver(updateViewport);

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener(
        "scroll",
        updateViewport
      );

      resizeObserver.disconnect();
    };

  }, [containerRef, rows]);


  /* =========================
     CLICK TO JUMP
  ========================= */

  function handleClick(event) {

    const container = containerRef.current;
    const minimap = minimapRef.current;

    if (!container || !minimap) {
      return;
    }

    const rect =
      minimap.getBoundingClientRect();

    const clickRatio =
      (event.clientY - rect.top) /
      rect.height;

    const targetScrollTop =
      clickRatio * container.scrollHeight -
      container.clientHeight / 2;

    container.scrollTop = Math.max(
      0,
      targetScrollTop
    );
  }


  const totalRows = rows.length || 1;

  return (
    <div
      className="diff-minimap"
      ref={minimapRef}
      onClick={handleClick}
      title="Click to jump to that part of the file"
    >

      {rows.map((row, index) => {

        if (row.type === "unchanged") {
          return null;
        }

        const topPercent =
          (index / totalRows) * 100;

        return (
          <div
            key={index}
            className={
              `diff-minimap-tick ${row.type}`
            }
            style={{
              top: `${topPercent}%`
            }}
          />
        );
      })}

      <div
        className="diff-minimap-viewport"
        style={{
          top: `${viewport.top}%`,
          height:
            `${Math.max(viewport.height, 2)}%`
        }}
      />

    </div>
  );
}

export default DiffMinimap;