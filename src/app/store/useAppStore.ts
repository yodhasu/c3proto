import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Board, BoardSnapshot, Card, CardComment, CardItem, CardLink, ID, User, Workspace } from '../model/types'
import { makeSeed } from '../seed'
import { id } from '../utils/id'

type BoardHistory = { undo: BoardSnapshot[]; redo: BoardSnapshot[] }

type State = {
  version: 1
  currentUserId: ID
  users: Record<ID, User>
  workspaces: Record<ID, Workspace>
  boards: Record<ID, Board>
  cards: Record<ID, Card>
  items: Record<ID, CardItem>
  links: Record<ID, CardLink>
  comments: Record<ID, CardComment>
  histories: Record<ID, BoardHistory>

  ensureSeeded: () => void

  listBoards: (workspaceId: ID) => Board[]
  getWorkspace: (workspaceId: ID) => Workspace | undefined
  getBoard: (boardId: ID) => Board | undefined
  getBoardCards: (boardId: ID) => Card[]
  getCardItems: (cardId: ID) => CardItem[]
  getCardComments: (cardId: ID) => CardComment[]
  getBoardLinks: (boardId: ID) => CardLink[]

  createBoard: (workspaceId: ID, title?: string) => ID
  renameBoard: (boardId: ID, title: string) => void

  withHistory: (boardId: ID, fn: () => void) => void
  undo: (boardId: ID) => void
  redo: (boardId: ID) => void

  createCard: (boardId: ID, partial: Partial<Card>) => ID
  updateCard: (cardId: ID, patch: Partial<Card>) => void
  deleteCard: (cardId: ID) => void

  addTextItem: (cardId: ID) => ID
  addMediaItem: (cardId: ID, type: 'image' | 'video' | 'file', meta: { mediaId: ID; name: string; mime: string }) => ID
  updateItem: (itemId: ID, patch: Partial<CardItem>) => void
  deleteItem: (itemId: ID) => void

  addComment: (cardId: ID, body: string) => ID

  createLink: (boardId: ID, a: ID, b: ID) => ID
  deleteLink: (linkId: ID) => void
}

function snapshotForBoard(state: Pick<State, 'cards' | 'items' | 'links' | 'comments'>, boardId: ID): BoardSnapshot {
  const cards: Record<ID, Card> = {}
  const items: Record<ID, CardItem> = {}
  const links: Record<ID, CardLink> = {}
  const comments: Record<ID, CardComment> = {}

  for (const c of Object.values(state.cards)) {
    if (c.boardId === boardId) cards[c.id] = c
  }
  const cardIds = new Set(Object.keys(cards))

  for (const it of Object.values(state.items)) {
    if (cardIds.has(it.cardId)) items[it.id] = it
  }
  for (const l of Object.values(state.links)) {
    if (l.boardId === boardId) links[l.id] = l
  }
  for (const cm of Object.values(state.comments)) {
    if (cardIds.has(cm.cardId)) comments[cm.id] = cm
  }

  return { cards, items, links, comments }
}

