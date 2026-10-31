export interface Card {
  id: string; // e.g. "TAP-001" or "TAP-A8K2"
  status: 'unassigned' | 'active' | 'suspended';
  target_url: string; // The direct review URL
  raw_input_url?: string; // The raw URL pasted by client
  business_name: string;
  client_phone?: string;
  client_email?: string;
  pin?: string; // Optional activation PIN
  taps: number;
  created_at: string;
  activated_at?: string;
  notes?: string;
}

export interface ActivationPayload {
  cardId: string;
  url: string;
  businessName: string;
  phone?: string;
  email?: string;
  pin?: string;
}
