'use client'

import { useState, useEffect } from 'react'

const statusColors = {
  SUCCESS: 'text-green-400',
  RUNNING: 'text-blue-400',
  FAILED: 'text-red-400',
  WARNING: 'text-yellow-400',
}

const statusBadgeColors = {
  SUCCESS: 'bg-green-500/15 text-green-300 border-green-500/25',
  RUNNING: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  FAILED: 'bg-red-500/15 text-red-300 border-red-500/25',
  WARNING: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
}

const priorityColors = {
  P1: 'bg-red-500/80 border-red-400/50',
  P2: 'bg-orange-500/80 border-orange-400/50',
  P3: 'bg-yellow-500/80 border-yellow-400/50',
  P4: 'bg-green-500/80 border-green-400/50',
}

const categoryIcons = {
  bug: '🐛',
  enhancement: '✨',
  question: '❓',
  documentation: '📚',
}

function parseAIResponse(response) {
  if (!response) return null;
  try {
    // Try to extract JSON from the response (might be wrapped in markdown code block)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];
    const jsonStr = jsonMatch[1] || response;
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    return null;
  }
}

function IssueCard({ issue }) {
  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{categoryIcons[issue.category] || '📌'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-sm font-mono">#{issue.number}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${priorityColors[issue.priority] || 'bg-slate-600'}`}>
                {issue.priority}
              </span>
            </div>
            <p className="text-white font-medium mt-1 break-words">{issue.title}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(issue.labels || []).map((label, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-slate-700/80 text-slate-300 border border-slate-600/50">
                  {label}
                </span>
              ))}
            </div>
            {issue.comment && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border-l-2 border-purple-500/50">
                <p className="text-slate-300 text-sm italic">"{issue.comment}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AIResponseDisplay({ response }) {
  const parsed = parseAIResponse(response);
  
  if (parsed && parsed.issues && Array.isArray(parsed.issues)) {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-300 text-sm font-medium">🤖 AI Triage Results</p>
          <span className="text-slate-500 text-xs">{parsed.issues.length} issues analyzed</span>
        </div>
        <div className="grid gap-3">
          {parsed.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
        {parsed.summary && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Summary</p>
            <p className="text-slate-200 text-sm">{parsed.summary}</p>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback to raw display if JSON parsing fails
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-slate-300 text-sm font-medium">AI Response</p>
        <span className="text-slate-500 text-xs">(raw)</span>
      </div>
      <div className="mt-2 p-4 bg-slate-950/40 rounded-xl border border-slate-800 max-h-96 overflow-auto">
        <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {response}
        </pre>
      </div>
    </div>
  );
}

function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${className}`}>
      {children}
    </span>
  )
}

function StatCard({ title, value, subtitle, color, loading }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 shadow-sm">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className="mt-2">
        {loading ? (
          <div className="h-10 w-24 rounded-lg bg-slate-800 animate-pulse" />
        ) : (
          <p className={`text-4xl font-bold ${color || 'text-white'}`}>{value}</p>
        )}
      </div>
      {subtitle && <p className="text-slate-500 text-sm mt-2">{subtitle}</p>}
    </div>
  )
}

function ExecutionCard({ execution }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(execution.timestamp)
  const isRunning = execution.status === 'RUNNING'

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-slate-800/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              isRunning ? 'bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse' : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {isRunning ? '⏳' : '🤖'}
            </div>
            <div>
              <p className="text-white font-semibold">Execution</p>
              <p className="text-slate-400 text-xs font-mono mt-1">{execution.id}</p>
              <p className="text-slate-400 text-sm">
                {date.toLocaleDateString()} at {date.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Pill className={execution.mode === 'LIVE' ? 'bg-green-500/15 text-green-300 border-green-500/25' : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25'}>
              {execution.mode === 'LIVE' ? 'LIVE' : 'DRY RUN'}
            </Pill>
            <Pill className={statusBadgeColors[execution.status] || 'bg-slate-800 text-slate-200 border-slate-700'}>
              <span className={statusColors[execution.status]}>
                {execution.status}
              </span>
            </Pill>
            <Pill className="bg-slate-800/60 text-slate-200 border-slate-700">
              ⏱ {execution.duration}
            </Pill>
            <span className="text-slate-500 select-none">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-800">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Issues Processed</p>
              <p className="text-white font-bold text-xl mt-1">{execution.issuesProcessed}</p>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Mode</p>
              <p className="text-white font-bold text-xl mt-1">{execution.mode}</p>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Status</p>
              <p className={`font-bold text-xl mt-1 ${statusColors[execution.status] || 'text-white'}`}>{execution.status}</p>
            </div>
          </div>

          {execution.aiResponse ? (
            <AIResponseDisplay response={execution.aiResponse} />
          ) : (
            <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-sm">No AI response available for this execution.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/executions')
      const result = await response.json()
      
      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error)
      }
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const stats = data?.stats || { totalRuns: 0, successfulRuns: 0, totalIssuesProcessed: 0, liveRuns: 0 }
  const executions = data?.triageHistory || []

  return (
    <main className="min-h-screen">
      <div className="absolute inset-0 -z-10 bg-slate-950" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(168,85,247,0.18),transparent_45%),radial-gradient(900px_circle_at_80%_30%,rgba(59,130,246,0.14),transparent_40%)]" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                🤖
              </div>
              <h1 className="text-3xl font-bold text-white">Issue Triage Dashboard</h1>
            </div>
            <p className="text-slate-400 mt-3 max-w-2xl">
              Real-time GitHub issue triage powered by a Kestra AI Agent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
            >
              Open Kestra
            </a>
            <a
              href="https://github.com/drubo-nath/issue-triage-demo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
            >
              View GitHub Issues
            </a>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`mb-8 p-5 rounded-2xl border ${
          error
            ? 'bg-red-500/10 border-red-500/25'
            : 'bg-green-500/10 border-green-500/25'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className={`mt-1 w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
              <div>
                <p className={`font-medium ${error ? 'text-red-200' : 'text-green-200'}`}>
                  {error ? 'Disconnected from Kestra' : 'Connected to Kestra'}
                </p>
                <p className={`text-sm mt-1 ${error ? 'text-red-200/80' : 'text-green-200/80'}`}>
                  {error
                    ? `⚠️ ${error} — make sure Kestra is running on localhost:8080`
                    : 'Auto-refresh pulls latest executions from /api/executions.'}
                </p>
                {lastUpdated && (
                  <p className="text-slate-400 text-xs mt-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-slate-200/90 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900"
                />
                Auto-refresh
              </label>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl transition-colors border border-slate-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Runs" 
            value={stats.totalRuns} 
            subtitle="All executions"
            loading={loading}
          />
          <StatCard 
            title="Successful" 
            value={stats.successfulRuns} 
            subtitle="Completed runs"
            color="text-green-400"
            loading={loading}
          />
          <StatCard 
            title="Live Runs" 
            value={stats.liveRuns} 
            subtitle="Actions applied"
            color="text-blue-400"
            loading={loading}
          />
          <StatCard 
            title="Issues Processed" 
            value={stats.totalIssuesProcessed} 
            subtitle="Across all runs"
            loading={loading}
          />
        </div>

        {/* Execution History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Execution History</h2>
            <p className="text-slate-500 text-sm">
              {executions.length} execution{executions.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {loading && executions.length === 0 ? (
            <div className="bg-slate-900/40 rounded-2xl p-10 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-800 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-56 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-80 bg-slate-800/70 rounded mt-3 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 mt-6">Loading executions from Kestra...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="bg-slate-900/40 rounded-2xl p-10 border border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">📭</div>
                <div>
                  <p className="text-white font-semibold">No executions found</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Run the <span className="font-mono bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-lg">github.issue-triage</span> flow in Kestra to see results here.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </div>

        {/* How to Use */}
        <div className="mt-8 p-6 bg-slate-900/35 rounded-2xl border border-slate-800">
          <h3 className="text-white font-semibold mb-3">Quick Start</h3>
          <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
            <li>
              Open <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">Kestra UI</a> and run <span className="font-mono bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded">github.issue-triage</span>
            </li>
            <li>
              Set <span className="font-mono bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded">dry_run: false</span> to apply labels + comments
            </li>
            <li>
              Watch executions appear here (auto-refresh every 5s)
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 bg-slate-900/25 rounded-2xl border border-slate-800">
          <div className="text-center">
            <p className="text-slate-300 font-medium">GitHub Issue Triage Agent</p>
            <p className="text-slate-500 text-sm mt-1">
              Built with <a href="https://kestra.io" target="_blank" className="text-purple-400 hover:underline">Kestra</a> + <a href="https://openrouter.ai" target="_blank" className="text-purple-400 hover:underline">OpenRouter</a> for the WeMakeDevs AI Agents Hackathon
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
