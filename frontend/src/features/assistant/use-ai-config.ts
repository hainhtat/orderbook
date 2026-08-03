import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAiConfig, updateAiConfig } from '@/features/assistant/api'

export const aiConfigKey = ['ai', 'config'] as const

export function useAiConfig() {
  return useQuery({
    queryKey: aiConfigKey,
    queryFn: fetchAiConfig,
  })
}

export function useUpdateAiConfig() {
  const queryClient = useQueryClient()
  return async (isEnabled: boolean) => {
    const config = await updateAiConfig(isEnabled)
    queryClient.setQueryData(aiConfigKey, config)
    return config
  }
}
