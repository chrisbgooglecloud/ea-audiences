import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Initial surface creation
      const createSurfaceMsg = {
        messageType: 'createSurface',
        timestamp: new Date().toISOString(),
        traceId: `trace-${Date.now()}`,
        sender: 'GeminiEnterpriseAgentPlatform',
        payload: {
          surfaceId: 'surface-live-telemetry',
          title: 'Live Causal Lift Stream',
          version: '1.4.0',
          initialModel: {
            roas: '2.85x',
            budget: '$4,200,000',
            activeFranchise: 'EA Sports FC',
          },
          rootWidget: {
            id: 'root-stream-grid',
            type: 'a2ui-grid-layout',
            children: [
              {
                id: 'metric-roas',
                type: 'a2ui-metric-card',
                title: 'Live Marginal ROAS',
                value: '2.85x',
                delta: '+0.35x vs baseline',
                deltaType: 'positive',
                config: { badge: 'Meridian Tuned' },
              },
              {
                id: 'metric-cpi',
                type: 'a2ui-metric-card',
                title: 'Blended CPI',
                value: '$3.82',
                delta: '-18.4% vs target',
                deltaType: 'positive',
                config: { badge: 'Equimarginal' },
              },
              {
                id: 'metric-pacing',
                type: 'a2ui-metric-card',
                title: 'Pacing Clamp',
                value: '20% Capped',
                delta: 'Optimal Stability',
                deltaType: 'positive',
                config: { badge: 'Active' },
              },
              {
                id: 'metric-fleet',
                type: 'a2ui-metric-card',
                title: 'Agent Fleet',
                value: '4 Active',
                delta: 'A2A Bus Synced',
                deltaType: 'positive',
                config: { badge: 'Online' },
              },
            ],
          },
        },
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(createSurfaceMsg)}\n\n`));

      // Periodic state updates
      let counter = 0;
      const interval = setInterval(() => {
        counter++;
        if (counter > 5) {
          clearInterval(interval);
          controller.close();
          return;
        }

        const updateMsg = {
          messageType: 'updateDataModel',
          timestamp: new Date().toISOString(),
          traceId: `trace-update-${Date.now()}`,
          sender: 'ADK_AnalyticsMicroAgent',
          payload: {
            surfaceId: 'surface-live-telemetry',
            pointer: '/roas',
            value: `${(2.85 + counter * 0.04).toFixed(2)}x`,
          },
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(updateMsg)}\n\n`));
      }, 4000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
