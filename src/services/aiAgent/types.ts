export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  timestamp: string;
  metadata?: {
    appointmentCreated?: any;
    slotsSuggested?: string[];
    actionType?: 'booking' | 'cancellation' | 'reschedule' | 'waiting_list' | 'info';
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface AgentConfig {
  apiKey?: string;
  provider?: 'openai' | 'gemini';
  model?: string;
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  mapsUrl?: string;
}

export interface PatientContext {
  id?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
}
