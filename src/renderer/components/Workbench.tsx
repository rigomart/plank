import { useState } from "react";
import { ChatPanel } from "./chat";
import { ChatHeader } from "./chat/chat-header";
import { ChatSidebar, type Selection } from "./sidebar";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

export function Workbench(): React.JSX.Element {
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <SidebarProvider open>
      <ChatSidebar
        onSelectionChange={setSelection}
        activeChatId={selection?.chatId ?? null}
      />
      <SidebarInset>
        <ChatHeader
          chatId={selection?.chatId || undefined}
          workspace={selection?.workspace}
        />
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
