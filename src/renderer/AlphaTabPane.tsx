import { useEffect, useRef } from 'react'
import { AlphaTabApi, LayoutMode, Score } from '@coderline/alphatab'

export interface AlphaTabPaneProps {
  buffer: ArrayBuffer | null
  onRenderFinished?: (api: AlphaTabApi) => void
  onScoreLoaded?: (score: Score) => void
}

export function AlphaTabPane({ buffer, onRenderFinished, onScoreLoaded }: AlphaTabPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onRenderFinishedRef = useRef(onRenderFinished)
  const onScoreLoadedRef = useRef(onScoreLoaded)

  onRenderFinishedRef.current = onRenderFinished
  onScoreLoadedRef.current = onScoreLoaded

  useEffect(() => {
    if (!containerRef.current) return

    const api = new AlphaTabApi(containerRef.current, {
      core: {
        scriptFile: '/alphaTab.worker.mjs',
      },
      display: {
        layoutMode: LayoutMode.Horizontal,
      },
      player: {
        enablePlayer: false,
        enableCursor: false,
      },
    })

    const unsubRender = api.postRenderFinished.on(() => {
      onRenderFinishedRef.current?.(api)
    })

    const unsubScore = api.scoreLoaded.on((score: Score) => {
      onScoreLoadedRef.current?.(score)
    })

    if (buffer !== null) {
      api.load(buffer)
    }

    return () => {
      unsubRender()
      unsubScore()
      api.destroy()
    }
  }, [buffer])

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto" />
  )
}
