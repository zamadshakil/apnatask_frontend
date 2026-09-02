# Project: ApnaTask Mobile Frontend

## Architecture
ApnaTask is a hyperlocal services marketplace mobile application frontend built using React Native and Expo. It interfaces with the FastAPI backend to offer real-time job matching, provider wallet operations, and live chat-based price negotiation.

### Code Layout
```
/apnatask_frontend
├── .agents/                    # Coordination metadata (no source code here)
├── assets/                     # App icons, splash screens, and images
├── src/                        # Main application source
│   ├── components/             # Reusable UI components (buttons, cards, inputs)
│   │   ├── Button.tsx          # Custom WhatsApp-style buttons
│   │   ├── Card.tsx            # Custom cards (Booking, Bid, Wallet)
│   │   ├── ChatBubble.tsx      # WhatsApp-inspired chat bubble (sender/receiver)
│   │   └── Input.tsx           # Form text inputs
│   ├── styles/                 # Theme, colors, and typography settings
│   │   └── theme.ts            # Emerald Green & Dark Slate color tokens
│   ├── navigation/             # App navigation configuration
│   │   ├── AppNavigator.tsx    # Root navigator (Auth, Customer, Provider)
│   │   ├── CustomerTab.tsx     # Customer workspace tab navigation
│   │   └── ProviderTab.tsx     # Provider workspace tab navigation
│   ├── screens/                # App screens
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx # Screen to switch/select user role and get mock JWT
│   │   ├── customer/
│   │   │   ├── CreateTaskScreen.tsx      # Upload booking request (budget, description, category)
│   │   │   ├── ActiveBookingsScreen.tsx  # View posted requests, bids, and KYC verification badges
│   │   │   └── CustomerNegotiationScreen.tsx # Real-time chat & bidding room with WebSockets
│   │   └── provider/
│   │       ├── WalletScreen.tsx          # View balance and simulate "Add Money" top-up
│   │       ├── FindJobsScreen.tsx        # View nearby jobs from geospatial matching
│   │       └── ProviderNegotiationScreen.tsx # Real-time chat & bidding room with WebSockets
│   ├── services/               # API clients and WebSocket service
│   │   ├── api.ts              # Axios wrapper for REST API endpoints
│   │   └── websocket.ts        # WebSocket client for negotiation rooms
│   └── utils/                  # Reusable utilities (formatting, validations)
├── App.tsx                     # Entry point for the React Native/Expo app
├── package.json                # Project dependencies and script configurations
├── tsconfig.json               # TypeScript configuration
└── PROJECT.md                  # Project index (this file)
```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Scaffold & Navigation Setup | Set up React Native / Expo environment, install dependencies, establish customer/provider tab navigation screens skeleton. | None | DONE |
| M2 | Brand Identity & Styling | Implement design system (WhatsApp colors, typography, buttons, inputs, chat bubbles). | M1 | DONE |
| M3 | Customer Workspace Screens | Create Task, Active Bookings, and Customer Bidding screens. | M2 | DONE |
| M4 | Provider Workspace & Wallet | Wallet, nearby jobs, provider bidding, and wallet guardrails. | M2 | DONE |
| M5 | Backend REST & WS Integration | Supabase auth, booking/job/wallet REST APIs, and real-time negotiation WebSockets. | M3, M4 | IN PROGRESS — live provider GPS updates remain |
| M6 | Final E2E Pass & Hardening | Automated integration/E2E tests, type checking, device and live-backend validation. | M5 | IN PROGRESS — 44 tests and TypeScript pass; device validation remains |

## Interface Contracts
- **Visual Colors**:
  - Primary Emerald: `#075E54`
  - Secondary Emerald: `#128C7E`
  - Light Green Accent: `#25D366`
  - Dark Slate Accent: `#1F2C34` (dark backgrounds, headers)
  - Chat Bubble Sent: `#DCF8C6`
  - Chat Bubble Received: `#FFFFFF`
- **Geospatial Location REST API integration**:
  - `POST /api/v1/provider/location`: Provider sends current coordinates (pending mobile wiring).
  - `GET /api/v1/jobs?category=<category>`: Fetch open jobs for a provider.
- **WebSocket Bidding Room integration**:
  - `WS /api/v1/ws/negotiation?token=<JWT>&booking_id=<booking_id>`
  - Frame Format: `{ "type": "bid" | "chat" | "accept", "booking_id": int, "sender_id": int, "role": "customer" | "provider", "amount": float, "message": str }`
- **Wallet Guardrail**:
  - Minimum wallet balance required to bid on a task: **100 PKR** (or configured minimum fee).
