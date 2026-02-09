import { useState, useEffect, useCallback } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';

type View = { type: 'list' } | { type: 'detail'; id: string };

function viewFromPath(): View {
  const match = window.location.pathname.match(/^\/project\/(.+)$/);
  return match ? { type: 'detail', id: match[1] } : { type: 'list' };
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(viewFromPath);

  useEffect(() => {
    const onPopState = () => setCurrentView(viewFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = useCallback((view: View) => {
    const path = view.type === 'detail' ? `/project/${view.id}` : '/';
    window.history.pushState(null, '', path);
    setCurrentView(view);
  }, []);

  return (
    <div>
      {currentView.type === 'list' ? (
        <ProjectList
          onSelectProject={(id) => navigateTo({ type: 'detail', id })}
        />
      ) : (
        <ProjectDetail
          projectId={currentView.id}
          onBack={() => navigateTo({ type: 'list' })}
        />
      )}
    </div>
  );
}
