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
  color: string
  createdAt: number
  updatedAt: number
}

export type Card = {
  id: ID
  boardId: ID
  title: string
  description: string

  /** Single text box content (not an item). */
  note: string

  /** Canvas position/size */
  x: number
  y: number
  w: number
  h: number
  z: number

  /** On-card dropdowns */
  openText: boolean
  openMedia: boolean
  openFiles: boolean

  createdAt: number
  updatedAt: number
}

export type ScheduleItem = {
  id: ID
  workspaceId: ID
  boardId?: ID
  linkedCardId?: ID
  title: string
  note: string
  startDate: number
  endDate: number
  status: string
  createdAt: number
  updatedAt: number
}

export type CardItemType = 'image' | 'video' | 'file'

export type CardItem = {
  id: ID
  cardId: ID
  type: CardItemType
  position: number
  content: {
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
  label?: string
  createdAt: number
}

export type CardComment = {
  id: ID
  cardId: ID
  authorId: ID
  body: string
  createdAt: number
}

export type Transaction = {
  id: ID
  workspaceId: ID
  projectId?: ID
  type: 'income' | 'expense'
  amount: number
  category: string
  date: number
  note: string
}

export type BoardSnapshot = {
  cards: Record<ID, Card>
  items: Record<ID, CardItem>
  links: Record<ID, CardLink>
  comments: Record<ID, CardComment>
}
