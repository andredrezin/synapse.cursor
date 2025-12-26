-- Add foreign key constraint for leads.assigned_to -> profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_assigned_to_fkey'
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE "public"."leads"
        ADD CONSTRAINT "leads_assigned_to_fkey"
        FOREIGN KEY ("assigned_to")
        REFERENCES "public"."profiles" ("id")
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add 'manual' to lead_source enum
ALTER TYPE "public"."lead_source" ADD VALUE IF NOT EXISTS 'manual';
