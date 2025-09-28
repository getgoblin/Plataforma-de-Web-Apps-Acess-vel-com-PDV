export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number; // Date.now()
  context?: Record<string, unknown>;
}
