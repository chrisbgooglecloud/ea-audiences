'use client';

import React, { useState, useEffect } from 'react';
import {
  A2UIWidgetProps,
  A2UIEnvelope,
  A2UICreateSurfacePayload,
  A2UIUpdateDataModelPayload,
  A2UISurfaceUpdatePayload,
} from '@/types/a2ui';
import { validateWidgetNode, applyJsonPointer } from '@/lib/widget_catalog';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface A2UIRendererProps {
  initialSurface?: A2UICreateSurfacePayload;
  streamUrl?: string;
  onActionTrigger?: (actionPayload: any) => void;
}

export function A2UIRenderer({ initialSurface, streamUrl, onActionTrigger }: A2UIRendererProps) {
  const [surface, setSurface] = useState<A2UICreateSurfacePayload | null>(initialSurface || null);
  const [dataModel, setDataModel] = useState<Record<string, any>>(initialSurface?.initialModel || {});
  const [connected, setConnected] = useState<boolean>(false);
  const [lastStreamTime, setLastStreamTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!streamUrl) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const envelope: A2UIEnvelope = JSON.parse(event.data);
          setLastStreamTime(new Date().toLocaleTimeString());

          if (envelope.messageType === 'createSurface') {
            const payload = envelope.payload as A2UICreateSurfacePayload;
            if (validateWidgetNode(payload.rootWidget)) {
              setSurface(payload);
              setDataModel(payload.initialModel || {});
            }
          } else if (envelope.messageType === 'updateDataModel') {
            const payload = envelope.payload as A2UIUpdateDataModelPayload;
            setDataModel((prev) => applyJsonPointer(prev, payload.pointer, payload.value));
          } else if (envelope.messageType === 'surfaceUpdate') {
            const payload = envelope.payload as A2UISurfaceUpdatePayload;
            setSurface((prev) => {
              if (!prev) return prev;
              const updateTree = (node: A2UIWidgetProps): A2UIWidgetProps => {
                if (node.id === payload.widgetId) {
                  return { ...node, ...payload.patch };
                }
                if (node.children) {
                  return { ...node, children: node.children.map(updateTree) };
                }
                return node;
              };
              return { ...prev, rootWidget: updateTree(prev.rootWidget) };
            });
          }
        } catch (err) {
          console.error('Failed to parse A2UI streaming envelope:', err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('EventSource initialization bypassed:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [streamUrl]);

  if (!surface || !surface.rootWidget) {
    return (
      <div className="bg-[#16263A] border border-[#253D5B] rounded-lg p-6 text-center text-[#8FA3BC]">
        <ShieldCheck className="w-8 h-8 text-[#0072BC] mx-auto mb-2 opacity-70 animate-pulse" />
        <p className="text-sm font-semibold text-white">A2UI Stream Decoupled Sandbox</p>
        <p className="text-xs text-[#8FA3BC] mt-1">Awaiting structured JSON payload from Gemini Agent Platform...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stream Header & Security Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0E1A29] border border-[#253D5B] rounded-md text-xs">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00C48C] animate-ping' : 'bg-[#0072BC]'}`} />
          <span className="font-semibold text-white">A2UI Surface: {surface.title}</span>
          <span className="text-[#5C728C] font-mono">v{surface.version}</span>
        </div>
        <div className="flex items-center space-x-3 text-[#8FA3BC]">
          <span className="flex items-center space-x-1 text-[#00C48C]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trusted Widget Catalog Verified</span>
          </span>
          {lastStreamTime && <span className="tabular-nums">Updated: {lastStreamTime}</span>}
        </div>
      </div>

      {/* Render Component Tree */}
      {renderWidget(surface.rootWidget, dataModel, onActionTrigger, mounted)}
    </div>
  );
}

function renderWidget(
  widget: A2UIWidgetProps,
  model: Record<string, any>,
  onActionTrigger?: (payload: any) => void,
  mounted?: boolean
): React.ReactNode {
  switch (widget.type) {
    case 'a2ui-grid-layout':
      return (
        <div key={widget.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {widget.children?.map((child) => renderWidget(child, model, onActionTrigger, mounted))}
        </div>
      );

    case 'a2ui-metric-card': {
      const isPositive = widget.deltaType === 'positive';
      const isNegative = widget.deltaType === 'negative';
      return (
        <div
          key={widget.id}
          className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] transition-all rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0072BC]/5 rounded-full blur-2xl group-hover:bg-[#0072BC]/10 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8FA3BC]">
              {widget.title}
            </span>
            {widget.config?.badge && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1A29] text-[#00C48C] border border-[#253D5B]">
                {widget.config.badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-heading font-bold text-white tracking-tight tabular-nums">{widget.value}</div>
          {widget.delta && (
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium">
              {isPositive && <TrendingUp className="w-3.5 h-3.5 text-[#00C48C]" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 text-[#FF4560]" />}
              <span className={isPositive ? 'text-[#00C48C]' : isNegative ? 'text-[#FF4560]' : 'text-[#8FA3BC]'}>
                {widget.delta}
              </span>
              {widget.subtitle && <span className="text-[#8FA3BC]">{widget.subtitle}</span>}
            </div>
          )}
        </div>
      );
    }

    case 'a2ui-recommendation-card':
      return (
        <div
          key={widget.id}
          className="bg-gradient-to-r from-[#16263A] to-[#1E334D] border border-[#0072BC]/40 rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-md bg-[#0072BC]/20 text-[#008BE6] border border-[#0072BC]/40">
              <Sparkles className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00C48C]">
                  Gemini Enterprise Micro-Agent Insight
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#0072BC]/20 text-white rounded-full font-mono border border-[#0072BC]/30">
                  thinking_level=HIGH
                </span>
              </div>
              <h4 className="text-base font-heading font-bold text-white mt-1">{widget.title}</h4>
              <p className="text-xs text-[#8FA3BC] mt-1.5 leading-relaxed">{widget.subtitle}</p>

              {widget.actionPayload && (
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={() => onActionTrigger && onActionTrigger(widget.actionPayload)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0072BC] hover:bg-[#008BE6] text-white font-semibold text-xs rounded-md transition-all shadow-[0_0_12px_rgba(0,114,188,0.4)] cursor-pointer"
                  >
                    <span>{widget.actionPayload.label || 'Execute Autonomous Action'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {widget.actionPayload.secondaryLabel && (
                    <button
                      onClick={() => onActionTrigger && onActionTrigger({ ...widget.actionPayload, secondary: true })}
                      className="px-3 py-2 bg-transparent hover:bg-white/5 text-white text-xs font-medium rounded-md border border-[#253D5B] hover:border-[#0072BC] transition-all cursor-pointer"
                    >
                      {widget.actionPayload.secondaryLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'a2ui-bar-chart':
      return (
        <div key={widget.id} className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider">{widget.title}</h4>
            <span className="text-xs text-[#8FA3BC]">{widget.subtitle}</span>
          </div>
          <div className="h-64 w-full min-w-0 min-h-0 relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={widget.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" vertical={false} />
                  <XAxis dataKey="name" stroke="#8FA3BC" fontSize={11} />
                  <YAxis stroke="#8FA3BC" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', borderColor: '#0072BC', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" fill="#0072BC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#0E1A29] rounded-md animate-pulse" />
            )}
          </div>
        </div>
      );

    case 'a2ui-line-chart':
    case 'a2ui-scurve-chart':
      return (
        <div key={widget.id} className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider">{widget.title}</h4>
              <p className="text-xs text-[#8FA3BC]">{widget.subtitle}</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1 text-[#00C48C] font-mono">
                <Zap className="w-3 h-3" />
                <span>Budget Optimization Curve</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full min-w-0 min-h-0 relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={widget.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" />
                  <XAxis dataKey="spend" stroke="#8FA3BC" fontSize={11} unit="k" />
                  <YAxis stroke="#8FA3BC" fontSize={11} unit="x" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', borderColor: '#0072BC', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="marginal_roas" stroke="#00C48C" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumulative_roas" stroke="#0072BC" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#0E1A29] rounded-md animate-pulse" />
            )}
          </div>
        </div>
      );

    case 'a2ui-alert-banner':
      return (
        <div
          key={widget.id}
          className="bg-[#16263A] border border-[#FFB800]/50 text-[#FFB800] px-4 py-3 rounded-md flex items-center justify-between text-xs shadow-md"
        >
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FFB800] flex-shrink-0" />
            <span>{widget.title || widget.subtitle}</span>
          </div>
          {widget.delta && <span className="font-mono font-bold tabular-nums">{widget.delta}</span>}
        </div>
      );

    default:
      return null;
  }
}
