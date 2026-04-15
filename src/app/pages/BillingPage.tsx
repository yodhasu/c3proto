import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useAppStore } from '../store/useAppStore'

function currency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function BillingPage() {
  const { workspaceId } = useParams()
  const workspace = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))
  const boards = useAppStore((s) => s.boards)
  const transactionsById = useAppStore((s) => s.transactions)
  const createTransaction = useAppStore((s) => s.createTransaction)

  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [projectId, setProjectId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const workspaceBoards = useMemo(() => {
    return Object.values(boards).filter((board) => board.workspaceId === workspaceId)
  }, [boards, workspaceId])

  const transactions = useMemo(() => {
    return Object.values(transactionsById)
      .filter((transaction) => transaction.workspaceId === workspaceId)
      .sort((a, b) => b.date - a.date)
  }, [transactionsById, workspaceId])

  const metrics = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    let totalBalance = 0
    let monthlyRevenue = 0
    let monthlyExpenses = 0

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.date)
      const isThisMonth = transactionDate.getMonth() === month && transactionDate.getFullYear() === year
      if (transaction.type === 'income') {
        totalBalance += transaction.amount
        if (isThisMonth) monthlyRevenue += transaction.amount
      } else {
        totalBalance -= transaction.amount
        if (isThisMonth) monthlyExpenses += transaction.amount
      }
    }

    return { totalBalance, monthlyRevenue, monthlyExpenses }
  }, [transactions])

  if (!workspaceId || !workspace) return null

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <Breadcrumbs items={[{ label: workspace.name, to: `/w/${workspaceId}/dashboard` }, { label: 'Budgeting' }]} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 6 }}>
            Studio Banking
          </div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05 }}>Budgeting</h1>
          <p style={{ marginTop: 8, color: 'rgb(var(--c-muted))', fontSize: 13 }}>
            Track income, production expenses, and project-linked financial activity in one ledger.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 22 }}>
        <div className="glass-panel" style={{ borderRadius: 22, padding: 18 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--c-muted))', marginBottom: 8 }}>Total Balance</div>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 800 }}>{currency(metrics.totalBalance)}</div>
        </div>
        <div className="glass-panel" style={{ borderRadius: 22, padding: 18 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--c-muted))', marginBottom: 8 }}>Monthly Revenue</div>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'rgb(var(--c-green))' }}>{currency(metrics.monthlyRevenue)}</div>
        </div>
        <div className="glass-panel" style={{ borderRadius: 22, padding: 18 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--c-muted))', marginBottom: 8 }}>Monthly Expenses</div>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'rgb(var(--c-red))' }}>{currency(metrics.monthlyExpenses)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 20 }}>
        <div className="glass-panel" style={{ position: 'relative', borderRadius: 24, padding: 20, alignSelf: 'start' }}>
          {isSaving && (
            <div className="glass-loader">
              <div className="glass-loader__spinner" />
              <span>Adding entry...</span>
            </div>
          )}

          <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Add Transaction</div>
          <div className={isSaving ? 'glass-loading-content' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <select className="input-base" value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')} disabled={isSaving}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input className="input-base" type="number" min="0" value={amount} onFocus={() => { if (amount === '0') setAmount('') }} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" disabled={isSaving} />
            <input className="input-base" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" disabled={isSaving} />
            <input className="input-base" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isSaving} />
            <select className="input-base" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isSaving}>
              <option value="">Unassigned to project</option>
              {workspaceBoards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
            </select>
            <textarea className="input-base" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" style={{ minHeight: 110, resize: 'vertical' }} disabled={isSaving} />
            <button
              className="btn btn-primary"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                await new Promise((resolve) => window.setTimeout(resolve, 480))
                createTransaction(workspaceId, {
                  type,
                  amount: Number(amount) || 0,
                  category: category || 'Uncategorized',
                  date: new Date(date).getTime(),
                  note,
                  projectId: projectId || undefined,
                })
                setAmount('')
                setCategory('')
                setNote('')
                setProjectId('')
                setIsSaving(false)
              }}
            >
              {isSaving ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </div>

        <div className="glass-panel premium-scroll" style={{ borderRadius: 24, padding: 12, maxHeight: 'calc(100vh - 260px)', overflow: 'auto' }}>
          {transactions.length === 0 ? (
            <div style={{ minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'rgb(var(--c-cyan-hi))' }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 14h.01"/><path d="M15 14h.01"/>
                  </svg>
                </div>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No transactions found</div>
                <div style={{ color: 'rgb(var(--c-muted))', maxWidth: 420 }}>
                  Start your studio ledger by adding your first production deposit.
                </div>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Type', 'Category', 'Project', 'Note', 'Amount'].map((label) => (
                    <th key={label} style={{ textAlign: label === 'Amount' ? 'right' : 'left', padding: '14px 16px', fontSize: 11, color: 'rgb(var(--c-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(var(--c-border), 0.65)' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)', fontSize: 12 }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)' }}>
                      <span className={transaction.type === 'income' ? 'badge badge-income' : 'badge badge-expense'}>
                        {transaction.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)', fontSize: 12 }}>{transaction.category}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)', fontSize: 12, color: 'rgb(var(--c-muted))' }}>
                      {transaction.projectId ? boards[transaction.projectId]?.title ?? 'Unknown Project' : 'Studio'}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)', fontSize: 12, color: 'rgb(var(--c-muted))' }}>{transaction.note || '—'}</td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(var(--c-border), 0.35)', fontSize: 12, fontWeight: 700, textAlign: 'right', color: transaction.type === 'income' ? 'rgb(var(--c-green))' : 'rgb(var(--c-red))' }}>
                      {transaction.type === 'income' ? '+' : '-'}{currency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
