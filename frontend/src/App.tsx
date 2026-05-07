import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  API_BASE_URL,
  confirmWorkItems,
  createWorkItem,
  deleteWorkItem,
  getAdminWorkItems,
  getTags,
  getWorkItemDetail,
  getWorkItems,
  type TagDto,
  type UserId,
  type WorkItemDetailDto,
  type WorkItemListDto,
  unconfirmWorkItem,
  updateWorkItem,
} from './api/workItems'
import './App.css'

const users: UserId[] = ['alice', 'bob']
const pageSize = 5

type SortDirection = 'asc' | 'desc'

type AppRoute =
  | { name: 'front-list' }
  | { name: 'front-detail'; id: number }
  | { name: 'admin-list' }
  | { name: 'admin-new' }
  | { name: 'admin-edit'; id: number }

type WorkItemFormState = {
  title: string
  description: string
  tagIds: number[]
}

const emptyForm: WorkItemFormState = {
  title: '',
  description: '',
  tagIds: [],
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute())

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute())

    window.addEventListener('popstate', handlePopState)

    if (window.location.pathname === '/') {
      navigateTo('/work-items', { replace: true })
      setRoute(parseRoute())
    }

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path: string) {
    navigateTo(path)
    setRoute(parseRoute())
  }

  const isAdmin = route.name.startsWith('admin')
  const title = route.name === 'front-detail'
    ? 'Work Item Detail'
    : isAdmin
      ? 'Admin Dashboard'
      : 'Work Items'
  const subtitle = isAdmin
    ? 'Manage the backlog used by front-office users.'
    : 'Track personal confirmation progress across assigned work items.'

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark">MW</div>
          <div>
            <p className="brand-kicker">Issue tracker</p>
            <strong>My Work Item</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={!isAdmin ? 'active' : ''}
            onClick={() => navigate('/work-items')}
          >
            <span className="nav-icon">WI</span>
            Front work
          </button>
          <button
            type="button"
            className={isAdmin ? 'active' : ''}
            onClick={() => navigate('/admin/work-items')}
          >
            <span className="nav-icon">AD</span>
            Admin
          </button>
        </nav>

        <div className="sidebar-card">
          <span>API</span>
          <a href={API_BASE_URL} target="_blank" rel="noreferrer">
            {API_BASE_URL.replace('http://', '')}
          </a>
        </div>
      </aside>

      <main className="app-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">{isAdmin ? 'Back office' : 'Front office'}</p>
            <h1>{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="header-meta">
            <span className="environment-pill">Local demo</span>
            <nav className="view-switcher" aria-label="Application views">
              <button
                type="button"
                className={!isAdmin ? 'active' : ''}
                onClick={() => navigate('/work-items')}
              >
                Front
              </button>
              <button
                type="button"
                className={isAdmin ? 'active' : ''}
                onClick={() => navigate('/admin/work-items')}
              >
                Admin
              </button>
            </nav>
          </div>
        </header>

        {route.name === 'front-detail' ? (
          <WorkItemDetail id={route.id} onNavigate={navigate} />
        ) : route.name === 'admin-list' ||
          route.name === 'admin-new' ||
          route.name === 'admin-edit' ? (
          <AdminWorkItems route={route} onNavigate={navigate} />
        ) : (
          <FrontWorkItems onNavigate={navigate} />
        )}
      </main>
    </div>
  )
}

