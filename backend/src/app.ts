import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import prismaPlugin from './plugins/prisma.plugin'
import authPlugin from './plugins/auth.plugin'

export interface AppOptions {
  jwtSecret: string
  jwtRefreshSecret: string
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: opts.jwtSecret,
    cookie: { cookieName: 'refreshToken', signed: false },
  })
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  app.get('/api/health', async () => ({ status: 'ok' }))

  // Módulos (se añaden en tasks posteriores)
  // await app.register(authRoutes, { prefix: '/api/auth' })
  // await app.register(usersRoutes, { prefix: '/api/users' })

  return app
}
