import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Route modules are loaded asynchronously in production. Give cold parallel
// Vitest workers enough time to resolve those chunks before async assertions.
configure({ asyncUtilTimeout: 3_000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
