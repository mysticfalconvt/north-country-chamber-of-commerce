import * as migration_20251221_112306 from './20251221_112306';
import * as migration_20251221_183343 from './20251221_183343';
import * as migration_20251224_214242 from './20251224_214242';

export const migrations = [
  {
    up: migration_20251221_112306.up,
    down: migration_20251221_112306.down,
    name: '20251221_112306',
  },
  {
    up: migration_20251221_183343.up,
    down: migration_20251221_183343.down,
    name: '20251221_183343',
  },
  {
    up: migration_20251224_214242.up,
    down: migration_20251224_214242.down,
    name: '20251224_214242'
  },
];