function applySnapshot(boardId: ID, snap: BoardSnapshot, set: (fn: (s: State) => Partial<State>) => void) {
  set((s) => {
    const nextCards = { ...s.cards }
    const nextItems = { ...s.items }
    const nextLinks = { ...s.links }
    const nextComments = { ...s.comments }

    // clear existing for board
    for (const c of Object.values(s.cards)) {
      if (c.boardId === boardId) delete nextCards[c.id]
    }
    const removedCardIds = new Set(Object.values(s.cards).filter((c) => c.boardId === boardId).map((c) => c.id))

    for (const it of Object.values(s.items)) {
      if (removedCardIds.has(it.cardId)) delete nextItems[it.id]
    }
    for (const l of Object.values(s.links)) {
      if (l.boardId === boardId) delete nextLinks[l.id]
    }
    for (const cm of Object.values(s.comments)) {
      if (removedCardIds.has(cm.cardId)) delete nextComments[cm.id]
    }

    Object.assign(nextCards, snap.cards)
    Object.assign(nextItems, snap.items)
    Object.assign(nextLinks, snap.links)
    Object.assign(nextComments, snap.comments)

    return { cards: nextCards, items: nextItems, links: nextLinks, comments: nextComments }
  })
}

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      version: 1,
      currentUserId: 'u_seed',
      users: {},
      workspaces: {},
      boards: {},
      cards: {},
      items: {},
      links: {},
      comments: {},
      histories: {},

      ensureSeeded: () => {
        const s = get()
        if (Object.keys(s.workspaces).length > 0) return
        const seed = makeSeed()
        set({
          currentUserId: seed.currentUserId,
          users: seed.users,
          workspaces: seed.workspaces,
          boards: seed.boards,
          cards: seed.cards,
          items: seed.items,
          links: seed.links,
          comments: seed.comments,
          histories: {},
        })
      },

      listBoards: (workspaceId) => Object.values(get().boards).filter((b) => b.workspaceId === workspaceId).sort((a, b) => b.updatedAt - a.updatedAt),
      getWorkspace: (workspaceId) => get().workspaces[workspaceId],
      getBoard: (boardId) => get().boards[boardId],
      getBoardCards: (boardId) => Object.values(get().cards).filter((c) => c.boardId === boardId).sort((a, b) => a.z - b.z),
      getCardItems: (cardId) => Object.values(get().items).filter((it) => it.cardId === cardId).sort((a, b) => a.position - b.position),
      getCardComments: (cardId) => Object.values(get().comments).filter((cm) => cm.cardId === cardId).sort((a, b) => a.createdAt - b.createdAt),
      getBoardLinks: (boardId) => Object.values(get().links).filter((l) => l.boardId === boardId),

      createBoard: (workspaceId, title) => {
        const now = Date.now()
        const b: Board = { id: id('b'), workspaceId, title: title ?? 'Untitled board', createdAt: now, updatedAt: now }
        set((s) => ({ boards: { ...s.boards, [b.id]: b } }))
        return b.id
      },
      renameBoard: (boardId, title) => {
        set((s) => ({ boards: { ...s.boards, [boardId]: { ...s.boards[boardId], title, updatedAt: Date.now() } } }))
      },

      withHistory: (boardId, fn) => {
        const s = get()
        const snap = snapshotForBoard(s, boardId)
        set((st) => {
          const h = st.histories[boardId] ?? { undo: [], redo: [] }
          const undo = [...h.undo, snap].slice(-50)
          return { histories: { ...st.histories, [boardId]: { undo, redo: [] } } }
        })
        fn()
      },

      undo: (boardId) => {
        const h = get().histories[boardId]
        if (!h || h.undo.length === 0) return
        const current = snapshotForBoard(get(), boardId)
        const prev = h.undo[h.undo.length - 1]
        set((s) => ({ histories: { ...s.histories, [boardId]: { undo: h.undo.slice(0, -1), redo: [current, ...h.redo].slice(0, 50) } } }))
        applySnapshot(boardId, prev, set)
      },

      redo: (boardId) => {
        const h = get().histories[boardId]
        if (!h || h.redo.length === 0) return
        const current = snapshotForBoard(get(), boardId)
        const next = h.redo[0]
        set((s) => ({ histories: { ...s.histories, [boardId]: { undo: [...h.undo, current].slice(-50), redo: h.redo.slice(1) } } }))
        applySnapshot(boardId, next, set)
      },

      createCard: (boardId, partial) => {
        const now = Date.now()
        const c: Card = {
          id: id('c'),
          boardId,
          title: partial.title ?? 'New card',
          description: partial.description ?? '',
          x: partial.x ?? 0,
          y: partial.y ?? 0,
          w: partial.w ?? 320,
          h: partial.h ?? 180,
          z: partial.z ?? now,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ cards: { ...s.cards, [c.id]: c }, boards: { ...s.boards, [boardId]: { ...s.boards[boardId], updatedAt: now } } }))
        return c.id
      },

      updateCard: (cardId, patch) => {
        set((s) => {
          const c = s.cards[cardId]
          const now = Date.now()
          return {
            cards: { ...s.cards, [cardId]: { ...c, ...patch, updatedAt: now } },
            boards: { ...s.boards, [c.boardId]: { ...s.boards[c.boardId], updatedAt: now } },
          }
        })
      },

      deleteCard: (cardId) => {
        set((s) => {
          const c = s.cards[cardId]
          const nextCards = { ...s.cards }
          const nextItems = { ...s.items }
          const nextLinks = { ...s.links }
          const nextComments = { ...s.comments }

          delete nextCards[cardId]
          for (const it of Object.values(s.items)) if (it.cardId === cardId) delete nextItems[it.id]
          for (const cm of Object.values(s.comments)) if (cm.cardId === cardId) delete nextComments[cm.id]
          for (const l of Object.values(s.links)) if (l.a === cardId || l.b === cardId) delete nextLinks[l.id]

          return { cards: nextCards, items: nextItems, links: nextLinks, comments: nextComments, boards: { ...s.boards, [c.boardId]: { ...s.boards[c.boardId], updatedAt: Date.now() } } }
        })
      },

      addTextItem: (cardId) => {
        const now = Date.now()
        const it: CardItem = { id: id('it'), cardId, type: 'text', position: now, content: { text: '' }, createdAt: now, updatedAt: now }
        set((s) => ({ items: { ...s.items, [it.id]: it } }))
        return it.id
      },

      addMediaItem: (cardId, type, meta) => {
        const now = Date.now()
        const it: CardItem = {
          id: id('it'),
          cardId,
          type,
          position: now,
          content: { mediaId: meta.mediaId, name: meta.name, mime: meta.mime },
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ items: { ...s.items, [it.id]: it } }))
        return it.id
      },

      updateItem: (itemId, patch) => {
        set((s) => ({ items: { ...s.items, [itemId]: { ...s.items[itemId], ...patch, updatedAt: Date.now() } } }))
      },

      deleteItem: (itemId) => {
        set((s) => {
          const next = { ...s.items }
          delete next[itemId]
          return { items: next }
        })
      },

      addComment: (cardId, body) => {
        const now = Date.now()
        const cm: CardComment = { id: id('cm'), cardId, authorId: get().currentUserId, body, createdAt: now }
        set((s) => ({ comments: { ...s.comments, [cm.id]: cm } }))
        return cm.id
      },

      createLink: (boardId, a, b) => {
        if (a === b) return ''
        const now = Date.now()
        // dedupe
        for (const l of Object.values(get().links)) {
          if (l.boardId !== boardId) continue
          if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) return l.id
        }
        const ln: CardLink = { id: id('ln'), boardId, a, b, createdAt: now }
        set((s) => ({ links: { ...s.links, [ln.id]: ln } }))
        return ln.id
      },

      deleteLink: (linkId) => {
        set((s) => {
          const next = { ...s.links }
          delete next[linkId]
          return { links: next }
        })
      },
    }),
    {
      name: 'swb:v1',
      partialize: (s) => ({
        version: s.version,
        currentUserId: s.currentUserId,
        users: s.users,
        workspaces: s.workspaces,
        boards: s.boards,
        cards: s.cards,
        items: s.items,
        links: s.links,
        comments: s.comments,
        histories: s.histories,
      }),
    },
  ),
)
