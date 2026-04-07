import { buildApp } from './app'

async function start() {
  const app = await buildApp({
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
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
