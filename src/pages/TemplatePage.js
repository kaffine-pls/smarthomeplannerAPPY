import { useNavigate } from 'react-router-dom';
import floorplan3 from '../assets/3HDB.jpeg';
import floorplan4 from '../assets/4HDB.jpeg';
import floorplan5 from '../assets/5HDB.jpeg';

const templates = [
  { name: '3-Room HDB', image: floorplan3 },
  { name: '4-Room HDB', image: floorplan4 },
  { name: '5-Room HDB', image: floorplan5 },
];

function TemplatePage() {
  const navigate = useNavigate();

  const handleSelect = (template) => {
    // Save image path to localStorage
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    navigate('/scale');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select a Floorplan Template</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {templates.map((template, index) => (
          <button key={index} onClick={() => handleSelect(template)}>
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplatePage;
