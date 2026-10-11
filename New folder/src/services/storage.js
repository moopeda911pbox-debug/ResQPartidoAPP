import { supabase } from "../lib/supabase";

const BUCKET = "incident-media";

export async function uploadIncidentFile(userId, incidentId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${incidentId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
