import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyOauth2 from '@fastify/oauth2'
import path from 'path'
import prismaPlugin from './plugins/prisma.plugin'
import authPlugin from './plugins/auth.plugin'
import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'
import catalogRoutes from './modules/catalog/catalog.routes'
import { locationsRoutes } from './modules/locations/locations.routes'
import { actionsRoutes } from './modules/actions/actions.routes'
import { materialCatalogRoutes } from './modules/materials/catalog.routes'
import { materialsRoutes } from './modules/materials/materials.routes'

export interface AppOptions {
  jwtSecret: string
  jwtRefreshSecret: string
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  await app.register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: opts.jwtSecret,
  })
  await app.register(fastifyJwt, {
    secret: opts.jwtRefreshSecret,
    namespace: 'refresh',
    decoratorName: 'refreshUser',
    jwtSign: 'refreshJwtSign',
    jwtVerify: 'refreshJwtVerify',
    jwtDecode: 'refreshJwtDecode',
    cookie: { cookieName: 'refreshToken', signed: false },
  })
  await app.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } })
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  })
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    await app.register(fastifyOauth2, {
      name: 'googleOAuth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        auth: fastifyOauth2.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/api/v1/auth/google',
      callbackUri: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/v1/auth/google/callback',
    })
  }

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
    })
  })

  app.get('/api/v1/health', async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(usersRoutes, { prefix: '/api/v1/users' })
  await app.register(catalogRoutes, { prefix: '/api/v1' })
  await app.register(locationsRoutes, { prefix: '/api/v1/locations' })
  await app.register(actionsRoutes, { prefix: '/api/v1' })
  await app.register(materialCatalogRoutes, { prefix: '/api/v1' })
  await app.register(materialsRoutes, { prefix: '/api/v1' })

  return app
}
