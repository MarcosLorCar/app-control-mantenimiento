import { buildApp } from './app'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
}
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET debe tener al menos 32 caracteres')
}

async function start() {
  const app = await buildApp({
    jwtSecret: JWT_SECRET,
    jwtRefreshSecret: JWT_REFRESH_SECRET,
  })

  process.on('SIGTERM', async () => {
    await app.close()
    process.exit(0)
  })

  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('API corriendo en http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
