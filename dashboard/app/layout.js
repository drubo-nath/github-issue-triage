import './globals.css'

export const metadata = {
  title: 'GitHub Issue Triage Dashboard',
  description: 'AI-powered issue triage analytics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
