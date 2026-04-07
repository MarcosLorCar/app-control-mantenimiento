import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const envContent = readFileSync(join(root, '.env'), 'utf-8')
const match = envContent.match(/^TEST_DATABASE_URL="?([^"\n]+)"?/m)
const testUrl = match?.[1]

if (!testUrl) throw new Error('TEST_DATABASE_URL no encontrado en .env')

console.log('→ Migrando base de datos de desarrollo...')
execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: root })

console.log('→ Migrando base de datos de test...')
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  cwd: root,
  env: { ...process.env, DATABASE_URL: testUrl },
})

console.log('✓ Ambas bases de datos migradas.')
