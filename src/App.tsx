import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel';
import { MonitorPanel } from '@/components/monitor/MonitorPanel';
import { useSession } from '@/hooks/useSession';
import { useMemory } from '@/hooks/useMemory';
import { useCapabilities } from '@/hooks/useCapabilities';

type Panel = 'chat' | 'workspace' | 'monitor';

function App() {
  const {
    sessions, activeSession, loading,
    createSession, updateSessionTitle, deleteSession, selectSession,
  } = useSession();

  const { memories } = useMemory();
  const { capabilities } = useCapabilities();

  const [activePanel, setActivePanel] = useState<Panel>('chat');
  const [mobilePanel, setMobilePanel] = useState<Panel>('chat');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-create a session on first load if none exist
  useEffect(() => {
    if (!loading && sessions.length === 0) {
      createSession('Welcome Session');
    }
  }, [loading, sessions.length, createSession]);

  // Auto-select first session if none selected
  useEffect(() => {
    if (!activeSession && sessions.length > 0) {
      selectSession(sessions[0]);
    }
  }, [activeSession, sessions, selectSession]);

  const handleCreateSession = useCallback(async () => {
    const session = await createSession(`Session ${sessions.length + 1}`);
    if (session) {
      setActivePanel('chat');
      if (isMobile) setMobilePanel('chat');
    }
  }, [createSession, sessions.length, isMobile]);

  const activeCaps = capabilities.filter(c => c.status === 'active').length;

  const renderPanel = (panel: Panel) => {
    switch (panel) {
      case 'chat':
        return (
          <ChatPanel
            session={activeSession}
            onSessionTitleUpdate={updateSessionTitle}
          />
        );
      case 'workspace':
        return <WorkspacePanel />;
      case 'monitor':
        return <MonitorPanel />;
    }
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-neutral-950 text-neutral-200 overflow-hidden">
        <Header
          activeCapabilities={activeCaps}
          memoriesCount={memories.length}
          activeSessionTitle={activeSession?.title ?? null}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSession?.id ?? null}
            onSelectSession={(s) => { selectSession(s); setMobilePanel('chat'); }}
            onCreateSession={handleCreateSession}
            onDeleteSession={deleteSession}
            activePanel={mobilePanel}
            onPanelChange={setMobilePanel}
          />
          <div className="flex-1 overflow-hidden">
            {renderPanel(mobilePanel)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-200 overflow-hidden">
      <Header
        activeCapabilities={activeCaps}
        memoriesCount={memories.length}
        activeSessionTitle={activeSession?.title ?? null}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - sessions */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          onSelectSession={selectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={deleteSession}
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />

        {/* Main 3-panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat & Execution Console - takes 40% */}
          <div className="w-2/5 border-r border-neutral-800 overflow-hidden relative">
            {renderPanel('chat')}
          </div>

          {/* Project Workspace - takes 35% */}
          <div className="w-[35%] border-r border-neutral-800 overflow-hidden relative">
            {renderPanel('workspace')}
          </div>

          {/* Kael State & Capability Monitor - takes 25% */}
          <div className="w-1/4 overflow-hidden relative">
            {renderPanel('monitor')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
