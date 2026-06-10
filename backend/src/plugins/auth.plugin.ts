import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload } from '@control-actions/shared'

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireWrite: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireManage: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    refreshJwtVerify: (options?: Record<string, unknown>) => Promise<void>
    refreshUser?: { sub: number }
  }

  interface FastifyReply {
    refreshJwtSign: (
      payload: unknown,
      options?: { expiresIn?: string } & Record<string, unknown>
    ) => Promise<string>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('verifyToken', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
  })

  fastify.decorate('requireWrite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
    if (!request.user.can_write) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Se requiere permiso de escritura' } })
    }
  })

  fastify.decorate('requireManage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })
    }
    if (!request.user.can_manage) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Se requiere permiso de gestión' } })
    }
  })
}

export default fp(authPlugin)
