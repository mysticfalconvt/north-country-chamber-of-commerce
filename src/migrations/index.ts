import * as migration_20260131_145338 from './20260131_145338';
import * as migration_20260131_195626_events_overhaul from './20260131_195626_events_overhaul';
import * as migration_20260131_220000_remove_recurrence_start_date from './20260131_220000_remove_recurrence_start_date';

export const migrations = [
  {
    up: migration_20260131_145338.up,
    down: migration_20260131_145338.down,
    name: '20260131_145338',
  },
  {
    up: migration_20260131_195626_events_overhaul.up,
    down: migration_20260131_195626_events_overhaul.down,
    name: '20260131_195626_events_overhaul'
  },
  {
    up: migration_20260131_220000_remove_recurrence_start_date.up,
    down: migration_20260131_220000_remove_recurrence_start_date.down,
    name: '20260131_220000_remove_recurrence_start_date'
  },
];
