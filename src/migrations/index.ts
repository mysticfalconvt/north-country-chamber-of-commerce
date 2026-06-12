import * as migration_20260201_171749_initial from './20260201_171749_initial'
import * as migration_20260612_000000_events_attachment_hasmany from './20260612_000000_events_attachment_hasmany'

export const migrations = [
  {
    up: migration_20260201_171749_initial.up,
    down: migration_20260201_171749_initial.down,
    name: '20260201_171749_initial',
  },
  {
    up: migration_20260612_000000_events_attachment_hasmany.up,
    down: migration_20260612_000000_events_attachment_hasmany.down,
    name: '20260612_000000_events_attachment_hasmany',
  },
]