function FrontWorkItems({ onNavigate }: { onNavigate: (path: string) => void }) {
  const query = new URLSearchParams(window.location.search)
  const [userId, setUserId] = useState<UserId>(parseUserId(query.get('userId')))
  const [sort, setSort] = useState<SortDirection>(parseSort(query.get('sort')))
  const [page, setPage] = useState(parsePage(query.get('page')))
  const [workItems, setWorkItems] = useState<WorkItemListDto[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const confirmedCount = workItems.filter((workItem) => workItem.isConfirmed).length
  const pendingCount = workItems.length - confirmedCount
  const totalPages = Math.max(1, Math.ceil(workItems.length / pageSize))
  const visibleItems = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * pageSize

    return workItems.slice(startIndex, startIndex + pageSize)
  }, [page, totalPages, workItems])

  const allSelected = useMemo(() => {
    return visibleItems.length > 0 && visibleItems.every((item) => selectedIds.includes(item.id))
  }, [selectedIds, visibleItems])

  async function loadWorkItems(nextUserId = userId, nextSort = sort) {
    setIsLoading(true)
    setError('')

    try {
      const data = await getWorkItems(nextUserId, nextSort)
      setWorkItems(data)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkItems(userId, sort)
  }, [userId, sort])

  useEffect(() => {
    const nextPage = Math.min(page, totalPages)

    if (nextPage !== page) {
      setPage(nextPage)
    }
  }, [page, totalPages])

  function updateListState(nextUserId: UserId, nextSort: SortDirection, nextPage: number) {
    setUserId(nextUserId)
    setSort(nextSort)
    setPage(nextPage)
    onNavigate(buildWorkItemsPath(nextUserId, nextSort, nextPage))
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds((currentIds) => {
      const visibleIds = visibleItems.map((workItem) => workItem.id)

      if (checked) {
        return Array.from(new Set([...currentIds, ...visibleIds]))
      }

      return currentIds.filter((id) => !visibleIds.includes(id))
    })
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
      await loadWorkItems(userId, sort)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm work items.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUnconfirm(workItem: WorkItemListDto) {
    const shouldUnconfirm = window.confirm(
      `Mark "${workItem.title}" back to pending?`,
    )

    if (!shouldUnconfirm) {
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const result = await unconfirmWorkItem(userId, workItem.id)
      setMessage(result.message || 'Work item marked as pending.')
      await loadWorkItems(userId, sort)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unconfirm work item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openDetail(workItemId: number) {
    onNavigate(`/work-items/${workItemId}${window.location.search}`)
  }

  return (
    <>
      <section className="summary-grid" aria-label="Work item summary">
        <SummaryCard label="Total issues" value={workItems.length} tone="neutral" />
        <SummaryCard label="Pending" value={pendingCount} tone="warning" />
        <SummaryCard label="Confirmed" value={confirmedCount} tone="success" />
      </section>

      <section className="panel">
        <div className="toolbar" aria-label="Work item controls">
          <div className="control-group">
            <div className="user-switcher" aria-label="Select user">
              {users.map((user) => (
                <button
                  key={user}
                  type="button"
                  className={userId === user ? 'active' : ''}
                  onClick={() => updateListState(user, sort, 1)}
                >
                  {user}
                </button>
              ))}
            </div>

            <label className="select-control">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(event) =>
                  updateListState(userId, event.target.value as SortDirection, 1)
                }
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            className="primary-action"
            disabled={selectedIds.length === 0 || isSubmitting}
            onClick={handleConfirmSelected}
          >
            Confirm selected
          </button>
        </div>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="table-wrap">
          <table className="issue-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    aria-label="Select all work items on this page"
                    checked={allSelected}
                    disabled={visibleItems.length === 0}
                    onChange={(event) => handleSelectAll(event.target.checked)}
                  />
                </th>
                <th>Key</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Labels</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Loading work items...
                  </td>
                </tr>
              ) : workItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No work items yet.
                  </td>
                </tr>
              ) : (
                visibleItems.map((workItem) => (
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
                    <td>
                      <span className="issue-key">{formatIssueKey(workItem.id)}</span>
                    </td>
                    <td className="title-cell">
                      <button
                        type="button"
                        className="issue-title-button"
                        onClick={() => openDetail(workItem.id)}
                      >
                        {workItem.title}
                      </button>
                    </td>
                    <td>
                      <StatusBadge isConfirmed={workItem.isConfirmed} />
                    </td>
                    <td>
                      <TagList tags={workItem.tags} fallback={userId} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => openDetail(workItem.id)}
                        >
                          View
                        </button>
                        {workItem.isConfirmed ? (
                          <button
                            type="button"
                            className="secondary-action"
                            disabled={isSubmitting}
                            onClick={() => void handleUnconfirm(workItem)}
                          >
                            Reopen
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(nextPage) => updateListState(userId, sort, nextPage)}
        />
      </section>
    </>
  )
}

function WorkItemDetail({
  id,
  onNavigate,
}: {
  id: number
  onNavigate: (path: string) => void
}) {
  const query = new URLSearchParams(window.location.search)
  const userId = parseUserId(query.get('userId'))
  const sort = parseSort(query.get('sort'))
  const page = parsePage(query.get('page'))
  const [workItem, setWorkItem] = useState<WorkItemDetailDto | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadDetail() {
      setIsLoading(true)
      setError('')

      try {
        const detail = await getWorkItemDetail(id, userId)
        setWorkItem(detail)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load detail.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDetail()
  }, [id, userId])

  return (
    <section className="detail-panel">
      <button
        type="button"
        className="secondary-action"
        onClick={() => onNavigate(buildWorkItemsPath(userId, sort, page))}
      >
        Back to list
      </button>

      {error && <div className="notice error">{error}</div>}

      {isLoading ? (
        <div className="empty-state">Loading work item detail...</div>
      ) : workItem ? (
        <>
          <div className="detail-hero">
            <span className="issue-key">{formatIssueKey(workItem.id)}</span>
            <h2>{workItem.title}</h2>
            <StatusBadge isConfirmed={workItem.isConfirmed} />
          </div>

          <dl className="detail-grid">
            <div>
              <dt>ID</dt>
              <dd>{workItem.id}</dd>
            </div>
            <div>
              <dt>Title</dt>
              <dd>{workItem.title}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{workItem.description || 'No description'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge isConfirmed={workItem.isConfirmed} />
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(workItem.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDateTime(workItem.updatedAt)}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </section>
  )
}

function AdminWorkItems({
  route,
  onNavigate,
}: {
  route: Extract<AppRoute, { name: 'admin-list' | 'admin-new' | 'admin-edit' }>
  onNavigate: (path: string) => void
}) {
  const [workItems, setWorkItems] = useState<WorkItemListDto[]>([])
  const [tags, setTags] = useState<TagDto[]>([])
  const [form, setForm] = useState<WorkItemFormState>(emptyForm)
  const [editingItem, setEditingItem] = useState<WorkItemDetailDto | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = route.name === 'admin-edit'
  const isFormVisible = route.name === 'admin-new' || route.name === 'admin-edit'
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
    void loadTags()
  }, [])

  async function loadTags() {
    try {
      const data = await getTags()
      setTags(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags.')
    }
  }

  useEffect(() => {
    async function loadEditItem(id: number) {
      setMessage('')
      setError('')

      try {
        const detail = await getWorkItemDetail(id, 'admin')
        setEditingItem(detail)
        setForm({
          title: detail.title,
          description: detail.description ?? '',
          tagIds: detail.tags.map((tag) => tag.id),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load work item detail.')
      }
    }

    if (route.name === 'admin-edit') {
      void loadEditItem(route.id)
    } else if (route.name === 'admin-new') {
      setEditingItem(null)
      setForm(emptyForm)
    } else {
      setEditingItem(null)
      setForm(emptyForm)
    }
  }, [route])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isFormValid) {
      setError('Title is required.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      tagIds: form.tagIds,
    }

    try {
      if (route.name === 'admin-edit' && editingItem) {
        await updateWorkItem(editingItem.id, payload)
        setMessage('Work item updated.')
      } else {
        await createWorkItem(payload)
        setMessage('Work item created.')
      }

      setForm(emptyForm)
      setEditingItem(null)
      onNavigate('/admin/work-items')
      await loadAdminWorkItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save work item.')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleTag(tagId: number, checked: boolean) {
    setForm((current) => ({
      ...current,
      tagIds: checked
        ? Array.from(new Set([...current.tagIds, tagId]))
        : current.tagIds.filter((id) => id !== tagId),
    }))
  }

  async function handleDelete(workItem: WorkItemListDto) {
    const shouldDelete = window.confirm(`Delete "${workItem.title}"?`)

    if (!shouldDelete) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await deleteWorkItem(workItem.id)
      setMessage(result.message || 'Work item deleted.')
      if (editingItem?.id === workItem.id) {
        onNavigate('/admin/work-items')
      }
      await loadAdminWorkItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work item.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={isFormVisible ? 'admin-layout' : 'admin-layout list-only'}>
      {isFormVisible ? (
        <section className="admin-panel" aria-label="Admin work item form">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Admin form</p>
              <h2>{isEditing ? 'Edit work item' : 'New work item'}</h2>
            </div>
            <button
              type="button"
              className="link-action"
              onClick={() => onNavigate('/admin/work-items')}
            >
              Cancel
            </button>
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

            <fieldset className="tag-fieldset">
              <legend>Labels</legend>
              {tags.length === 0 ? (
                <span className="muted">No labels configured.</span>
              ) : (
                <div className="tag-picker">
                  {tags.map((tag) => (
                    <label key={tag.id} className="tag-option">
                      <input
                        type="checkbox"
                        checked={form.tagIds.includes(tag.id)}
                        onChange={(event) => toggleTag(tag.id, event.target.checked)}
                      />
                      <span className={`tag-chip ${getTagToneClass(tag.color)}`}>
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <button
              type="submit"
              className="primary-action"
              disabled={!isFormValid || isSaving}
            >
              {isEditing ? 'Save changes' : 'Create item'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="admin-table-section panel" aria-label="Admin work item list">
        <div className="toolbar">
          <div className="section-heading compact">
            <div>
              <p className="section-kicker">Backlog configuration</p>
              <h2>Work item management</h2>
            </div>
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={() => onNavigate('/admin/work-items/new')}
          >
            New work item
          </button>
        </div>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="table-wrap">
          <table className="issue-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Title</th>
                <th>Updated</th>
                <th>Labels</th>
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
                    No work items yet.
                  </td>
                </tr>
              ) : (
                workItems.map((workItem) => (
                  <tr
                    key={workItem.id}
                    className={route.name === 'admin-edit' && route.id === workItem.id ? 'selected-row' : ''}
                  >
                    <td>
                      <span className="issue-key">{formatIssueKey(workItem.id)}</span>
                    </td>
                    <td className="title-cell">{workItem.title}</td>
                    <td>{formatDateTime(workItem.updatedAt)}</td>
                    <td>
                      <TagList tags={workItem.tags} fallback="untagged" />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="secondary-action"
                          disabled={isSaving}
                          onClick={() => onNavigate(`/admin/work-items/${workItem.id}/edit`)}
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'neutral' | 'warning' | 'success'
}) {
  return (
    <article className={`summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function TagList({ tags, fallback }: { tags: TagDto[]; fallback: string }) {
  if (tags.length === 0) {
    return (
      <div className="tag-row">
        <span className="tag-chip muted-tag">{fallback}</span>
      </div>
    )
  }

  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <span key={tag.id} className={`tag-chip ${getTagToneClass(tag.color)}`}>
          {tag.name}
        </span>
      ))}
    </div>
  )
}

function getTagToneClass(color: string) {
  return `tag-${color.toLowerCase()}`
}

function StatusBadge({ isConfirmed }: { isConfirmed: boolean }) {
  return (
    <span className={isConfirmed ? 'status confirmed' : 'status pending'}>
      {isConfirmed ? 'Confirmed' : 'Pending'}
    </span>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav className="pagination" aria-label="Work item pagination">
      <button
        type="button"
        className="secondary-action"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        className="secondary-action"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}

function parseRoute(): AppRoute {
  const path = window.location.pathname
  const detailMatch = path.match(/^\/work-items\/(\d+)$/)
  const adminEditMatch = path.match(/^\/admin\/work-items\/(\d+)\/edit$/)

  if (detailMatch) {
    return { name: 'front-detail', id: Number(detailMatch[1]) }
  }

  if (path === '/admin/work-items/new') {
    return { name: 'admin-new' }
  }

  if (adminEditMatch) {
    return { name: 'admin-edit', id: Number(adminEditMatch[1]) }
  }

  if (path === '/admin/work-items') {
    return { name: 'admin-list' }
  }

  return { name: 'front-list' }
}

function navigateTo(path: string, options: { replace?: boolean } = {}) {
  if (options.replace) {
    window.history.replaceState(null, '', path)
    return
  }

  window.history.pushState(null, '', path)
}

function buildWorkItemsPath(userId: UserId, sort: SortDirection, page: number) {
  const params = new URLSearchParams({
    userId,
    sort,
    page: String(page),
  })

  return `/work-items?${params.toString()}`
}

function parseUserId(value: string | null): UserId {
  return value === 'bob' ? 'bob' : 'alice'
}

function parseSort(value: string | null): SortDirection {
  return value === 'asc' ? 'asc' : 'desc'
}

function parsePage(value: string | null) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

function formatIssueKey(id: number) {
  return `MWI-${id}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default App
