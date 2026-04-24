import { PrismaClient } from '@prisma/client'
import type { CreateActionTypeInput, UpdateActionTypeInput, CreateActionStatusInput, UpdateActionStatusInput } from './catalog.schema'

const ACTION_TYPE_SELECT = {
  id: true, code: true, name: true, description: true, icon: true, color: true, deletedAt: true,
}

const ACTION_STATUS_SELECT = {
  id: true, code: true, name: true, isTerminal: true, color: true, sortOrder: true, deletedAt: true,
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

export function listActionStatuses(db: PrismaClient) {
  return db.actionStatus.findMany({
    where: { deletedAt: null },
    select: ACTION_STATUS_SELECT,
    orderBy: { sortOrder: 'asc' },
  })
}

export function getActionStatus(db: PrismaClient, id: number) {
  return db.actionStatus.findFirst({ where: { id, deletedAt: null }, select: ACTION_STATUS_SELECT })
}

export function createActionStatus(db: PrismaClient, data: CreateActionStatusInput) {
  return db.actionStatus.create({ data, select: ACTION_STATUS_SELECT })
}

export function updateActionStatus(db: PrismaClient, id: number, data: UpdateActionStatusInput) {
  return db.actionStatus.update({ where: { id, deletedAt: null }, data, select: ACTION_STATUS_SELECT })
}
