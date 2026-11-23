import type {
  ApiErrorBody,
  BodyMetric,
  ChatResponse,
  ChatHistoryResponse,
  DashboardData,
  ProgramData,
  RecentData,
  RecoveryLog,
  RunPayload,
  StrengthPayload,
  WriteResult,
} from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const NETWORK_MESSAGE = 'Unable to connect to the training agent. Try again.';
const AGENT_MESSAGE = "The training agent couldn't complete that request. Try again.";
let csrfToken = '';

export type ApiErrorKind = 'network' | 'validation' | 'authentication' | 'agent';

export class ApiFailure extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiFailure';
  }
}

function messageFrom(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const error = (payload as ApiErrorBody).error;
  return typeof error?.message === 'string' ? error.message : null;
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...init.headers },
    });

    if (response.status === 204) return undefined as T;

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 400) {
        throw new ApiFailure('validation', messageFrom(payload) ?? 'Please check the form and try again.');
      }

      if (response.status === 401) {
        throw new ApiFailure('authentication', messageFrom(payload) ?? 'Incorrect password.');
      }

      if (response.status === 403) {
        throw new ApiFailure('authentication', 'This browser origin is not allowed by the API.');
      }

      if (response.status === 503) {
        throw new ApiFailure('authentication', 'Authentication is not configured on the API.');
      }

      throw new ApiFailure('agent', AGENT_MESSAGE);
    }

    if (payload === null) {
      throw new ApiFailure('agent', AGENT_MESSAGE);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiFailure) {
      throw error;
    }

    throw new ApiFailure('network', NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export const api = {
  async session(): Promise<void> {
    const result = await request<{ csrfToken: string }>('/api/auth/session');
    csrfToken = result.csrfToken;
  },

  async login(password: string): Promise<void> {
    const result = await request<{ csrfToken: string }>('/api/auth/login', { method: 'POST', body: jsonBody({ password }) });
    csrfToken = result.csrfToken;
  },

  async logout(): Promise<void> {
    await request<void>('/api/auth/logout', { method: 'POST' });
    csrfToken = '';
  },
  chatHistory(): Promise<ChatHistoryResponse> {
    return request<ChatHistoryResponse>('/api/chat');
  },

  chat(message: string): Promise<ChatResponse> {
    return request<ChatResponse>(
      '/api/chat',
      { method: 'POST', body: jsonBody({ message }) },
      180_000,
    );
  },

  dashboard(): Promise<DashboardData> {
    return request<DashboardData>('/api/dashboard');
  },

  recent(days = 30): Promise<RecentData> {
    return request<RecentData>(`/api/training/recent?days=${days}`);
  },

  program(): Promise<ProgramData> {
    return request<ProgramData>('/api/program');
  },

  recovery(): Promise<RecoveryLog[]> {
    return request<RecoveryLog[]>('/api/recovery');
  },

  bodyMetrics(): Promise<BodyMetric[]> {
    return request<BodyMetric[]>('/api/body-metrics');
  },

  logStrength(payload: StrengthPayload): Promise<WriteResult> {
    return request<WriteResult>('/api/training/strength', {
      method: 'POST',
      body: jsonBody(payload),
    });
  },

  logRun(payload: RunPayload): Promise<WriteResult> {
    return request<WriteResult>('/api/training/run', {
      method: 'POST',
      body: jsonBody(payload),
    });
  },
};

export function describeError(error: unknown): string {
  if (error instanceof ApiFailure) {
    return error.message;
  }

  return NETWORK_MESSAGE;
}
