import { useState } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';

type View = { type: 'list' } | { type: 'detail'; id: string };

export default function App() {
  const [currentView, setCurrentView] = useState<View>({ type: 'list' });

  return (
    <div>
      {currentView.type === 'list' ? (
        <ProjectList
          onSelectProject={(id) => setCurrentView({ type: 'detail', id })}
        />
      ) : (
        <ProjectDetail
          projectId={currentView.id}
          onBack={() => setCurrentView({ type: 'list' })}
        />
      )}
    </div>
  );
}
