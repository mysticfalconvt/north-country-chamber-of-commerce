import * as migration_20260201_171749_initial from './20260201_171749_initial';

export const migrations = [
  {
    up: migration_20260201_171749_initial.up,
    down: migration_20260201_171749_initial.down,
    name: '20260201_171749_initial'
  },
];
