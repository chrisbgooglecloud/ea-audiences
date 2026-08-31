import { A2UIWidgetProps, A2UIWidgetType } from '@/types/a2ui';

export const TRUSTED_WIDGET_TYPES = new Set<A2UIWidgetType>([
  'a2ui-metric-card',
  'a2ui-bar-chart',
  'a2ui-line-chart',
  'a2ui-scurve-chart',
  'a2ui-recommendation-card',
  'a2ui-grid-layout',
  'a2ui-alert-banner',
  'a2ui-button-action',
]);

export function validateWidgetNode(node: any): node is A2UIWidgetProps {
  if (!node || typeof node !== 'object') return false;
  if (typeof node.id !== 'string') return false;
  if (!TRUSTED_WIDGET_TYPES.has(node.type as A2UIWidgetType)) {
    console.warn(`Untrusted or unknown widget type rejected by catalog security filter: ${node.type}`);
    return false;
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.every(validateWidgetNode);
  }
  return true;
}

export function applyJsonPointer(model: Record<string, any>, pointer: string, value: any): Record<string, any> {
  const newModel = { ...model };
  const parts = pointer.replace(/^\//, '').split('/');
  
  let current: any = newModel;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in current) || typeof current[p] !== 'object') {
      current[p] = {};
    }
    current = current[p];
  }
  
  if (parts.length > 0) {
    current[parts[parts.length - 1]] = value;
  }
  
  return newModel;
}
