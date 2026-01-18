-- Migration to Shielded Schema (Anti-Amador)
-- Based on the plan to harden the database against duplicates and data leaks.

-- 1. WHATSAPP_CONNECTIONS (Table: whatsapp_connections)
-- Enhance security and unique constraints
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS evo_instance_key TEXT,
ADD COLUMN IF NOT EXISTS evo_apikey TEXT;

-- Populate evo_instance_key from instance_name if empty (legacy support)
UPDATE whatsapp_connections 
SET evo_instance_key = instance_name 
WHERE evo_instance_key IS NULL AND instance_name IS NOT NULL;

-- Make it unique to prevent duplicate instances for same key
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_connections_evo_key 
ON whatsapp_connections(evo_instance_key);

-- 2. LEADS (Table: leads)
-- Prevent duplicate contacts for the same workspace
-- We use leads instead of 'contacts' to maintain compatibility.
-- Important: We want unique(workspace_id, phone).
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_phone 
ON leads(workspace_id, phone);

-- 3. MESSAGES (Table: messages)
-- Prevent message redelivery duplicates
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS evo_message_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint on evo_message_id to enable "ON CONFLICT DO NOTHING"
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_evo_id 
ON messages(evo_message_id);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin (metadata);
