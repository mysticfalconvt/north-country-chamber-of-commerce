import * as migration_20260201_171749_initial from './20260201_171749_initial'
import * as migration_20260612_000000_events_attachment_hasmany from './20260612_000000_events_attachment_hasmany'
import * as migration_20261121_172157_payload_3_93_upgrade from './20261121_172157_payload_3_93_upgrade'

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
  {
    up: migration_20261121_172157_payload_3_93_upgrade.up,
    down: migration_20261121_172157_payload_3_93_upgrade.down,
    name: '20261121_172157_payload_3_93_upgrade',
  },
]
