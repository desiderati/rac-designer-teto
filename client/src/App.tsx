import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GuidedTourHost } from '@/components/guided-tour';
import { racEditorGuidedTourRegistry } from '@/components/rac-editor/lib/rac-editor-guided-tour.ts';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Index from './pages/Index.tsx';
import NotFound from './pages/NotFound.tsx';

const App = () => (
  <TooltipProvider>
    <Toaster/>
    <Sonner/>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Index/>}/>
        <Route path='*' element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
    <GuidedTourHost registry={racEditorGuidedTourRegistry}/>
  </TooltipProvider>
);

export default App;
