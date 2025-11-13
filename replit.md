# CARV Sudoku: AI vs Human

## Project Overview
A blockchain-powered Sudoku game built for the CARV SVM Hackathon. Play interactive 9x9 Sudoku puzzles with AI-powered hints, connect your Phantom wallet, solve puzzles on-chain (prepared for CARV Testnet), and mint "Sudoku Soul" NFTs as achievements.

## Features
- **Interactive 9x9 Sudoku Game**: HTML5 Canvas-based rendering with mobile-friendly touch controls
- **Phantom Wallet Integration**: Connect to Solana/CARV using @solana/web3.js (UI ready)
- **CARV AI Agent**: Get intelligent hints for selected cells (mock implementation showing possible numbers)
- **On-Chain Ready**: Backend APIs prepared for SVM program integration (currently using localStorage mock)
- **NFT Minting**: Celebrate puzzle completion with confetti and mint "Sudoku Soul" NFTs
- **Daily AI Challenge**: Compete against AI with special rewards
- **Global Leaderboard**: Track your times and compete with other players
- **Share to X**: Share your achievements with #CARVHackathon hashtag
- **Sound Effects**: Audio feedback for interactions (toggle on/off)
- **Dark Mode**: Full dark/light theme support
- **Mobile Responsive**: Optimized for both desktop and mobile gameplay

## Tech Stack
### Frontend
- React + TypeScript + Wouter routing
- TailwindCSS + Shadcn/UI components
- HTML5 Canvas for Sudoku grid rendering
- Canvas Confetti for celebrations
- TanStack Query for data fetching
- @solana/web3.js for wallet integration

### Backend
- Express.js API server
- In-memory storage (MemStorage) - prepared for database migration
- Zod validation schemas
- RESTful API endpoints

### Design System
- CARV Purple (#a855f7) primary branding
- Blockchain Blue and AI Cyan accents
- Inter + JetBrains Mono + Space Grotesk fonts
- Material Design + Gaming aesthetics

## API Endpoints
- `POST /api/puzzles/generate` - Generate new Sudoku puzzle
- `POST /api/puzzles/validate` - Validate puzzle solution
- `POST /api/hints/generate` - Get AI-powered hints for cells
- `GET /api/leaderboard` - Fetch global leaderboard
- `POST /api/leaderboard` - Submit completion time
- `POST /api/game-progress` - Save game state
- `GET /api/game-progress/:walletAddress` - Load saved game
- `POST /api/nft/mint` - Mint Sudoku Soul NFT (prepared for on-chain)
- `GET /api/nft/wallet/:walletAddress` - Get user's minted NFTs

## Project Structure
```
client/
  src/
    components/      # Reusable UI components
      SudokuCanvas.tsx    - Canvas-based game board
      WalletConnect.tsx   - Phantom wallet integration
      AIHintPanel.tsx     - AI hint interface
      NFTMintModal.tsx    - NFT minting flow
      Leaderboard.tsx     - Global rankings
      DailyChallenge.tsx  - Daily challenge UI
      NumberPad.tsx       - Number input controls
      GameStats.tsx       - Timer, mistakes, hints display
      ShareToX.tsx        - Social sharing button
    pages/
      home.tsx      - Main game page
    lib/
      sudoku.ts     - Sudoku generation & validation
      sounds.ts     - Sound effect manager
server/
  routes.ts         - API route handlers
  storage.ts        - Data storage interface
shared/
  schema.ts         - TypeScript types & Zod schemas
```

## Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Install Phantom wallet extension
4. Connect wallet and start playing!

## Gameplay Flow
1. **Connect Wallet**: Click "Connect Phantom" to link your Solana wallet
2. **Choose Difficulty**: Select Easy, Medium, or Hard puzzle
3. **Play Sudoku**: 
   - Tap/click cells to select them
   - Use number pad to fill in values
   - Toggle Notes mode for pencil marks
   - Request AI hints when stuck
4. **Complete Puzzle**: Fill all cells correctly to win
5. **Celebrate**: Enjoy confetti animation
6. **Mint NFT**: Mint your "Sudoku Soul" NFT on CARV Testnet
7. **Share**: Post your achievement to X with #CARVHackathon

## Future Enhancements (Post-Hackathon)
- Replace localStorage with actual CARV SVM on-chain program
- Implement real-time multiplayer competitive mode
- Advanced AI hint modes with varying costs
- Wallet-based player profiles and NFT gallery
- Comprehensive analytics dashboard
- Tournament system with prizes

## CARV SVM Integration Notes
Currently using localStorage for puzzle storage and validation. The backend API structure is designed to be drop-in compatible with CARV SVM programs:

- Puzzle generation can be replaced with on-chain random number generation
- Validation can leverage zero-knowledge proofs
- NFT minting ready for CARV Testnet deployment
- Leaderboard designed for on-chain verification

## Development Notes
- Canvas rendering optimized for high DPI displays
- Touch events handled for mobile gameplay
- LocalStorage used for game state persistence
- All components follow design_guidelines.md standards
- CARV purple branding throughout
- Responsive breakpoints for mobile/tablet/desktop

## Credits
Built for CARV SVM Hackathon by Replit Agent
Theme: Blockchain-powered gaming with AI assistance
