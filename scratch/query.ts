import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));
const { data, error } = await supabase.from('patient_documents').select('file_path').ilike('file_name', '%.doc').limit(1);
console.log(data);
