'use client'

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import axios, {
  AxiosResponse,
  InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from 'axios'

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.VITE_BACKEND_URL ??
  'https://stellar-minds-api-v2.vercel.app'
console.log('BASE_URL:', BASE_URL)

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

type HttpMethod = 'get' | 'post' | 'put' | 'delete'
type EndpointMethod = (...args: any[]) => Promise<AxiosResponse<any> | undefined> | void

interface BaseEndpointMethods {
  getAll: (params?: string) => Promise<AxiosResponse<any> | undefined>
  getById: (id: string | number, params?: string) => Promise<AxiosResponse<any> | undefined>
  create: (body: unknown, params?: string) => Promise<AxiosResponse<any> | undefined>
  update: (id: string | number, body: unknown) => Promise<AxiosResponse<any> | undefined>
  delete: (id: string | number) => Promise<AxiosResponse<any> | undefined>
}

type EndpointGroup = BaseEndpointMethods & Record<string, EndpointMethod>

interface ApiMethods {
  get<T = unknown>(url: string): Promise<AxiosResponse<T> | undefined>
  post<T = unknown>(url: string, data?: unknown): Promise<AxiosResponse<T> | undefined>
  put<T = unknown>(url: string, data?: unknown): Promise<AxiosResponse<T> | undefined>
  delete<T = unknown>(url: string): Promise<AxiosResponse<T> | undefined>
}

interface AuthAPI {
  login: (body: unknown) => Promise<AxiosResponse<any> | undefined>
  register: (body: unknown) => Promise<AxiosResponse<any> | undefined>
  logout: () => Promise<AxiosResponse<any> | undefined>
}

interface AssaysAPI {
  search: <T = unknown>(query: string) => Promise<AxiosResponse<T> | undefined>
}

interface ChatAPI {
  create: () => Promise<AxiosResponse<{ chat_uuid: string }> | undefined>
  sendMessage: (
    chatUuid: string,
    body: { message: string; metodo: string },
  ) => Promise<AxiosResponse<{ answer: string }> | undefined>
}

export interface APIContextValue {
  wikis: EndpointGroup
  articles: EndpointGroup
  comments: EndpointGroup
  media: EndpointGroup
  notifications: EndpointGroup
  users: EndpointGroup
  authAPI: AuthAPI
  assays: AssaysAPI
  chat: ChatAPI
  axios: ApiMethods
}

const APIContext = createContext<APIContextValue | undefined>(undefined)

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = obtenerToken()
    if (token) {
      const headers = config.headers ?? {}
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      config.headers = headers
    }
    return config
  },
  (error) => Promise.reject(error),
)

function obtenerToken(): string | null {
  if (typeof window === 'undefined') return null
  const localToken = window.localStorage.getItem('oauth_token')
  if (localToken) {
    return localToken
  }
  return obtenerTokenDeCookie('oauth_token')
}

function obtenerTokenDeCookie(nombreCookie: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [nombre, valor] = cookie.trim().split('=')
    if (nombre === nombreCookie) {
      return decodeURIComponent(valor)
    }
  }
  return null
}

