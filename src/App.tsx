import {Toaster} from '@/components/ui/toaster';
import {Toaster as Sonner} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {GuidedTourHost} from '@/components/guided-tour';
import {racEditorGuidedTourRegistry} from '@/components/rac-editor/lib/rac-editor-guided-tour.ts';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster/>
      <Sonner/>
      <BrowserRouter basename={import.meta.env.BASE_URL} future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <Routes>
          <Route path='/' element={<Index/>}/>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </BrowserRouter>
      <GuidedTourHost registry={racEditorGuidedTourRegistry}/>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
