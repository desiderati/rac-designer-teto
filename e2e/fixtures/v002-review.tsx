import {createRoot} from 'react-dom/client';
import '@/index.css';
import '@/rac-ui.css';
import {Fixture} from './v002-review-components.tsx';

createRoot(document.getElementById('root')!).render(<Fixture/>);
