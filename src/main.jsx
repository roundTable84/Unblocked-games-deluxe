import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

document.documentElement.dataset.appMounted = 'true';

createRoot(document.getElementById('root')).render(<App />);
