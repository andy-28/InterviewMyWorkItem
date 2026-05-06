import { useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  confirmWorkItems,
  getWorkItems,
  type UserId,
  unconfirmWorkItem,
  type WorkItemListDto,
} from './api/workItems'
import './App.css'

const users: UserId[] = ['alice', 'bob']

function App() {
  const [userId, setUserId] = useState<UserId>('alice')
  const [workItems, setWorkItems] = useState<WorkItemListDto[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allSelected = useMemo(() => {
    return workItems.length > 0 && selectedIds.length === workItems.length
  }, [selectedIds.length, workItems.length])

  async function loadWorkItems(nextUserId = userId) {
    setIsLoading(true)
    setError('')

    try {
      const data = await getWorkItems(nextUserId, 'desc')
      setWorkItems(data)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkItems(userId)
  }, [userId])

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? workItems.map((workItem) => workItem.id) : [])
  }

  function handleSelectOne(workItemId: number, checked: boolean) {
    setSelectedIds((currentIds) => {
      if (checked) {
        return currentIds.includes(workItemId)
          ? currentIds
          : [...currentIds, workItemId]
      }

      return currentIds.filter((id) => id !== workItemId)
    })
  }

  async function handleConfirmSelected() {
    if (selectedIds.length === 0) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await confirmWorkItems(userId, selectedIds)
      setMessage(result.message)
      await loadWorkItems(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm work items.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUnconfirm(workItem: WorkItemListDto) {
    const shouldUnconfirm = window.confirm(
      `Mark "${workItem.title}" as pending confirmation?`,
    )

    if (!shouldUnconfirm) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await unconfirmWorkItem(userId, workItem.id)
      setMessage(result.message || 'Work item unconfirmed.')
      await loadWorkItems(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unconfirm work item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">My Work Item</p>
          <h1>Work Items</h1>
        </div>
        <div className="api-url">API: {API_BASE_URL}</div>
      </header>

      <section className="toolbar" aria-label="Work item controls">
        <div className="user-switcher" aria-label="Select user">
          {users.map((user) => (
            <button
              key={user}
              type="button"
              className={userId === user ? 'active' : ''}
              onClick={() => setUserId(user)}
            >
              {user}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="primary-action"
          disabled={selectedIds.length === 0 || isSubmitting}
          onClick={handleConfirmSelected}
        >
          Confirm selected
        </button>
      </section>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  aria-label="Select all work items"
                  checked={allSelected}
                  disabled={workItems.length === 0}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                />
              </th>
              <th>Id</th>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Loading work items...
                </td>
              </tr>
            ) : workItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No work items found.
                </td>
              </tr>
            ) : (
              workItems.map((workItem) => (
                <tr key={workItem.id}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${workItem.title}`}
                      checked={selectedIds.includes(workItem.id)}
                      onChange={(event) =>
                        handleSelectOne(workItem.id, event.target.checked)
                      }
                    />
                  </td>
                  <td>{workItem.id}</td>
                  <td className="title-cell">{workItem.title}</td>
                  <td>
                    <span
                      className={
                        workItem.isConfirmed ? 'status confirmed' : 'status pending'
                      }
                    >
                      {workItem.isConfirmed ? '已確認' : '待確認'}
                    </span>
                  </td>
                  <td>
                    {workItem.isConfirmed ? (
                      <button
                        type="button"
                        className="secondary-action"
                        disabled={isSubmitting}
                        onClick={() => void handleUnconfirm(workItem)}
                      >
                        Unconfirm
                      </button>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default App
