import { useEffect, useRef, useState } from 'react';
import magnetIcon from '../assets/magnet-icon.png';

function EditorPage() {
  const [layout, setLayout] = useState(null);
  const [toolMode, setToolMode] = useState('camera1');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const canvasRef = useRef(null);

  const fovRadii = {
    camera1: 20,
    camera2: 30,
    camera3: 40
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
          ctx.beginPath();
          ctx.arc(0, 0, item.radius, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)';
          ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
        } else if (item.type === 'sensor') {
          const img = new Image();
          img.src = magnetIcon;
          ctx.drawImage(img, -8, -8, 16, 16); // Smaller size
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
