# Tribe Command Center — Next Steps

## Immediate (Today)

1. **Initialize frontend project**
   ```bash
   cd tribe-command-center
   npm create vite@latest . -- --template react-ts
   ```

2. **Install core dependencies**
   ```bash
   npm install @evefrontier/dapp-kit @mysten/dapp-kit-react @mysten/dapp-kit-core @mysten/sui
   npm install @tanstack/react-query @radix-ui/themes zustand
   npm install @supabase/supabase-js
   npm install -D tailwindcss @tailwindcss/vite
   ```

3. **Set up Supabase project**
   - Create project at https://supabase.com
   - Run migration SQL from ARCHITECTURE_DRAFT.md
   - Get API keys (anon key + URL)
   - Create `.env.local` with keys

4. **Set up provider hierarchy**
   - EveFrontierProvider (wallet)
   - QueryClientProvider (TanStack)
   - Supabase client init

5. **Build wallet connect component**
   - Use builder-scaffold dApp as reference
   - Connect → read character data from chain

## Soon (Day 2-3)

6. **Build core features**
   - Dashboard page (tribe overview)
   - Goal CRUD (create, list, detail)
   - Task board (list tasks under goal, status management)
   - Pledge form (contribute resources to task)
   - Contribution tracking (progress bars)

7. **Supabase RLS policies**
   - Members can only CRUD within their tribe
   - Leaders/officers can create goals and tasks
   - Any member can pledge contributions

8. **Styling & UX polish**
   - Dark theme matching EVE Frontier aesthetic
   - Responsive layout
   - Loading states, empty states, error handling

## When Ready (Day 4-5)

9. **GitHub repo setup**
    - Push to GitHub
    - Write README with screenshots and setup instructions
    - Add LICENSE

10. **Demo video**
    - Record walkthrough: connect wallet → create goal → add tasks → pledge → track
    - Keep it under 3 minutes
    - Show the problem it solves, the solution, and the tech

11. **Submit on DeepSurge** (by March 31)

12. **Optional: Deploy to Stillness integration** (April 1-8)
    - If World API exposes tribe data, connect live
    - +10% bonus score
