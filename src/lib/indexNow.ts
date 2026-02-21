import { supabase } from "@/integrations/supabase/client";

export async function submitToIndexNow(slugs: string[]) {
  const urls = slugs.map((s) => `/blog/${s}`);
  const { data, error } = await supabase.functions.invoke("submit-indexnow", {
    body: { urls },
  });
  return { data, error };
}
