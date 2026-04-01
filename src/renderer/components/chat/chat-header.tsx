import { useQuery } from "@tanstack/react-query";
import { GitCommitHorizontal, Terminal } from "lucide-react";
import { trpc } from "../../trpc";
import type { Workspace } from "../../types";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface ChatHeaderProps {
  chatId?: string;
  workspace?: Workspace;
}

export function ChatHeader({ chatId, workspace }: ChatHeaderProps): React.JSX.Element {
  const { data: chatName } = useQuery({
    queryKey: ["chat-name", chatId],
    queryFn: async () => {
      if (!chatId) return "";
      const chat = await trpc.claude.getChat.query({ chatId });
      return chat?.name ?? "";
    },
    enabled: !!chatId,
  });

  const workspaceName = workspace
    ? workspace.repo?.fullName ||
      workspace.folderPath.split("/").pop() ||
      workspace.folderPath
    : undefined;

  return (
    <header
      className="flex h-11 shrink-0 items-center gap-2 border-b px-4"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {chatId && (
        <div
          className="flex min-w-0 flex-1 items-center justify-between gap-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{chatName}</span>
            {workspaceName && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="truncate text-xs text-muted-foreground">
                  {workspaceName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={() => {}} title="Commit">
              <GitCommitHorizontal className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {}}
              title="Open terminal"
            >
              <Terminal className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
