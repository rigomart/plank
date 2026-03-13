import { CircleDot, Clock, Filter, Search } from 'lucide-react'
import { useState } from 'react'
import type { GitHubIssue } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Skeleton } from './ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface IssueSidebarProps {
  issues: GitHubIssue[]
  issuesLoading: boolean
  hasRepo: boolean
  selectedId: number | null
  onSelectIssue: (issue: GitHubIssue) => void
}

export function IssueSidebar({
  issues,
  issuesLoading,
  hasRepo,
  selectedId,
  onSelectIssue
}: IssueSidebarProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(i.number).includes(searchQuery)
      )
    : issues

  const openCount = issues.length
  const closedCount = 0

  return (
    <aside className="flex h-full w-[270px] min-w-[270px] flex-col border-r border-border bg-card">
      <Tabs defaultValue="issues" className="flex flex-1 flex-col gap-0">
        <TabsList variant="line" className="w-full justify-start border-b border-border px-2">
          <TabsTrigger value="issues" className="gap-1.5 text-xs">
            <CircleDot className="size-3.5" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs">
            <Clock className="size-3.5" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon-xs">
              <Filter className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 px-3 pb-2">
            <Badge variant="secondary" className="h-6 gap-1 rounded-md px-2 text-[11px]">
              All ({issues.length})
            </Badge>
            <Badge
              variant="ghost"
              className="h-6 gap-1 rounded-md px-2 text-[11px] text-muted-foreground"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              {openCount}
            </Badge>
            <Badge
              variant="ghost"
              className="h-6 gap-1 rounded-md px-2 text-[11px] text-muted-foreground"
            >
              <span className="size-2 rounded-full bg-muted-foreground" />
              {closedCount}
            </Badge>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {issuesLoading ? (
              <div className="space-y-1 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !hasRepo ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <CircleDot className="size-4 text-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">No GitHub remote detected</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <CircleDot className="size-4 text-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">
                  {searchQuery ? 'No matching issues' : 'No open issues'}
                </span>
              </div>
            ) : (
              <div className="px-1 py-0.5">
                {filtered.map((issue) => {
                  const isActive = selectedId === issue.id
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      className={`flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-1.5 text-left text-inherit transition-colors hover:bg-accent ${
                        isActive ? 'bg-accent' : ''
                      }`}
                      onClick={() => onSelectIssue(issue)}
                    >
                      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        #{issue.number}
                      </span>
                      <span className="truncate text-xs text-card-foreground">{issue.title}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sessions" className="flex min-h-0 flex-1">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <Clock className="size-4 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">Sessions coming soon</span>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
