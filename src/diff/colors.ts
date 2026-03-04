/** Shared diff color palette. All overlay/minimap/filter colors originate here. */
export const DIFF_COLORS = {
  added: {
    solid: '#22c55e',
    rgb: 'rgb(34, 197, 94)',
    overlay: 'rgba(34, 197, 94, 0.25)',
    ghost: 'rgba(34, 197, 94, 0.12)',
  },
  removed: {
    solid: '#ef4444',
    rgb: 'rgb(239, 68, 68)',
    overlay: 'rgba(239, 68, 68, 0.25)',
    ghost: 'rgba(239, 68, 68, 0.12)',
  },
  changed: {
    solid: '#eab308',
    rgb: 'rgb(234, 179, 8)',
    overlay: 'rgba(234, 179, 8, 0.25)',
    ghost: 'rgba(234, 179, 8, 0.12)',
  },
  meta: {
    solid: '#6366f1',
    rgb: 'rgb(99, 102, 241)',
  },
  equal: {
    solid: '#374151',
    rgb: 'rgb(55, 65, 81)',
  },
} as const
