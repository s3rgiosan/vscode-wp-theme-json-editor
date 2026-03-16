import { useEditorStore } from "./store/editorStore";
import { useMessageListener } from "./hooks/useMessageListener";
import { CssVariablesProvider } from "./hooks/useCssVariables";
import { Sidebar } from "./components/Sidebar";
import { SectionPanel } from "./components/SectionPanel";
import { SaveBar } from "./components/SaveBar";
import { Toolbar } from "./components/Toolbar";
import { ConflictBanner } from "./components/ConflictBanner";

/**
 * Root component for the theme.json editor webview.
 * Wires up the message listener, renders the layout shell,
 * and conditionally shows the save bar and conflict banner.
 */
export function App() {
  useMessageListener();

  const schema = useEditorStore((s) => s.schema);
  const activeSection = useEditorStore((s) => s.activeSection);
  const isDirty = useEditorStore((s) => s.isDirty);
  const conflictData = useEditorStore((s) => s.conflictData);
  const hasSchema = Object.keys(schema).length > 0;

  return (
    <CssVariablesProvider>
      <div className="flex flex-col h-screen font-vscode text-vscode-sm text-vscode-fg bg-vscode-bg">
        <Toolbar />
        {conflictData && <ConflictBanner conflictData={conflictData} />}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4">
            {hasSchema ? (
              <SectionPanel section={activeSection} />
            ) : (
              <div className="flex items-center justify-center h-full text-vscode-description-fg">
                Loading schema...
              </div>
            )}
          </main>
        </div>
        {isDirty && <SaveBar />}
      </div>
    </CssVariablesProvider>
  );
}
