import type {
  Board,
  Card,
  CardComment,
  CardItem,
  CardLink,
  ID,
  ScheduleItem,
  Transaction,
  User,
  Workspace,
} from './model/types'
import { id } from './utils/id'

export function makeSeed() {
  const now = Date.now()

  const users: Record<ID, User> = {}
  const addUser = (name: string, avatarUrl: string) => {
    const u: User = { id: id('u'), name, avatarUrl }
    users[u.id] = u
    return u.id
  }

  const me = addUser('You', 'https://i.pravatar.cc/64?img=68')
  addUser('Alya', 'https://i.pravatar.cc/64?img=5')
  addUser('Bimo', 'https://i.pravatar.cc/64?img=12')
  addUser('Citra', 'https://i.pravatar.cc/64?img=33')

  const wsId = id('ws')
  const workspace: Workspace = {
    id: wsId,
    name: 'Acme Creative Studio',
    memberIds: Object.keys(users),
    createdAt: now,
  }

  const boardId = id('b')
  const board: Board = {
    id: boardId,
    workspaceId: wsId,
    title: 'Spring Campaign Brainstorm',
    color: '#8b5cf6',
    createdAt: now,
    updatedAt: now,
  }

  const cards: Record<ID, Card> = {}
  const items: Record<ID, CardItem> = {}
  const links: Record<ID, CardLink> = {}
  const comments: Record<ID, CardComment> = {}

  const addCard = (title: string, x: number, y: number) => {
    const c: Card = {
      id: id('c'),
      boardId,
      title,
      description: 'Drag to move. Space+drag pans. Drag link handles to connect ideas.',
      note: 'One text box per card. Use it for tasks or notes.',
      x,
      y,
      w: 360,
      h: 260,
      z: now,
      openText: false,
      openMedia: false,
      openFiles: false,
      createdAt: now,
      updatedAt: now,
    }
    cards[c.id] = c

    const com: CardComment = {
      id: id('cm'),
      cardId: c.id,
      authorId: me,
      body: 'This is a prototype comment thread.',
      createdAt: now,
    }
    comments[com.id] = com

    return c.id
  }

  const c1 = addCard('Hero concept', -200, -120)
  const c2 = addCard('Moodboard', 220, -80)
  const c3 = addCard('Shot list', 60, 240)

  const addLink = (a: ID, b: ID) => {
    const l: CardLink = { id: id('ln'), boardId, a, b, createdAt: now }
    links[l.id] = l
  }

  addLink(c1, c2)
  addLink(c1, c3)

  const scheduleItems: Record<ID, ScheduleItem> = {}
  const transactions: Record<ID, Transaction> = {}

  const addSchedule = (partial: Partial<ScheduleItem>) => {
    const schedule: ScheduleItem = {
      id: id('sch'),
      workspaceId: wsId,
      boardId,
      linkedCardId: undefined,
      title: partial.title ?? 'Production task',
      note: partial.note ?? '',
      startDate: partial.startDate ?? now,
      endDate: partial.endDate ?? now,
      status: partial.status ?? 'Production',
      createdAt: now,
      updatedAt: now,
    }
    scheduleItems[schedule.id] = schedule
  }

  addSchedule({
    title: 'Pre-production lock',
    note: 'Approve the concept deck and lock references.',
    linkedCardId: c1,
    startDate: now + 1000 * 60 * 60 * 24,
    endDate: now + 1000 * 60 * 60 * 24 * 2,
    status: 'Review',
  })

  addSchedule({
    title: 'Moodboard capture day',
    note: 'Shoot and collect environment textures.',
    linkedCardId: c2,
    startDate: now + 1000 * 60 * 60 * 24 * 4,
    endDate: now + 1000 * 60 * 60 * 24 * 6,
    status: 'Production',
  })

  addSchedule({
    title: 'Shot list final review',
    note: 'Finalize asset order and delivery sequence.',
    linkedCardId: c3,
    startDate: now + 1000 * 60 * 60 * 24 * 8,
    endDate: now + 1000 * 60 * 60 * 24 * 8,
    status: 'Finalizing',
  })

  const addTransaction = (partial: Omit<Transaction, 'id' | 'workspaceId'>) => {
    const transaction: Transaction = {
      id: id('txn'),
      workspaceId: wsId,
      ...partial,
    }
    transactions[transaction.id] = transaction
  }

  addTransaction({
    projectId: boardId,
    type: 'income',
    amount: 18500,
    category: 'Client Retainer',
    date: now - 1000 * 60 * 60 * 24 * 4,
    note: 'Spring campaign deposit received.',
  })

  addTransaction({
    projectId: boardId,
    type: 'expense',
    amount: 2400,
    category: 'Equipment Rental',
    date: now - 1000 * 60 * 60 * 24 * 2,
    note: 'Lighting kit and lens package.',
  })

  addTransaction({
    projectId: undefined,
    type: 'expense',
    amount: 780,
    category: 'Studio Ops',
    date: now - 1000 * 60 * 60 * 12,
    note: 'Sound booth maintenance.',
  })

  return {
    currentUserId: me,
    users,
    workspaces: { [workspace.id]: workspace },
    boards: { [board.id]: board },
    cards,
    items,
    links,
    comments,
    scheduleItems,
    transactions,
  }
}
