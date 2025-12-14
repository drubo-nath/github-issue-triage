export async function GET() {
  const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080';
  const KESTRA_USER = process.env.KESTRA_USER || 'admin@kestra.io';
  const KESTRA_PASSWORD = process.env.KESTRA_PASSWORD || 'kestra';
  const NAMESPACE = 'hackathon';
  const FLOW_ID = 'github-issue-triage-v3';

  // Create Basic Auth header
  const authHeader = 'Basic ' + Buffer.from(`${KESTRA_USER}:${KESTRA_PASSWORD}`).toString('base64');

  try {
    // Fetch executions for our flow
    const response = await fetch(
      `${KESTRA_URL}/api/v1/executions?namespace=${NAMESPACE}&flowId=${FLOW_ID}&size=20`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`Kestra API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform executions into our dashboard format
    const executions = data.results || [];
    
    const triageHistory = executions.map((exec) => {
      const startDate = new Date(exec.state.startDate);
      const endDate = exec.state.endDate ? new Date(exec.state.endDate) : null;
      
      // Extract outputs from taskRunList (Kestra nests outputs per task)
      const taskRuns = exec.taskRunList || [];
      
      // Find the fetch_issues task to count issues
      let issueCount = 0;
      const fetchTask = taskRuns.find(t => t.taskId === 'fetch_issues');
      if (fetchTask?.outputs?.body) {
        try {
          const issues = JSON.parse(fetchTask.outputs.body);
          issueCount = Array.isArray(issues) ? issues.length : 0;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Find the AI agent task (could be triage_agent or summarize_issues)
      let aiResponse = '';
      const aiTask = taskRuns.find(t => 
        t.taskId === 'triage_agent' || 
        t.taskId === 'summarize_issues'
      );
      if (aiTask?.outputs?.textOutput) {
        aiResponse = aiTask.outputs.textOutput;
      } else if (aiTask?.outputs?.output) {
        aiResponse = aiTask.outputs.output;
      }
      
      // Check if dry_run was false (meaning actions were applied)
      const inputs = exec.inputs || {};
      const appliedActions = inputs.dry_run === false;
      
      return {
        id: exec.id,
        timestamp: startDate.toISOString(),
        status: exec.state.current,
        duration: endDate 
          ? `${((endDate - startDate) / 1000).toFixed(1)}s`
          : 'Running...',
        issuesProcessed: issueCount,
        mode: appliedActions ? 'LIVE' : 'DRY RUN',
        aiResponse: aiResponse || '', // Send full response for proper parsing
        inputs: inputs,
      };
    });

    // Calculate stats
    const stats = {
      totalRuns: triageHistory.length,
      successfulRuns: triageHistory.filter(t => t.status === 'SUCCESS').length,
      totalIssuesProcessed: triageHistory.reduce((sum, t) => sum + t.issuesProcessed, 0),
      liveRuns: triageHistory.filter(t => t.mode === 'LIVE').length,
    };

    return Response.json({
      success: true,
      stats,
      triageHistory,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to fetch from Kestra:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stats: { totalRuns: 0, successfulRuns: 0, totalIssuesProcessed: 0, liveRuns: 0 },
      triageHistory: [],
      lastUpdated: new Date().toISOString(),
    }, { status: 500 });
  }
}
