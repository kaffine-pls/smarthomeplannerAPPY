import { useEffect, useState, useRef } from 'react';

function ScalePage() {
  const [template, setTemplate] = useState(null);
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [currentStart, setCurrentStart] = useState(null);
  const [toolMode, setToolMode] = useState('walls');
  const [selectedObject, setSelectedObject] = useState(null);
  const canvasRef = useRef(null);

  const snapThreshold = 10;

  useEffect(() => {
    const stored = localStorage.getItem('selectedTemplate');
    if (stored) {
      setTemplate(JSON.parse(stored));
    }
  }, []);

  // Snaps to existing point
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

  // General click handler
  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'walls') {
      const snapped = getSnappedPoint(x, y);
      if (!currentStart) {
        if (snapped) {
          setCurrentStart(snapped);
        } else {
          setPoints([...points, [x, y]]);
          setCurrentStart([x, y]);
        }
      } else {
        const end = snapped || [x, y];
        if (!points.some(([px, py]) => px === end[0] && py === end[1])) {
          setPoints([...points, end]);
        }
        setLines([...lines, [currentStart, end]]);
        setCurrentStart(null);
      }
    } else if (toolMode === 'doors') {
      setDoors([...doors, { x, y, rotation: 0 }]);
    } else if (toolMode === 'windows') {
      setWindows([...windows, { x, y, rotation: 0 }]);
    } else if (toolMode === null) {
      // Selection mode
      const found = [...doors.map((d, i) => ({ ...d, type: 'door', index: i })), ...windows.map((w, i) => ({ ...w, type: 'window', index: i }))].find(
        (obj) =>
          Math.abs(obj.x - x) < 15 && Math.abs(obj.y - y) < 15
      );
      setSelectedObject(found || null);
    }
  };

  const handleMouseDown = (e) => {
    if (toolMode !== null || !selectedObject) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const moveListener = (moveEvent) => {
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;
      const dx = currentX - startX;
      const dy = currentY - startY;

      const updatePosition = (objList, setList) => {
        const newList = [...objList];
        const obj = newList[selectedObject.index];
        obj.x += dx;
        obj.y += dy;
        setList(newList);
      };

      if (selectedObject.type === 'door') {
        updatePosition(doors, setDoors);
      } else if (selectedObject.type === 'window') {
        updatePosition(windows, setWindows);
      }

      setSelectedObject(null);
      window.removeEventListener('mousemove', moveListener);
    };

    window.addEventListener('mousemove', moveListener);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!selectedObject) return;

    if (selectedObject.type === 'door') {
      const updated = [...doors];
      updated.splice(selectedObject.index, 1);
      setDoors(updated);
    } else if (selectedObject.type === 'window') {
      const updated = [...windows];
      updated.splice(selectedObject.index, 1);
      setWindows(updated);
    }

    setSelectedObject(null);
  };

  const handleKeyDown = (e) => {
    if (e.key.toLowerCase() === 'r' && selectedObject) {
      const rotate = (list, setList) => {
        const updated = [...list];
        updated[selectedObject.index].rotation += 45;
        setList(updated);
      };

      if (selectedObject.type === 'door') {
        rotate(doors, setDoors);
      } else if (selectedObject.type === 'window') {
        rotate(windows, setWindows);
      }
    }
  };

  const handleUndo = () => {
    if (toolMode === 'walls' && lines.length > 0) {
      const newLines = [...lines];
      const removedLine = newLines.pop();
      setLines(newLines);

      const [, end] = removedLine;
      const stillUsed = newLines.some(
        ([start, finish]) =>
          (start[0] === end[0] && start[1] === end[1]) ||
          (finish[0] === end[0] && finish[1] === end[1])
      );

      if (!stillUsed) {
        setPoints((prev) =>
          prev.filter(([px, py]) => px !== end[0] || py !== end[1])
        );
      }
    } else if (toolMode === 'doors' && doors.length > 0) {
      const updated = [...doors];
      updated.pop();
      setDoors(updated);
    } else if (toolMode === 'windows' && windows.length > 0) {
      const updated = [...windows];
      updated.pop();
      setWindows(updated);
    }
  };

  const drawTriangle = (ctx, x, y, size, rotation) => {
    const angle = (Math.PI / 180) * rotation;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, size);
    ctx.lineTo(-size, size);
    ctx.closePath();
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.restore();
  };

  const drawHShape = (ctx, x, y, rotation) => {
    const angle = (Math.PI / 180) * rotation;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
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
  };

  const drawCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    lines.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    });

    if (currentStart) {
      ctx.beginPath();
      ctx.arc(currentStart[0], currentStart[1], 6, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    doors.forEach(({ x, y, rotation }) => drawTriangle(ctx, x, y, 10, rotation));
    windows.forEach(({ x, y, rotation }) => drawHShape(ctx, x, y, rotation));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawCanvas(ctx);
  }, [points, lines, doors, windows, currentStart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  if (!template) return <p>No template selected.</p>;

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <h2>Scale Floorplan: {template.name}</h2>

      {/* Toolbar */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setToolMode('walls')}>Walls</button>
        <button onClick={() => setToolMode('doors')}>Doors</button>
        <button onClick={() => setToolMode('windows')}>Windows</button>
        <button onClick={() => setToolMode(null)}>Selection</button>
        <button onClick={handleUndo}>Undo</button>
      </div>

      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <img
          src={template.image}
          alt={template.name}
          style={{ display: 'block', maxWidth: '100%' }}
        />

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
