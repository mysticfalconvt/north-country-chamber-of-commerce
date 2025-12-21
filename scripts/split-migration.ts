import fs from 'fs'
import path from 'path'

// Find the most recent migration file
const migrationsDir = path.join(process.cwd(), 'src/migrations')
const files = fs.readdirSync(migrationsDir)
const tsFiles = files.filter(f => f.endsWith('.ts') && f !== 'index.ts')
const latestMigration = tsFiles.sort().reverse()[0]

if (!latestMigration) {
  console.error('No migration files found')
  process.exit(1)
}

const migrationPath = path.join(migrationsDir, latestMigration)
console.log(`Splitting migration: ${latestMigration}`)

const content = fs.readFileSync(migrationPath, 'utf-8')

// Extract the SQL content from within the sql`` template literal
const upFunctionMatch = content.match(/export async function up\([^)]+\): Promise<void> \{[\s\S]*?await db\.execute\(sql`([\s\S]*?)`\s*\)/m)
const downFunctionMatch = content.match(/export async function down\([^)]+\): Promise<void> \{[\s\S]*?await db\.execute\(sql`([\s\S]*?)`\s*\)/m)

if (!upFunctionMatch || !downFunctionMatch) {
  console.error('Could not parse migration file')
  process.exit(1)
}

const upSQL = upFunctionMatch[1].trim()
const downSQL = downFunctionMatch[1].trim()

// Split SQL by statement (semicolon followed by newline)
const upStatements = upSQL.split(/;\s*\n/).filter(s => s.trim())
const downStatements = downSQL.split(/;\s*\n/).filter(s => s.trim())

console.log(`Found ${upStatements.length} UP statements`)
console.log(`Found ${downStatements.length} DOWN statements`)

// Group statements into chunks of 50
const chunkSize = 50

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const upChunks = chunkArray(upStatements, chunkSize)
const downChunks = chunkArray(downStatements, chunkSize)

// Generate new migration content
const newContent = `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
${upChunks.map((chunk, i) => `  // Batch ${i + 1} of ${upChunks.length}
  await db.execute(sql\`
   ${chunk.join(';\n  ')};
  \`)`).join('\n\n')}
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
${downChunks.map((chunk, i) => `  // Batch ${i + 1} of ${downChunks.length}
  await db.execute(sql\`
   ${chunk.join(';\n  ')};
  \`)`).join('\n\n')}
}
`

// Write the new migration
fs.writeFileSync(migrationPath, newContent, 'utf-8')
console.log(`✅ Migration split into ${upChunks.length} batches of ~${chunkSize} statements each`)
console.log(`Wrote to: ${migrationPath}`)
