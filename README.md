# Form Submission App

A simple React web application that demonstrates form submission with retry logic, duplicate prevention, and idempotency handling.

## Features

- Form with email and amount fields
- Mock API with randomized behavior (success, temporary failure, delayed success)
- Automatic retry logic for temporary failures (503 errors)
- Duplicate submission prevention
- Idempotency using unique submission IDs
- Clear UI state indicators

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## How It Works

### State Transitions

The app manages five distinct states:

1. **Idle** - Initial state, form is ready for input
2. **Pending** - Form submitted, waiting for API response
3. **Retrying** - API returned 503, automatically retrying (shows retry count)
4. **Success** - Submission successful, shows success message
5. **Failed** - All retry attempts exhausted, shows error message

State flow:
```
Idle → Pending → (Success OR Retrying → Retrying → ... → Success/Failed)
```

### Retry Logic

When the mock API returns a **503 (temporary failure)** status:

1. The app automatically retries the request
2. Maximum of **3 retries** are attempted
3. Each retry waits **1 second** before executing
4. The UI shows the current retry attempt number (e.g., "Retrying... Attempt 2 of 3")
5. If all retries fail, the app transitions to the **Failed** state

**Why retry?** Temporary failures (503) often indicate server overload or temporary issues that may resolve quickly. Automatic retries improve user experience by handling transient errors without user intervention.

### Duplicate Prevention

The app prevents duplicate submissions through multiple mechanisms:

1. **Button Disabling**: The submit button is disabled immediately when clicked (`isSubmitting` flag)
2. **Early Return**: The `handleSubmit` function checks `isSubmitting` and returns early if already submitting
3. **Form Field Disabling**: All form inputs are disabled during submission to prevent changes

**How it works:**
- When user clicks submit, `isSubmitting` is set to `true`
- Button and inputs become disabled
- Even if user somehow triggers submit again, the early return prevents duplicate API calls
- `isSubmitting` is reset to `false` only after success or failure

### Idempotency

Idempotency ensures that even if a request is retried multiple times, only **one record** is created on the server.

**Implementation:**
- Each submission generates a unique **submission ID** using: `timestamp + random string`
- Example: `1705123456789-abc123xyz`
- This ID is passed to the mock API function
- In a real application, the backend would use this ID to check if the request was already processed

**How idempotency works:**
1. First submission creates ID: `1705123456789-abc123xyz`
2. If retry happens, same ID is used: `1705123456789-abc123xyz`
3. Backend checks: "Have I seen this ID before?"
4. If yes → return existing result (no duplicate record)
5. If no → process and store the ID with the result

**Why it matters:** Network issues, retries, or accidental double-clicks shouldn't create duplicate records. The submission ID acts as a unique identifier that the server can use to prevent duplicates.

## Mock API Behavior

The mock API (`mockApiCall` function) randomly returns:

- **40% chance**: Immediate success (200)
- **30% chance**: Temporary failure (503) - triggers retry logic
- **30% chance**: Delayed success (200 after 5-10 seconds)

This simulates real-world API behavior where responses can vary.

## Project Structure

```
bhumio/
├── src/
│   ├── App.jsx          # Main component with form and logic
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Code Highlights

### Key Functions

- `mockApiCall(submissionId)`: Simulates API call with random behavior
- `submitWithRetry(submissionId, maxRetries)`: Handles submission with automatic retry logic
- `handleSubmit(e)`: Form submission handler with duplicate prevention

### State Management

All state is managed using React hooks:
- `useState` for form data and UI state
- `useEffect` for cleanup (resetting form after success)

## Technologies Used

- **React 18** - UI framework
- **Bootstrap 5** - Styling
- **Vite** - Build tool and dev server

## Notes

- The form resets automatically 3 seconds after successful submission
- All logic is contained in `App.jsx` for simplicity
- Code includes comments explaining important sections
- The solution is intentionally minimal and beginner-friendly
