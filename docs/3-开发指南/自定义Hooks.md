# 自定义 Hooks 指南

编写可重用的 Hook，封装逻辑和状态，提高代码复用性。

---

## 基础概念

### Hook 规则

```typescript
// ✅ 正确：在函数顶部调用 Hook
function Component() {
  const [state, setState] = useState(0)
  const memoValue = useMemo(() => {}, [])
  return <div>{state}</div>
}

// ❌ 错误：在条件语句中调用
function BadComponent() {
  if (condition) {
    const [state, setState] = useState(0) // 错误！
  }
  return <div />
}

// ✅ 正确：提取到自定义 Hook
function useCustomLogic() {
  const [state, setState] = useState(0)
  if (condition) {
    // Hook 调用必须始终执行
  }
  return [state, setState]
}
```

---

## 常用 Hooks

### useUser - 获取当前用户

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/actions/user'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取用户失败'))
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error, refetch: fetchUser }
}

// 使用
export function UserGreeting() {
  const { user, loading } = useUser()

  if (loading) return <div>加载中...</div>
  return <div>欢迎, {user?.name}</div>
}
```

---

### useForm - 表单管理

```typescript
'use client'

import { useState, useCallback } from 'react'

interface FormState {
  [key: string]: string | number | boolean
}

interface FormErrors {
  [key: string]: string
}

export function useForm<T extends FormState>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  validate?: (values: T) => FormErrors
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target
      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }))
    },
    []
  )

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 验证
      if (validate) {
        const newErrors = validate(values)
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          return
        }
      }

      try {
        setIsSubmitting(true)
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, onSubmit, validate]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue: (field: string, value: any) =>
      setValues((prev) => ({ ...prev, [field]: value })),
  }
}

// 使用
export function SignUpForm() {
  const form = useForm(
    { email: '', password: '' },
    async (values) => {
      await signUp(values)
    },
    (values) => {
      const errors: FormErrors = {}
      if (!values.email) errors.email = '邮箱必填'
      if (!values.password) errors.password = '密码必填'
      return errors
    }
  )

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && (
        <span className="text-red-500">{form.errors.email}</span>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}
```

---

### useFetch - 数据获取和缓存

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'

interface UseFetchOptions {
  cacheTime?: number // 缓存时间（毫秒）
  refetchInterval?: number // 自动刷新时间
}

const cache = new Map<string, { data: any; timestamp: number }>()

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
) {
  const { cacheTime = 5 * 60 * 1000, refetchInterval } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<number>()

  useEffect(() => {
    const fetchData = async () => {
      // 检查缓存
      const cached = cache.get(url)
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const result = await response.json()

        // 缓存数据
        cache.set(url, {
          data: result,
          timestamp: Date.now(),
        })

        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('获取数据失败'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // 设置自动刷新
    if (refetchInterval) {
      intervalRef.current = window.setInterval(fetchData, refetchInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [url, cacheTime, refetchInterval])

  return { data, loading, error }
}

// 使用
export function PostList() {
  const { data: posts, loading, error } = useFetch('/api/posts')

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

---

### useDebounce - 防抖输入

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// 使用：搜索输入
export function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedTerm = useDebounce(searchTerm, 500)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!debouncedTerm) {
      setResults([])
      return
    }

    // 执行搜索
    searchAPI(debouncedTerm).then(setResults)
  }, [debouncedTerm])

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索用户..."
      />
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

### useLocalStorage - 本地存储

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

// 使用：保存用户偏好设置
export function ThemeSwitcher() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      当前主题: {theme}
    </button>
  )
}
```

---

### usePrevious - 获取上一个值

```typescript
'use client'

import { useEffect, useRef } from 'react'

export function usePrevious<T>(value: T) {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// 使用：检测值是否改变
export function ValueChanged({ value }: { value: string }) {
  const previousValue = usePrevious(value)
  const hasChanged = value !== previousValue

  return (
    <div>
      当前: {value}
      {previousValue && <p>之前: {previousValue}</p>}
      {hasChanged && <p className="text-red-500">值已改变</p>}
    </div>
  )
}
```

---

### useAsync - 异步操作管理

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('发生错误'),
      })
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, execute }
}

// 使用
export function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, execute } = useAsync(() =>
    fetch(`/api/users/${userId}`).then((r) => r.json())
  )

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {user && <div>{user.name}</div>}
      <button onClick={() => execute()}>刷新</button>
    </div>
  )
}
```

---

## 高级模式

### 组合多个 Hooks

```typescript
export function useUserWithPosts(userId: string) {
  const { user, loading: userLoading } = useUser(userId)
  const { data: posts, loading: postsLoading } = useFetch(
    user ? `/api/users/${userId}/posts` : null
  )

  return {
    user,
    posts,
    loading: userLoading || postsLoading,
  }
}
```

---

### Hook 工厂函数

```typescript
// 创建异步查询 Hook
function useQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options = {}
) {
  // 实现缓存、失败重试、后台刷新等
  // 类似 React Query 的 useQuery
}

// 创建多个相似的 Hooks
export const useGetUser = (id: string) => useQuery(['user', id], () => getUser(id))
export const useGetPosts = (userId: string) =>
  useQuery(['posts', userId], () => getPosts(userId))
```

---

## Hook 测试

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('应该初始化为 0', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('应该能增加计数', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })
})
```

---

## 最佳实践

✅ **清晰的命名:** 以 `use` 开头
✅ **单一职责:** 每个 Hook 做一件事
✅ **处理清理:** useEffect 返回清理函数
✅ **类型安全:** 使用 TypeScript 类型
✅ **文档化:** 添加 JSDoc 注释
✅ **可测试:** 易于单独测试

---

## 常见错误

```typescript
// ❌ 违反 Hook 规则
function BadComponent() {
  if (condition) {
    useEffect(() => {}) // 错误！
  }
}

// ❌ 忘记依赖项
useEffect(() => {
  console.log(value)
  // 忘记添加 value 到依赖项
}, [])

// ❌ 返回不稳定的对象
function useUser() {
  return { user: { id: '123' } } // 每次都创建新对象！
}

// ✅ 使用 useMemo 稳定化对象
function useUser() {
  return useMemo(() => ({ user: { id: '123' } }), [])
}
```

---

## 总结

✅ **useUser** - 获取当前用户
✅ **useForm** - 表单管理
✅ **useFetch** - 数据获取
✅ **useDebounce** - 防抖
✅ **useLocalStorage** - 本地存储
✅ **usePrevious** - 获取前一个值
✅ **useAsync** - 异步操作
✅ **组合 Hooks** - 灵活复用

---

**相关文档:**
- [表单处理完全指南](./表单处理完全指南.md)
- [组件设计指南](./组件设计指南.md)

**最后更新:** 2025-11-18
