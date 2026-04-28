import { PrismaClient } from '@prisma/client'
import type {
  CreateInfrastructureTypeInput, UpdateInfrastructureTypeInput,
  CreateActionTypeInput, UpdateActionTypeInput,
} from './catalog.schema'

const INFRA_TYPE_SELECT = {
  id: true, name: true, description: true, icon: true, color: true, deletedAt: true,
}

export function listInfrastructureTypes(db: PrismaClient) {
  return db.infrastructureType.findMany({
    where: { deletedAt: null },
    select: INFRA_TYPE_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getInfrastructureType(db: PrismaClient, id: number) {
  return db.infrastructureType.findFirst({ where: { id, deletedAt: null }, select: INFRA_TYPE_SELECT })
}

export function createInfrastructureType(db: PrismaClient, data: CreateInfrastructureTypeInput) {
  return db.infrastructureType.create({ data, select: INFRA_TYPE_SELECT })
}

export function updateInfrastructureType(db: PrismaClient, id: number, data: UpdateInfrastructureTypeInput) {
  return db.infrastructureType.update({ where: { id }, data, select: INFRA_TYPE_SELECT })
}

export function softDeleteInfrastructureType(db: PrismaClient, id: number) {
  return db.infrastructureType.update({ where: { id }, data: { deletedAt: new Date() } })
}

const ACTION_TYPE_SELECT = {
  id: true, code: true, name: true, description: true, icon: true, color: true, deletedAt: true,
}

export function listRoles(db: PrismaClient) {
  return db.role.findMany({ orderBy: { name: 'asc' } })
}

export function listActionTypes(db: PrismaClient) {
  return db.actionType.findMany({
    where: { deletedAt: null },
    select: ACTION_TYPE_SELECT,
    orderBy: { name: 'asc' },
  })
}

export function getActionType(db: PrismaClient, id: number) {
  return db.actionType.findFirst({ where: { id, deletedAt: null }, select: ACTION_TYPE_SELECT })
}

export function createActionType(db: PrismaClient, data: CreateActionTypeInput) {
  return db.actionType.create({ data, select: ACTION_TYPE_SELECT })
}

export function updateActionType(db: PrismaClient, id: number, data: UpdateActionTypeInput) {
  return db.actionType.update({ where: { id, deletedAt: null }, data, select: ACTION_TYPE_SELECT })
}
