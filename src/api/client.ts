import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Use your machine's LAN IP when testing on a physical device.
// localhost will NOT work on Android — it points to the emulator.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.104:3000/api/v1'

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (cfg) => {
  const token = await AsyncStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

let refreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err)

    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((t) => {
        orig.headers.Authorization = `Bearer ${t}`
        return api(orig)
      })
    }

    orig._retry = true
    refreshing = true
    try {
      const refresh = await AsyncStorage.getItem('refresh')
      if (!refresh) throw new Error('no refresh token')
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh })
      const token = data.data.tokens.accessToken
      await AsyncStorage.setItem('token', token)
      queue.forEach((q) => q.resolve(token))
      queue = []
      orig.headers.Authorization = `Bearer ${token}`
      return api(orig)
    } catch (e) {
      queue.forEach((q) => q.reject(e))
      queue = []
      await AsyncStorage.multiRemove(['token', 'refresh', 'user'])
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  }
)

export default api
