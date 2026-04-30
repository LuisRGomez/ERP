import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'

// Hook genérico de fetching: maneja loading, error y re-fetch
export function useQuery<T>(
  fetcher: (empresaId: string) => Promise<T>,
  deps: unknown[] = [],
) {
  const empresaId = useAuthStore(s => s.empresaId) ?? 'demo'
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetcher(empresaId)
      .then(setData)
      .catch(e => setError(e?.response?.data?.detail ?? 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [empresaId, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// Hook genérico de mutación: devuelve función + estado
export function useMutation<TIn, TOut>(
  mutator: (data: TIn) => Promise<TOut>,
) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (data: TIn): Promise<TOut | null> => {
    setSaving(true)
    setError(null)
    try {
      const result = await mutator(data)
      return result
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al guardar'
      setError(msg)
      return null
    } finally {
      setSaving(false)
    }
  }, [mutator])

  return { mutate, saving, error }
}
