import os
from supabase import create_client, Client

url = "https://aktwyjsfvydxaaipedyb.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHd5anNmdnlkeGFhaXBlZHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDEwMTgsImV4cCI6MjA4MjAxNzAxOH0.GAIOBYd0BIWmLfXNovu2nVx3oGD4tR6_M911iPijZAQ"
supabase: Client = create_client(url, key)

res = supabase.table("messages").select("*").order("created_at", desc=True).limit(10).execute()
print(res.data)
