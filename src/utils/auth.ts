const AUTH_KEY = 'taskCalendar_auth'

export interface StoredUser {
  id: string
  username: string
  displayName: string
  passwordHash: string
  createdAt: string
  avatarColor: string
}

interface AuthStore {
  users: StoredUser[]
  currentUserId: string | null
}

const AVATAR_COLORS = [
  '#7c3aed', '#4f46e5', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#7c3aed',
]

function defaultStore(): AuthStore {
  return { users: [], currentUserId: null }
}

function loadStore(): AuthStore {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : defaultStore()
  } catch {
    return defaultStore()
  }
}

function saveStore(store: AuthStore) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(store))
}

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function signUp(
  username: string,
  displayName: string,
  password: string
): Promise<{ user: StoredUser } | { error: string }> {
  const store = loadStore()
  const normalised = username.trim().toLowerCase()

  if (!normalised || normalised.length < 2) return { error: 'Username must be at least 2 characters.' }
  if (!/^[a-z0-9_]+$/.test(normalised)) return { error: 'Username may only contain letters, numbers and underscores.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }
  if (store.users.find(u => u.username === normalised)) return { error: 'That username is already taken.' }

  const user: StoredUser = {
    id: generateId(),
    username: normalised,
    displayName: displayName.trim() || username,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    avatarColor: AVATAR_COLORS[store.users.length % AVATAR_COLORS.length],
  }

  store.users.push(user)
  store.currentUserId = user.id
  saveStore(store)
  return { user }
}

export async function logIn(
  username: string,
  password: string
): Promise<{ user: StoredUser } | { error: string }> {
  const store = loadStore()
  const normalised = username.trim().toLowerCase()
  const user = store.users.find(u => u.username === normalised)

  if (!user) return { error: 'No account found with that username.' }

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) return { error: 'Incorrect password.' }

  store.currentUserId = user.id
  saveStore(store)
  return { user }
}

export function logOut() {
  const store = loadStore()
  store.currentUserId = null
  saveStore(store)
}

export function getCurrentUser(): StoredUser | null {
  const store = loadStore()
  if (!store.currentUserId) return null
  return store.users.find(u => u.id === store.currentUserId) ?? null
}

export function dataKey(userId: string): string {
  return `taskCalendar_v1_${userId}`
}
