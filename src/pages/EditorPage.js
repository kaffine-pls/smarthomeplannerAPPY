import { useEffect, useRef, useState } from 'react';
import magnetIcon from '../assets/magnet-icon.png';

// delete
function castFOV(ctx, item, walls) {
  const { x, y, radius } = item;
  const steps = 180;
  const angleStep = (2 * Math.PI) / steps;
  const points = [];

  for (let i = 0; i < steps; i++) {
    const angle = i * angleStep;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let closestDist = radius;
    let endX = x + dx * radius;
    let endY = y + dy * radius;

    for (const [[x1, y1], [x2, y2]] of walls) {
      const denom = (x2 - x1) * dy - (y2 - y1) * dx;
      if (denom === 0) continue;

      const t = ((x1 - x) * dy - (y1 - y) * dx) / denom;
      const u = ((x1 - x) * (y2 - y1) - (y1 - y) * (x2 - x1)) / denom;

      if (t >= 0 && t <= 1 && u >= 0) {
        const ix = x1 + t * (x2 - x1);
        const iy = y1 + t * (y2 - y1);
        const dist = Math.hypot(ix - x, iy - y);
        if (dist < closestDist) {
          closestDist = dist;
          endX = ix;
          endY = iy;
        }
      }
    }

    points.push([endX, endY]);
  }

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
  ctx.fill();
}
// delete above

function EditorPage() {
  const [layout, setLayout] = useState(null);
  const [toolMode, setToolMode] = useState('camera1');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const canvasRef = useRef(null);

  const fovRadii = {
    camera1: 10,
    camera2: 15,
    camera3: 20
  };

  useEffect(() => {
    const saved = localStorage.getItem('smartHomeLayout');
    if (saved) {
      setLayout(JSON.parse(saved));
    }
  }, []);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === null) {
      const found = items.findLast(
        (item) => Math.abs(item.x - x) < 15 && Math.abs(item.y - y) < 15
      );
      setSelectedItem(found || null);
      return;
    }

    const newItem = {
      x,
      y,
      type: toolMode,
      radius: fovRadii[toolMode] || 0
    };
    setItems([...items, newItem]);
    setSelectedItem(null);
  };

  const handleUndo = () => {
    if (items.length > 0) {
      const updated = [...items];
      updated.pop();
      setItems(updated);
      setSelectedItem(null);
    }
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    const updated = items.filter((item) => item !== selectedItem);
    setItems(updated);
    setSelectedItem(null);
  };

  const isLineIntersectingWall = (x1, y1, x2, y2, walls) => {
    for (const [[wx1, wy1], [wx2, wy2]] of walls) {
      const det = (x2 - x1) * (wy2 - wy1) - (y2 - y1) * (wx2 - wx1);
      if (det === 0) continue;

      const lambda = ((wy2 - wy1) * (wx2 - x1) + (wx1 - wx2) * (wy2 - y1)) / det;
      const gamma = ((y1 - y2) * (wx2 - x1) + (x2 - x1) * (wy2 - y1)) / det;

      if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
        return true;
      }
    }
    return false;
  };

  const drawLayout = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!layout) return;

    const img = new Image();
    img.src = layout.template.image;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 600);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      layout.walls.forEach(([[x1, y1], [x2, y2]]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      layout.doors.forEach(({ x, y, rotation }) => {
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

      layout.windows.forEach(({ x, y, rotation }) => {
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

      items.forEach((item) => {
        ctx.save();
        ctx.translate(item.x, item.y);

        if (item.type.startsWith('camera')) {
          const steps = 60;
          for (let i = 0; i < 360; i += 360 / steps) {
            const rad = (i * Math.PI) / 180;
            const dx = item.radius * Math.cos(rad);
            const dy = item.radius * Math.sin(rad);
            const endX = item.x + dx;
            const endY = item.y + dy;

            if (isLineIntersectingWall(item.x, item.y, endX, endY, layout.walls)) {
              ctx.setLineDash([]);
              ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
            } else {
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)';
            }

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dx, dy);
            ctx.stroke();
          }

          ctx.setLineDash([]);
          ctx.beginPath();
          // dlete below
          function castFOV(ctx, item, walls) {
            const { x, y, radius } = item;
            const steps = 180; // Higher = smoother circle
            const angleStep = (2 * Math.PI) / steps;
            const points = [];

            for (let i = 0; i < steps; i++) {
                const angle = i * angleStep;
                let dx = Math.cos(angle);
                let dy = Math.sin(angle);
                let closestDist = radius;
                let endX = x + dx * radius;
                let endY = y + dy * radius;

                for (const [[x1, y1], [x2, y2]] of walls) {
                    const denom = (x2 - x1) * dy - (y2 - y1) * dx;
                    if (denom === 0) continue; // parallel

                    const t = ((x1 - x) * dy - (y1 - y) * dx) / denom;
                    const u = ((x1 - x) * (y2 - y1) - (y1 - y) * (x2 - x1)) / denom;

                    if (t >= 0 && t <= 1 && u >= 0) {
                        const ix = x1 + t * (x2 - x1);
                        const iy = y1 + t * (y2 - y1);
                        const dist = Math.hypot(ix - x, iy - y);
                        
                        if (dist < closestDist) {
                        closestDist = dist;
                        endX = ix;
                        endY = iy;
                        }
                    }
                }

                points.push([endX, endY]);
            }

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
            ctx.fill();
            }
          // delete above
          ctx.arc(0, 0, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
        } else if (item.type === 'sensor') {
          const img = new Image();
          img.src = magnetIcon;
          ctx.drawImage(img, -4, -4, 8, 8);
        }

        ctx.restore();
      });

      if (selectedItem) {
        ctx.beginPath();
        ctx.arc(selectedItem.x, selectedItem.y, 16, 0, 2 * Math.PI);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    drawLayout(ctx);
  }, [layout, items, selectedItem]);

  if (!layout) return <p>Loading floorplan...</p>;

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <h2>Editor Mode</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setToolMode('camera1')}>Camera 1</button>
        <button onClick={() => setToolMode('camera2')}>Camera 2</button>
        <button onClick={() => setToolMode('camera3')}>Camera 3</button>
        <button onClick={() => setToolMode('sensor')}>Snap Sensor</button>
        <button onClick={() => setToolMode(null)}>Selection</button>
        <button onClick={handleUndo}>Undo</button>
        <button>Export</button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleClick}
        style={{ border: '1px solid #ccc', cursor: toolMode ? 'crosshair' : 'pointer' }}
      />

      {selectedItem && (
        <div
          style={{
            position: 'absolute',
            top: selectedItem.y - 20,
            left: selectedItem.x + 20,
            background: '#fff',
            border: '1px solid #ccc',
            padding: '4px',
            zIndex: 10,
            display: 'flex',
            gap: '6px',
            borderRadius: '6px',
          }}
        >
          <button onClick={handleDelete}>❌</button>
        </div>
      )}
    </div>
  );
}

export default EditorPage;
