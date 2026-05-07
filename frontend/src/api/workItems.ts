export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5091'

export type UserId = 'alice' | 'bob'

export type WorkItemListDto = {
  id: number
  title: string
  isConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export type WorkItemDetailDto = WorkItemListDto & {
  description?: string | null
}

export type WorkItemPayload = {
  title: string
  description?: string
}

type ApiMessageResponse = {
  message?: string
}

type ConfirmWorkItemsResponse = {
  confirmedCount: number
  message: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`

    try {
      const error = (await response.json()) as ApiMessageResponse
      message = error.message || message
    } catch {
      // Keep the status-based fallback message.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function getWorkItems(
  userId: UserId,
  sort: 'asc' | 'desc' = 'desc',
) {
  const params = new URLSearchParams({ userId, sort })

  return request<WorkItemListDto[]>(`/api/work-items?${params.toString()}`)
}

export async function confirmWorkItems(userId: UserId, workItemIds: number[]) {
  const params = new URLSearchParams({ userId })

  return request<ConfirmWorkItemsResponse>(
    `/api/work-items/confirm?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify({ workItemIds }),
    },
  )
}

export async function unconfirmWorkItem(userId: UserId, workItemId: number) {
  const params = new URLSearchParams({ userId })

  return request<ApiMessageResponse>(
    `/api/work-items/${workItemId}/unconfirm?${params.toString()}`,
    {
      method: 'POST',
    },
  )
}

export async function getAdminWorkItems() {
  return request<WorkItemListDto[]>('/api/admin/work-items')
}

export async function getWorkItemDetail(workItemId: number, userId: UserId | 'admin') {
  const params = new URLSearchParams({ userId })

  return request<WorkItemDetailDto>(
    `/api/work-items/${workItemId}?${params.toString()}`,
  )
}

export async function createWorkItem(payload: WorkItemPayload) {
  return request<WorkItemDetailDto>('/api/admin/work-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateWorkItem(workItemId: number, payload: WorkItemPayload) {
  return request<WorkItemDetailDto>(`/api/admin/work-items/${workItemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteWorkItem(workItemId: number) {
  return request<ApiMessageResponse>(`/api/admin/work-items/${workItemId}`, {
    method: 'DELETE',
  })
}
