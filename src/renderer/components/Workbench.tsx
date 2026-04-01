import { useState } from "react";
import { ChatPanel } from "./chat";
import { ChatSidebar, type Selection } from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function Workbench(): React.JSX.Element {
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <SidebarProvider>
      <div
        className="fixed inset-x-0 top-0 z-50 flex h-11 items-center pl-20"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <SidebarTrigger />
        </div>
      </div>
      <ChatSidebar
        onSelectionChange={setSelection}
        activeChatId={selection?.chatId ?? null}
      />
      <SidebarInset>
        <div className="h-11 shrink-0" />
        {selection?.chatId ? (
          <ChatPanel
            key={selection.chatId}
            workspace={selection.workspace}
            chatId={selection.chatId}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              Select a chat or start a new one
            </span>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
