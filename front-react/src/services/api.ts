const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(error.error || 'Erro na requisição'), { status: res.status, data: error })
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'NORMAL'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export const auth = {
  register: (data: { email: string; name: string; password: string; languages: string[] }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () =>
    request<{ user: AuthUser }>('/auth/me'),

  logout: (refreshToken: string) =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  updateProfile: (data: { name?: string; languages?: string[] }) =>
    request<{ user: AuthUser }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/password', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export type { Movie } from '../app/types'

export interface MoviesResponse {
  data: Movie[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface HomeResponse {
  featured: Movie[]
  recent: Movie[]
}

export const catalog = {
  list: (params?: { search?: string; genre?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.genre) q.set('genre', params.genre)
    if (params?.page) q.set('page', String(params.page))
    return request<MoviesResponse>(`/catalog/movies?${q}`)
  },

  home: () => request<HomeResponse>('/catalog/home'),

  get: (id: string) => request<Movie>(`/catalog/movies/${id}`),

  create: (data: { title: string; description: string; year: number; genre: string; idioma: string; featured?: boolean }) =>
    request<Movie>('/catalog/movies', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Movie>) =>
    request<Movie>(`/catalog/movies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string) =>
    request(`/catalog/movies/${id}`, { method: 'DELETE' }),
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export const storage = {
  uploadVideo: (movieId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ movieId: string; objectName: string }>(`/storage/upload/video?movieId=${movieId}`, {
      method: 'POST',
      body: form,
    })
  },

  uploadPoster: (movieId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ movieId: string; objectName: string }>(`/storage/upload/poster?movieId=${movieId}`, {
      method: 'POST',
      body: form,
    })
  },

  getStreamUrl: (movieId: string) =>
    request<{ url: string }>(`/storage/stream/${movieId}`),

  getPosterUrl: (movieId: string) =>
    request<{ url: string }>(`/storage/poster/${movieId}`),
}

// ─── Subtitles ────────────────────────────────────────────────────────────────

export interface SubtitleTrack {
  id: string
  movie_id: string
  language: string
  language_label: string
  status: string
  source: string
}

export const subtitles = {
  list: (movieId: string) =>
    request<SubtitleTrack[]>(`/subtitles/${movieId}`),

  getContent: (movieId: string, language: string) =>
    request<{ content: string; language: string; language_label: string }>(`/subtitles/${movieId}/${language}`),

  status: (movieId: string) =>
    request<{ movie_id: string; total: number; languages: Array<{ language: string; status: string }> }>(
      `/subtitles/${movieId}/status`
    ),
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface Plan {
  id: string
  name: string
  description: string
  priceMonthly: number
  features: string[]
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  plan: Plan
  status: string
  startedAt: string
  expiresAt: string | null
}

export const subscriptions = {
  plans: () => request<{ plans: Plan[] }>('/subscriptions/plans'),
  me: () => request<{ subscription: Subscription | null }>('/subscriptions/me'),
  subscribe: (planId: string) =>
    request<{ subscription: Subscription }>('/subscriptions', { method: 'POST', body: JSON.stringify({ planId }) }),
  cancel: (id: string) =>
    request(`/subscriptions/${id}/cancel`, { method: 'PATCH' }),
}

// ─── AI Jobs ──────────────────────────────────────────────────────────────────

export interface AIJob {
  id: string
  movie_id: string
  status: string
  source_language: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export const ai = {
  jobs: () => request<AIJob[]>('/ai/jobs'),
  job: (id: string) => request<AIJob>(`/ai/jobs/${id}`),
  describe: (params: { title: string; description?: string; genre?: string; year?: string; idioma?: string }) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
    return request<{ message: string }>(`/ai/describe?${q}`)
  },
}
