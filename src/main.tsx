import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import { QueryClient } from '@tanstack/react-query'
import { EveFrontierProvider } from '@evefrontier/dapp-kit'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EveFrontierProvider queryClient={queryClient}>
      <Theme appearance="dark" accentColor="purple" radius="medium">
        <App />
      </Theme>
    </EveFrontierProvider>
  </StrictMode>,
)
