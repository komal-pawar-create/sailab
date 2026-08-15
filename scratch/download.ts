import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));
const { data, error } = await supabase.storage.from('lab-files').download('documents/e240b3ff-2436-47b7-bbdb-9c322b64d142/f4122d43-500e-4dff-bc6f-be6008cd485f/MR_NAMDEV_MUSMADE_1785244507259.doc');
if (error) { console.error(error); Deno.exit(1); }
const buffer = await data.arrayBuffer();
Deno.writeFileSync('scratch/test.doc', new Uint8Array(buffer));
console.log('Downloaded test.doc');
