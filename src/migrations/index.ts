import * as migration_20251221_112306 from './20251221_112306';
import * as migration_20251221_183343 from './20251221_183343';

export const migrations = [
  {
    up: migration_20251221_112306.up,
    down: migration_20251221_112306.down,
    name: '20251221_112306',
  },
  {
    up: migration_20251221_183343.up,
    down: migration_20251221_183343.down,
    name: '20251221_183343'
  },
];
