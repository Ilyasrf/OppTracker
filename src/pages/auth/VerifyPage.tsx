import { Link } from 'react-router-dom'

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="font-mono text-3xl font-bold text-accent">OppTracker</h1>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-8 backdrop-blur-sm">
          <div className="mb-4 text-5xl">📧</div>
          <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
          <p className="mb-6 text-gray-400">
            We've sent a confirmation link to your email address.
            Click the link to verify your account and start tracking opportunities.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent/80"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
