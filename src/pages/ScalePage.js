import { useEffect, useState, useRef } from 'react';

function ScalePage() {
  const [template, setTemplate] = useState(null);
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [currentStart, setCurrentStart] = useState(null);
  const canvasRef = useRef(null);

  const snapThreshold = 10;

  useEffect(() => {
    const stored = localStorage.getItem('selectedTemplate');
    if (stored) {
      setTemplate(JSON.parse(stored));
    }
  }, []);

  const getSnappedPoint = (x, y) => {
    for (const [px, py] of points) {
      const dx = x - px;
      const dy = y - py;
      if (Math.sqrt(dx * dx + dy * dy) < snapThreshold) {
        return [px, py];
      }
    }
    return null;
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snapped = getSnappedPoint(x, y);

    if (!currentStart) {
      // first click: try to snap to existing point or create new
      if (snapped) {
        setCurrentStart(snapped);
      } else {
        setPoints([...points, [x, y]]);
        setCurrentStart([x, y]);
      }
    } else {
      // second click: try to snap, then draw line
      const end = snapped || [x, y];

      // Add points if new
      if (!points.some(([px, py]) => px === end[0] && py === end[1])) {
        setPoints([...points, end]);
      }

      setLines([...lines, [currentStart, end]]);
      setCurrentStart(null);
    }
  };

  const drawCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw lines
    for (const [[x1, y1], [x2, y2]] of lines) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw dots
    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    });

    // Highlight current start point
    if (currentStart) {
      ctx.beginPath();
      ctx.arc(currentStart[0], currentStart[1], 6, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawCanvas(ctx);
  }, [points, lines, currentStart]);

  if (!template) return <p>No template selected.</p>;

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <h2>Draw Walls: {template.name}</h2>
      <p>Click to place walls. You can reuse corners by snapping to them.</p>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={template.image}
          alt={template.name}
          style={{ display: 'block', maxWidth: '100%' }}
        />

        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
          }}
        />

        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: 'crosshair',
            zIndex: 5,
          }}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}

export default ScalePage;
