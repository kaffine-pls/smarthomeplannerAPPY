import { useEffect, useRef, useState } from 'react';

function ExportPage() {
  const canvasRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const savedLayout = localStorage.getItem('smartHomeLayout');
    const savedProducts = localStorage.getItem('editorItems');

    if (savedLayout) setLayout(JSON.parse(savedLayout));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
  }, []);

  const countProducts = () => {
    const counts = { camera1: 0, camera2: 0, camera3: 0, sensor: 0 };
    for (const item of products) {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    }
    return counts;
  };

  const drawExport = (ctx) => {
    if (!layout) return;
    const img = new Image();
    img.src = layout.template.image;
    img.onload = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0, 800, 600);

      // Walls
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      layout.walls.forEach(([[x1, y1], [x2, y2]]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Doors
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

      // Windows
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

      // Products
      products.forEach((item) => {
        ctx.save();
        ctx.translate(item.x, item.y);

        if (item.type.startsWith('camera')) {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
        } else if (item.type === 'sensor') {
          ctx.beginPath();
          ctx.moveTo(0, -6);
          for (let i = 1; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const x = 6 * Math.sin(angle);
            const y = -6 * Math.cos(angle);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = 'yellow';
          ctx.fill();
        }

        ctx.restore();
      });
    };
  };

  useEffect(() => {
    if (!layout || !products) return;
    const ctx = canvasRef.current.getContext('2d');
    drawExport(ctx);
  }, [layout, products]);

  const productCounts = countProducts();

  return (
    <div style={{ display: 'flex', padding: '20px' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc' }}
      />
      <div style={{ marginLeft: '40px', fontSize: '18px' }}>
        <h3>Product Overview:</h3>
        <ul>
          <li>Camera 1: {productCounts.camera1}</li>
          <li>Camera 2: {productCounts.camera2}</li>
          <li>Camera 3: {productCounts.camera3}</li>
          <li>Snap Sensor: {productCounts.sensor}</li>
        </ul>
      </div>
    </div>
  );
}

export default ExportPage;

