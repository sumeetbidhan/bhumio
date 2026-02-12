import { useState, useEffect } from 'react'

// UI States
const STATE_IDLE = 'idle'
const STATE_PENDING = 'pending'
const STATE_RETRYING = 'retrying'
const STATE_SUCCESS = 'success'
const STATE_FAILED = 'failed'

function App() {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [currentState, setCurrentState] = useState(STATE_IDLE)
  const [retryCount, setRetryCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)

  // Mock API function that randomly returns success, 503, or delayed success
  const mockApiCall = async (submissionId) => {
    const random = Math.random()
    
    // 40% chance of immediate success
    if (random < 0.4) {
      return { status: 200, message: 'Success!' }
    }
    
    // 30% chance of temporary failure (503)
    if (random < 0.7) {
      return { status: 503, message: 'Service temporarily unavailable' }
    }
    
    // 30% chance of delayed success (5-10 seconds)
    const delay = 5000 + Math.random() * 5000 // 5-10 seconds
    await new Promise(resolve => setTimeout(resolve, delay))
    return { status: 200, message: 'Success (delayed)!' }
  }

  // Retry logic: automatically retry on 503 errors
  const submitWithRetry = async (submissionId, maxRetries = 3) => {
    let attempts = 0
    
    while (attempts <= maxRetries) {
      try {
        // Show retrying state if this is a retry attempt
        if (attempts > 0) {
          setCurrentState(STATE_RETRYING)
          setRetryCount(attempts)
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          setCurrentState(STATE_PENDING)
        }

        const response = await mockApiCall(submissionId)
        
        if (response.status === 200) {
          // Success!
          setCurrentState(STATE_SUCCESS)
          setRetryCount(0)
          setIsSubmitting(false)
          return
        } else if (response.status === 503 && attempts < maxRetries) {
          // Temporary failure - will retry
          attempts++
          continue
        } else {
          // All retries exhausted or other error
          throw new Error(response.message || 'Request failed')
        }
      } catch (error) {
        if (attempts >= maxRetries) {
          // All retries failed
          setCurrentState(STATE_FAILED)
          setErrorMessage(error.message || 'All retry attempts failed')
          setRetryCount(0)
          setIsSubmitting(false)
          return
        }
        attempts++
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return
    }

    // Generate unique submission ID for idempotency
    // Using timestamp + random number to ensure uniqueness
    const newSubmissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setSubmissionId(newSubmissionId)
    setIsSubmitting(true)
    setErrorMessage('')
    setRetryCount(0)

    // Start the submission process with retry logic
    await submitWithRetry(newSubmissionId)
  }

  // Reset form after success (optional - can be removed if you want form to stay filled)
  useEffect(() => {
    if (currentState === STATE_SUCCESS) {
      // Reset form after 3 seconds
      const timer = setTimeout(() => {
        setEmail('')
        setAmount('')
        setCurrentState(STATE_IDLE)
        setSubmissionId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentState])

  // Get Bootstrap alert class based on current state
  const getAlertClass = () => {
    switch (currentState) {
      case STATE_PENDING:
        return 'alert-info'
      case STATE_RETRYING:
        return 'alert-warning'
      case STATE_SUCCESS:
        return 'alert-success'
      case STATE_FAILED:
        return 'alert-danger'
      default:
        return 'alert-secondary'
    }
  }

  // Get status message based on current state
  const getStatusMessage = () => {
    switch (currentState) {
      case STATE_PENDING:
        return 'Pending... Submitting your request.'
      case STATE_RETRYING:
        return `Retrying... Attempt ${retryCount} of 3`
      case STATE_SUCCESS:
        return `Success! Your submission (ID: ${submissionId}) was processed successfully.`
      case STATE_FAILED:
        return `Failed: ${errorMessage}`
      default:
        return 'Ready to submit'
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">Payment Form</h1>
          
          {/* Status Alert */}
          <div className={`alert ${getAlertClass()}`} role="alert">
            {getStatusMessage()}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="amount" className="form-label">
                Amount
              </label>
              <input
                type="number"
                className="form-control"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
