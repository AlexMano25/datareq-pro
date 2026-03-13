export interface Tenant {
  id: string;
  name: string;
  region: string;
  created_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'contributor' | 'viewer';
  created_at: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  geography: string | null;
  sectors: string[] | null;
  objectives: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'closed';
  is_public: boolean;
  public_token: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'email' | 'phone';
  required: boolean;
  is_pii: boolean;
  order_index: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  project_id: string;
  tenant_id: string;
  submitted_at: string;
  source: string;
  meta: Record<string, any>;
}

export interface ResponseItem {
  id: string;
  response_id: string;
  form_field_id: string;
  raw_value: string | null;
  anonymized_value: string | null;
  is_pseudonymized: boolean;
}

export interface DataSubjectRequest {
  id: string;
  tenant_id: string;
  requester_email: string;
  request_type: 'access' | 'delete' | 'rectification' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface LegalRule {
  id: string;
  tenant_id: string | null;
  jurisdiction: string;
  article_ref: string | null;
  title: string;
  rule_text: string;
  tags: string[];
  active: boolean;
  created_at: string;
}