export const APIProvider = ({ children }: PropsWithChildren) => {
  const [loadCount, setLoadCount] = useState<number>(0)

  const setLoading = (val: boolean) =>
    setLoadCount((oldCount) => {
      const newCount = oldCount + (val ? 1 : -1)
      return newCount < 0 ? 0 : newCount
    })

  useEffect(() => {
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
      loadingScreen.style.display = loadCount === 0 ? 'none' : 'block'
    }
  }, [loadCount])

  const requestHandler = async <T = unknown>(
    method: HttpMethod,
    url: string,
    data?: unknown,
  ): Promise<AxiosResponse<T> | undefined> => {
    console.log(`${method.toUpperCase()}: ${url}`)
    if (data) console.log('Body', data)

    setLoading(true)

    try {
      const config: AxiosRequestConfig = { method, url, data }
      const response = await apiClient.request<T>(config)
      return response
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error.response)
        return error.response
      }
      console.error(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const apiMethods: ApiMethods = {
    get: (url) => requestHandler('get', url),
    post: (url, data) => requestHandler('post', url, data),
    put: (url, data) => requestHandler('put', url, data),
    delete: (url) => requestHandler('delete', url),
  }

  const createEndpointMethods = (
    entity: string,
    version = 'v2',
    extraEndpoints?: Record<string, EndpointMethod>,
  ): EndpointGroup => ({
    getAll: (params = '') => apiMethods.get(`${BASE_URL}/api/${version}/${entity}${params}`),
    getById: (id, params = '') =>
      apiMethods.get(`${BASE_URL}/api/${version}/${entity}/${id}${params}`),
    create: (body, params = '') => apiMethods.post(`${BASE_URL}/api/${version}/${entity}${params}`, body),
    update: (id, body) => apiMethods.put(`${BASE_URL}/api/${version}/${entity}/${id}`, body),
    delete: (id) => apiMethods.delete(`${BASE_URL}/api/${version}/${entity}/${id}`),
    ...(extraEndpoints ?? {}),
  })

  const wikisAPI = createEndpointMethods('wikis', 'v3', {
    getRandom: () => apiMethods.get(`${BASE_URL}/api/v3/wikis/random`),
  })

  const articlesAPI = createEndpointMethods('articles', 'v3', {
    getVersions: (id, params = '') =>
      apiMethods.get(`${BASE_URL}/api/v3/articles/${id}/versions${params}`),
    getContributors: (id, params = '') =>
      apiMethods.get(`${BASE_URL}/api/v3/articles/${id}/contributors${params}`),
    restoreVersion: (id) => apiMethods.post(`${BASE_URL}/api/v3/articles/${id}/restore-version`),
    translate: (body) => apiMethods.post(`${BASE_URL}/api/v3/articles/translate`, body),
  })

  const commentsAPI = createEndpointMethods('comments', 'v3')

  const notificationsAPI = createEndpointMethods('notifications', 'v2', {
    markAsRead: (id) => apiMethods.put(`${BASE_URL}/api/v2/notifications/mark-read/${id}`),
  })

  const mediaAPI = createEndpointMethods('media', 'v3', {
    update: () => alert('Method not available'),
    delete: () => alert('Method not available'),
  })

  const usersAPI = createEndpointMethods('users', 'v2', {
    login: () => apiMethods.get(`${BASE_URL}/api/v2/users/login`),
    rate: (id, review) => apiMethods.post(`${BASE_URL}/api/v2/users/${id}/review`, review),
  })

  const authAPI: AuthAPI = {
    login: (body) => apiMethods.post(`${BASE_URL}/login`, body),
    register: (body) => apiMethods.post(`${BASE_URL}/register`, body),
    logout: () => apiMethods.post(`${BASE_URL}/logout`),
  }

  const assaysAPI: AssaysAPI = {
    search: (query) => apiMethods.get(`/assays/search?q=${encodeURIComponent(query)}`),
  }

  const chatAPI: ChatAPI = {
    create: () => apiMethods.get(`${BASE_URL}/api/v1/chats`),
    sendMessage: (chatUuid, body) =>
      apiMethods.post(`${BASE_URL}/api/v1/chats/${chatUuid}/messages`, body),
  }

  return (
    <APIContext.Provider
      value={{
        wikis: wikisAPI,
        articles: articlesAPI,
        comments: commentsAPI,
        media: mediaAPI,
        notifications: notificationsAPI,
        users: usersAPI,
        authAPI,
        assays: assaysAPI,
        chat: chatAPI,
        axios: apiMethods,
      }}
    >
      {children}
    </APIContext.Provider>
  )
}

export const useAPI = (): APIContextValue => {
  const context = useContext(APIContext)
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider')
  }
  return context
}
