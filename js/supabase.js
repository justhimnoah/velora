import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://zjwwlmyxludgcpxrbexd.supabase.co/";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqd3dsbXl4bHVkZ2NweHJiZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDk1MzgsImV4cCI6MjA5NzY4NTUzOH0.4RJ8s-ytTG-bj7sf9EBtdti7szPM9wgYiQ4K4-FX0lg";

export const supabase = createClient(supabaseUrl, supabaseKey);