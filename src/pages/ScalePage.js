import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function ScalePage() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [toolMode, setToolMode] = useState('walls');
  const [currentStart, setCurrentStart] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  const snapThreshold = 10;

  useEffect(() => {
    const stored = localStorage.getItem('selectedTemplate');
    if (stored) setTemplate(JSON.parse(stored));
  }, []);
  
  const getClosestPointOnLine = (x, y) => {
    let minDist = Infinity;
    let snapPoint = null;
    let angle = 0;

    lines.forEach(([[x1, y1], [x2, y2]]) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = Math.hypot(x - px, y - py);

      if (dist < minDist) {
        minDist = dist;
        snapPoint = { x: px, y: py };
        angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    });

    return minDist < 25 ? { ...snapPoint, angle } : null;
  };

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

    if (toolMode === 'walls') {
      const snap = getSnappedPoint(x, y);
      if (!currentStart) {
        setCurrentStart(snap || [x, y]);
        if (!snap) setPoints([...points, [x, y]]);
      } else {
        const end = snap || [x, y];
        if (!points.some(([px, py]) => px === end[0] && py === end[1])) {
          setPoints([...points, end]);
        }
        setLines([...lines, [currentStart, end]]);
        setCurrentStart(null);
      }
    } else if (toolMode === 'doors' || toolMode === 'windows') {
      const snap = getClosestPointOnLine(x, y);
      if (snap) {
        const newItem = { x: snap.x, y: snap.y, rotation: snap.angle };
        if (toolMode === 'doors') setDoors([...doors, newItem]);
        if (toolMode === 'windows') setWindows([...windows, newItem]);
      }
    } else if (toolMode === null) {
      // Selection mode
      const allItems = [
        ...doors.map((d, i) => ({ ...d, type: 'door', index: i })),
        ...windows.map((w, i) => ({ ...w, type: 'window', index: i }))
      ];
      const found = allItems.find(
        (obj) => Math.abs(obj.x - x) < 15 && Math.abs(obj.y - y) < 15
      );
      setSelectedObject(found || null);
    }
  };
    const handleUndo = () => {
    if (toolMode === 'walls' && lines.length > 0) {
      const newLines = [...lines];
      const removed = newLines.pop();
      setLines(newLines);

      const [, end] = removed;
      const used = newLines.some(
        ([s, e]) =>
          (s[0] === end[0] && s[1] === end[1]) ||
          (e[0] === end[0] && e[1] === end[1])
      );
      if (!used) setPoints(points.filter(([px, py]) => px !== end[0] || py !== end[1]));
    } else if (toolMode === 'doors') {
      const updated = [...doors];
      updated.pop();
      setDoors(updated);
    } else if (toolMode === 'windows') {
      const updated = [...windows];
      updated.pop();
      setWindows(updated);
    }
  };

  const drawCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw walls
    lines.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Dots
    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    });

    // Highlight start
    if (currentStart) {
      ctx.beginPath();
      ctx.arc(currentStart[0], currentStart[1], 6, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw doors
    doors.forEach(({ x, y, rotation }, i) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 8);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fillStyle = 'purple';
      ctx.fill();
      ctx.restore();
    });

    // Draw windows
    windows.forEach(({ x, y, rotation }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(-10, 15);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.moveTo(10, -15);
      ctx.lineTo(10, 15);
      ctx.stroke();

      ctx.restore();
    });

    // Draw selection box
    if (selectedObject) {
      ctx.beginPath();
      ctx.arc(selectedObject.x, selectedObject.y, 16, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleContinueToEditor = () => {
    const layoutData = {
        template,
        walls: lines,
        doors,
        windows
    };

    localStorage.setItem('smartHomeLayout', JSON.stringify(layoutData));
    navigate('/editor');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawCanvas(ctx);
  }, [points, lines, doors, windows, currentStart, selectedObject]);

  const handleRotate = () => {
    if (!selectedObject) return;
    const rotate = (list, setList) => {
      const updated = [...list];
      updated[selectedObject.index].rotation += 45;
      setList(updated);
    };
    if (selectedObject.type === 'door') rotate(doors, setDoors);
    if (selectedObject.type === 'window') rotate(windows, setWindows);
  };

  const handleDelete = () => {
    if (!selectedObject) return;
    if (selectedObject.type === 'door') {
      const updated = [...doors];
      updated.splice(selectedObject.index, 1);
      setDoors(updated);
    }
    if (selectedObject.type === 'window') {
      const updated = [...windows];
      updated.splice(selectedObject.index, 1);
      setWindows(updated);
    }
    setSelectedObject(null);
  };

  if (!template) return <p>Loading floorplan...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Scale Floorplan: {template?.name}</h2>
            
            <div style={{ marginBottom: '10px' }}>
                <button onClick={() => setToolMode('walls')}>Walls</button>
                <button onClick={() => setToolMode('doors')}>Doors</button>
                <button onClick={() => setToolMode('windows')}>Windows</button>
                <button onClick={() => setToolMode(null)}>Selection</button>
                <button onClick={handleUndo}>Undo</button>
                <button onClick={handleContinueToEditor}>Continue to Editor</button>
        </div>

      <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={template.image}
          alt={template.name}
          style={{ display: 'block', maxWidth: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
          }}
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleClick}
          style={{ position: 'absolute', top: 0, left: 0, cursor: 'crosshair', zIndex: 5 }}
        />

        {selectedObject && (
          <div
            style={{
              position: 'absolute',
              top: selectedObject.y - 20,
              left: selectedObject.x + 20,
              background: '#fff',
              border: '1px solid #ccc',
              padding: '4px',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
              borderRadius: '6px',
            }}
          >
            <button onClick={handleRotate}>🔄</button>
            <button onClick={handleDelete}>❌</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScalePage;
