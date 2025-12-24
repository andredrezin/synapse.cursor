-- Tipos ENUM para providers e status
CREATE TYPE whatsapp_provider AS ENUM ('evolution', 'official');
CREATE TYPE whatsapp_status AS ENUM ('disconnected', 'connecting', 'connected', 'qr_pending');

-- Tabela de conexões WhatsApp por workspace
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  provider whatsapp_provider NOT NULL DEFAULT 'evolution',
  status whatsapp_status NOT NULL DEFAULT 'disconnected',
  instance_name TEXT UNIQUE,
  qr_code TEXT,
  api_url TEXT,
  api_key TEXT,
  webhook_secret TEXT DEFAULT gen_random_uuid()::text,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atribuição de vendedores a conexões WhatsApp
CREATE TABLE seller_whatsapp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, whatsapp_connection_id)
);

-- Adicionar colunas às tabelas existentes para rastrear mensagens WhatsApp
ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_connection_id UUID REFERENCES whatsapp_connections(id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_whatsapp_assignments ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_connections
CREATE POLICY "Workspace members can view connections"
  ON whatsapp_connections FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can insert connections"
  ON whatsapp_connections FOR INSERT
  WITH CHECK (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can update connections"
  ON whatsapp_connections FOR UPDATE
  USING (user_is_workspace_admin(workspace_id));

CREATE POLICY "Workspace admins can delete connections"
  ON whatsapp_connections FOR DELETE
  USING (user_is_workspace_admin(workspace_id));

-- Policies para seller_whatsapp_assignments
CREATE POLICY "Workspace members can view assignments"
  ON seller_whatsapp_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM whatsapp_connections wc
    WHERE wc.id = whatsapp_connection_id
    AND is_workspace_member(wc.workspace_id)
  ));

CREATE POLICY "Workspace admins can insert assignments"
  ON seller_whatsapp_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM whatsapp_connections wc
    WHERE wc.id = whatsapp_connection_id
    AND user_is_workspace_admin(wc.workspace_id)
  ));

CREATE POLICY "Workspace admins can update assignments"
  ON seller_whatsapp_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM whatsapp_connections wc
    WHERE wc.id = whatsapp_connection_id
    AND user_is_workspace_admin(wc.workspace_id)
  ));

CREATE POLICY "Workspace admins can delete assignments"
  ON seller_whatsapp_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM whatsapp_connections wc
    WHERE wc.id = whatsapp_connection_id
    AND user_is_workspace_admin(wc.workspace_id)
  ));

-- Habilitar Realtime para conexões (para atualizar QR code em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_connections;