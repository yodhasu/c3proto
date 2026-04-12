import type { Board, Card, CardComment, CardItem, CardLink, ID, User, Workspace } from './model/types'
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
      description: 'Click to edit. Drag to move. Resize from corners.',
      x,
      y,
      w: 320,
      h: 180,
      z: 1,
      createdAt: now,
      updatedAt: now,
    }
    cards[c.id] = c

    const it: CardItem = {
      id: id('it'),
      cardId: c.id,
      type: 'text',
      position: 1,
      content: { text: 'Notes…' },
      createdAt: now,
      updatedAt: now,
    }
    items[it.id] = it

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

  return {
    currentUserId: me,
    users,
    workspaces: { [workspace.id]: workspace },
    boards: { [board.id]: board },
    cards,
    items,
    links,
    comments,
  }
}
