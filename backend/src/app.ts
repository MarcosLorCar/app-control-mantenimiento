import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import prismaPlugin from './plugins/prisma.plugin'
import authPlugin from './plugins/auth.plugin'
import authRoutes from './modules/auth/auth.routes'

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

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
    })
  })

  app.get('/api/v1/health', async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/api/v1/auth' })

  // Módulos pendientes
  // await app.register(usersRoutes, { prefix: '/api/v1/users' })
  // await app.register(infrastructuresRoutes, { prefix: '/api/v1/infrastructures' })
  // await app.register(actionsRoutes, { prefix: '/api/v1/actions' })
  // await app.register(catalogRoutes, { prefix: '/api/v1/catalog' })

  return app
}
