import { useEffect, useState, useRef } from 'react';

function EditorPage() {
  const [layout, setLayout] = useState(null);
  const [toolMode, setToolMode] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [sensors, setSensors] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('smartHomeLayout');
    if (stored) {
      setLayout(JSON.parse(stored));
    }
  }, []);

  const handleCanvasClick = (e) => {
    if (!layout || !toolMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode.startsWith('camera')) {
      setCameras([...cameras, { x, y, type: toolMode }]);
    } else if (toolMode === 'sensor') {
      setSensors([...sensors, { x, y }]);
    }
  };

  const drawEditor = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!layout) return;

    const { template, walls, doors, windows } = layout;

    // Draw walls
    walls.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw doors
    doors.forEach(({ x, y, rotation }) => {
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

    // Draw cameras + FOV
    cameras.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, 100, 0, 2 * Math.PI); // FOV radius
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'cyan';
      ctx.fill();
    });

    // Draw sensors
    sensors.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.rect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = 'green';
      ctx.fill();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    drawEditor(ctx);
  }, [layout, cameras, sensors]);

  if (!layout) return <p>Loading floorplan...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Editor</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setToolMode('camera1')}>Camera 1</button>
        <button onClick={() => setToolMode('camera2')}>Camera 2</button>
        <button onClick={() => setToolMode('camera3')}>Camera 3</button>
        <button onClick={() => setToolMode('sensor')}>Snap Sensor</button>
        <button onClick={() => setToolMode('select')}>Selection</button>
        <button onClick={() => {
          setCameras((prev) => prev.slice(0, -1));
          setSensors((prev) => prev.slice(0, -1));
        }}>Undo</button>
        <button onClick={() => alert('Export logic to be implemented')}>Export</button>
      </div>

      <div style={{ position: 'relative' }}>
        <img
          src={layout.template.image}
          alt="floorplan"
          style={{ display: 'block', maxWidth: '100%' }}
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}

export default EditorPage;