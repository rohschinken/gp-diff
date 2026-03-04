import { ReactNode } from 'react'

interface SplitPaneProps {
  top: ReactNode
  bottom: ReactNode
}

export function SplitPane({ top, bottom }: SplitPaneProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-hidden">
        {top}
      </div>
      <div className="h-1.5 bg-chrome-bg-subtle border-y border-chrome-border shadow-pane-divider shrink-0 theme-transition" />
      <div className="flex-1 overflow-hidden">
        {bottom}
      </div>
    </div>
  )
}
