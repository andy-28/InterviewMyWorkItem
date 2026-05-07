import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  API_BASE_URL,
  confirmWorkItems,
  createWorkItem,
  deleteWorkItem,
  getAdminWorkItems,
  getWorkItemDetail,
  getWorkItems,
  type UserId,
  type WorkItemDetailDto,
  type WorkItemListDto,
  unconfirmWorkItem,
  updateWorkItem,
} from './api/workItems'
import './App.css'

const users: UserId[] = ['alice', 'bob']

type ViewMode = 'front' | 'admin'

type WorkItemFormState = {
  title: string
  description: string
}

const emptyForm: WorkItemFormState = {
  title: '',
  description: '',
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('front')

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">My Work Item</p>
          <h1>{viewMode === 'front' ? 'Work Items' : 'Admin Work Items'}</h1>
        </div>
        <div className="header-meta">
          <div className="api-url">API: {API_BASE_URL}</div>
          <nav className="view-switcher" aria-label="Application views">
            <button
              type="button"
              className={viewMode === 'front' ? 'active' : ''}
              onClick={() => setViewMode('front')}
            >
              Front
            </button>
            <button
              type="button"
              className={viewMode === 'admin' ? 'active' : ''}
              onClick={() => setViewMode('admin')}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      {viewMode === 'front' ? <FrontWorkItems /> : <AdminWorkItems />}
    </main>
  )
}

function FrontWorkItems() {
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
      `確定要將「${workItem.title}」標記回待確認嗎？`,
    )

    if (!shouldUnconfirm) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await unconfirmWorkItem(userId, workItem.id)
      setMessage(result.message || '已標記為待確認。')
      await loadWorkItems(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unconfirm work item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
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
                  目前無待辦項目
                </td>
              </tr>
            ) : (
              workItems.map((workItem) => (
                <tr
                  key={workItem.id}
                  className={selectedIds.includes(workItem.id) ? 'selected-row' : ''}
                >
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
                        撤銷確認
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
    </>
  )
}

function AdminWorkItems() {
  const [workItems, setWorkItems] = useState<WorkItemListDto[]>([])
  const [form, setForm] = useState<WorkItemFormState>(emptyForm)
  const [editingItem, setEditingItem] = useState<WorkItemDetailDto | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = editingItem !== null
  const isFormValid = form.title.trim().length > 0

  async function loadAdminWorkItems() {
    setIsLoading(true)
    setError('')

    try {
      const data = await getAdminWorkItems()
      setWorkItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminWorkItems()
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditingItem(null)
  }

  async function handleEdit(workItem: WorkItemListDto) {
    setMessage('')
    setError('')

    try {
      const detail = await getWorkItemDetail(workItem.id, 'admin')
      setEditingItem(detail)
      setForm({
        title: detail.title,
        description: detail.description ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work item detail.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isFormValid) {
      setError('標題不得為空。')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
    }

    try {
      if (editingItem) {
        await updateWorkItem(editingItem.id, payload)
        setMessage('更新成功。')
      } else {
        await createWorkItem(payload)
        setMessage('新增成功。')
      }

      resetForm()
      await loadAdminWorkItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save work item.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(workItem: WorkItemListDto) {
    const shouldDelete = window.confirm(`確定要刪除「${workItem.title}」嗎？`)

    if (!shouldDelete) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await deleteWorkItem(workItem.id)
      setMessage(result.message || '刪除成功。')
      if (editingItem?.id === workItem.id) {
        resetForm()
      }
      await loadAdminWorkItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work item.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-layout">
      <section className="admin-panel" aria-label="Admin work item form">
        <div className="section-heading">
          <h2>{isEditing ? 'Edit Work Item' : 'New Work Item'}</h2>
          {isEditing && (
            <button type="button" className="link-action" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <form className="work-item-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Enter work item title"
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional detail for users"
              rows={5}
            />
          </label>

          <button
            type="submit"
            className="primary-action"
            disabled={!isFormValid || isSaving}
          >
            {isEditing ? 'Save changes' : 'Create item'}
          </button>
        </form>
      </section>

      <section className="admin-table-section" aria-label="Admin work item list">
        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Title</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Loading work items...
                  </td>
                </tr>
              ) : workItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    目前無待辦項目
                  </td>
                </tr>
              ) : (
                workItems.map((workItem) => (
                  <tr
                    key={workItem.id}
                    className={editingItem?.id === workItem.id ? 'selected-row' : ''}
                  >
                    <td>{workItem.id}</td>
                    <td className="title-cell">{workItem.title}</td>
                    <td>{formatDateTime(workItem.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="secondary-action"
                          disabled={isSaving}
                          onClick={() => void handleEdit(workItem)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          disabled={isSaving}
                          onClick={() => void handleDelete(workItem)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </section>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default App
