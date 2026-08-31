export type A2UIMessageType = 
  | 'createSurface' 
  | 'surfaceUpdate' 
  | 'updateDataModel' 
  | 'deleteSurface' 
  | 'ping';

export type A2UIWidgetType = 
  | 'a2ui-metric-card' 
  | 'a2ui-bar-chart' 
  | 'a2ui-line-chart' 
  | 'a2ui-scurve-chart' 
  | 'a2ui-recommendation-card' 
  | 'a2ui-grid-layout' 
  | 'a2ui-alert-banner' 
  | 'a2ui-button-action';

export interface A2UIWidgetProps {
  id: string;
  type: A2UIWidgetType;
  title?: string;
  subtitle?: string;
  value?: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  data?: any[];
  config?: Record<string, any>;
  actionPayload?: Record<string, any>;
  children?: A2UIWidgetProps[];
}

export interface A2UICreateSurfacePayload {
  surfaceId: string;
  title: string;
  version: string;
  initialModel: Record<string, any>;
  rootWidget: A2UIWidgetProps;
}

export interface A2UIUpdateDataModelPayload {
  surfaceId: string;
  pointer: string; // JSON Pointer e.g. "/metrics/roas"
  value: any;
}

export interface A2UISurfaceUpdatePayload {
  surfaceId: string;
  widgetId: string;
  patch: Partial<A2UIWidgetProps>;
}

export interface A2UIEnvelope {
  messageType: A2UIMessageType;
  timestamp: string;
  traceId: string;
  sender: string;
  payload: A2UICreateSurfacePayload | A2UIUpdateDataModelPayload | A2UISurfaceUpdatePayload | Record<string, any>;
}
