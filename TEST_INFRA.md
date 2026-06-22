# E2E Test Infra: ApnaTask Mobile Frontend

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: The tests will exercise the application from the user's perspective, using either Expo Web + Playwright or Jest Integration Tests with React Native Testing Library (`@testing-library/react-native`) and mocked backend endpoints.
- **Independence**: Test suite runs independently of the live FastAPI backend by utilizing a local mock backend or network interception.
- **Methodology**: Systematic test design including Category-Partition (validating inputs, roles), Boundary Value Analysis (wallet balance, bid pricing thresholds), Pairwise Testing (interaction combinations), and Real-World Workload simulations.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Brand & Style System | R1: Theme colors, custom layouts | 5 | 5 | ✓ |
| 2 | Create Task screen | R2: Customer Workspace - post requests | 5 | 5 | ✓ |
| 3 | Active Bookings & Bids list | R2: View active bookings & bidding providers with KYC | 5 | 5 | ✓ |
| 4 | Customer Bidding Chat Room | R2: WS chat, receive bids, accept bid | 5 | 5 | ✓ |
| 5 | Provider Wallet balance | R3: Wallet balance & Top-up workflow | 5 | 5 | ✓ |
| 6 | Find Nearby Jobs screen | R3: View active customer tasks | 5 | 5 | ✓ |
| 7 | Provider Bidding Guardrail | R3: Wallet check (bid fee validation) | 5 | 5 | ✓ |
| 8 | Provider Bidding Chat Room | R3: WS chat, place bid, receive acceptance | 5 | 5 | ✓ |

## Test Architecture
- **Environment**: Expo web bundle run inside a headless browser (Playwright) or Jest Integration Tests rendering the screens with a custom mock provider/context.
- **Mock Service Worker (MSW)** or custom mock API wrapper to simulate REST and WebSocket responses.
- **Test Command**: `npm test` or `npm run test:e2e`
- **Output format**: JUnit or standard console summary with exit code 0 on success.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Happy Path Journey | Login -> Customer posts task -> Provider discovers task -> Provider wallet balance verified -> Provider places bid -> Bids show on Customer screen -> Chat negotiation -> Customer accepts bid -> Escrow triggered. | High |
| 2 | Insufficient Wallet Balance | Provider wallet balance is 50 PKR (below 100 PKR minimum bid fee). Provider discovers task -> Attempt to bid is blocked with a wallet warning -> Provider tops up wallet to 200 PKR -> Provider successfully bids on task. | Medium |
| 3 | Bid War & Real-Time Counter-Bids | Two provider agents bid on same task in real-time -> Customer negotiates with both in their respective rooms -> Providers submit counter-bids -> Customer accepts highest/lowest bid. | High |
| 4 | Booking Expiration / Timeout | Customer posts task -> 3 minutes elapse without provider acceptance -> WebSocket negotiation is terminated -> Status changes to "Expired" -> Push notification triggered to customer. | Medium |
| 5 | Network Disruption & Reconnect | WS negotiation active -> Connection drops -> App attempts reconnection -> Connection resumes -> Pending chat and bid queue is synchronized without data loss. | High |

## Coverage Thresholds
- Tier 1: 5 * 8 = 40 test cases (Feature coverage)
- Tier 2: 5 * 8 = 40 test cases (Boundary & edge cases, e.g., negative wallet balances, empty fields, budget bounds)
- Tier 3: 8 test cases (Pairwise combinations)
- Tier 4: 5 realistic application scenarios
- **Total Minimum: 93 test cases**
