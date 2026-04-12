export type ID = string

export type User = {
  id: ID
  name: string
  avatarUrl: string
}

export type Workspace = {
  id: ID
  name: string
  memberIds: ID[]
  createdAt: number
}

export type Board = {
  id: ID
  workspaceId: ID
  title: string
  createdAt: number
  updatedAt: number
}

export type Card = {
  id: ID
  boardId: ID
  title: string
  description: string
  x: number
  y: number
  w: number
  h: number
  z: number
  createdAt: number
  updatedAt: number
}

export type CardItemType = 'text' | 'image' | 'video' | 'file'

export type CardItem = {
  id: ID
  cardId: ID
  type: CardItemType
  position: number
  content: {
    text?: string
    mediaId?: ID
    name?: string
    mime?: string
  }
  createdAt: number
  updatedAt: number
}

export type CardLink = {
  id: ID
  boardId: ID
  a: ID
  b: ID
  createdAt: number
}

export type CardComment = {
  id: ID
  cardId: ID
  authorId: ID
  body: string
  createdAt: number
}

export type BoardSnapshot = {
  cards: Record<ID, Card>
  items: Record<ID, CardItem>
  links: Record<ID, CardLink>
  comments: Record<ID, CardComment>
}
