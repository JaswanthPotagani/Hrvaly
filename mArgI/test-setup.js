import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global env or other needed services
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '',
}))
