import { supabase } from "../lib/supabase";
import { uploadIncidentFile } from "./storage";

/**
 * Creates an incident row, uploads any attached files to Storage, then
 * writes matching rows into incident_media.
 *
 * report: {
 *   incidentType, description, latitude, longitude, address,
 *   photoFile?, videoFile?
 * }
 */
export async function submitIncidentReport(userId, report) {
  const { data: incident, error } = await supabase
    .from("incidents")
    .insert({
      user_id: userId,
      incident_type: report.incidentType,
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.address ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  const mediaRows = [];

  if (report.photoFile) {
    const url = await uploadIncidentFile(userId, incident.id, report.photoFile);
    mediaRows.push({ incident_id: incident.id, file_url: url, file_type: "photo" });
  }
  if (report.videoFile) {
    const url = await uploadIncidentFile(userId, incident.id, report.videoFile);
    mediaRows.push({ incident_id: incident.id, file_url: url, file_type: "video" });
  }

  if (mediaRows.length) {
    const { error: mediaError } = await supabase.from("incident_media").insert(mediaRows);
    if (mediaError) throw mediaError;
  }

  return incident;
}

export async function getMyIncidents(userId) {
  const { data, error } = await supabase
    .from("incidents")
    .select("*, incident_media(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
