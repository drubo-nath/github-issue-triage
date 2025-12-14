export async function GET() {
  const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080';
  const KESTRA_USER = process.env.KESTRA_USER || 'admin@kestra.io';
  const KESTRA_PASSWORD = process.env.KESTRA_PASSWORD || 'kestra';
  const NAMESPACE = 'github';
  const FLOW_ID = 'issue-triage';

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
      
      // Extract outputs if available
      const outputs = exec.outputs || {};
      const reportOutput = outputs.report || {};
      
      // Parse the AI response from outputs
      let aiResponse = '';
      let issueCount = 0;
      let appliedActions = false;
      
      if (outputs.triage_agent?.textOutput) {
        aiResponse = outputs.triage_agent.textOutput;
      }
      
      if (outputs.fetch_issues?.body) {
        try {
          const issues = JSON.parse(outputs.fetch_issues.body);
          issueCount = Array.isArray(issues) ? issues.length : 0;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Check if dry_run was false (meaning actions were applied)
      const inputs = exec.inputs || {};
      appliedActions = inputs.dry_run === false;
      
      return {
        id: exec.id,
        timestamp: startDate.toISOString(),
        status: exec.state.current,
        duration: endDate 
          ? `${((endDate - startDate) / 1000).toFixed(1)}s`
          : 'Running...',
        issuesProcessed: issueCount,
        mode: appliedActions ? 'LIVE' : 'DRY RUN',
        aiResponse: aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : ''),
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
