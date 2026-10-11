import { supabase } from "../lib/supabase";

// Fallback data used only if the emergency_contacts table hasn't been seeded yet.
export const FALLBACK_HOTLINES = [
  { municipality: "Goa", agency: "PNP", phone_number: "0998-598-5992" },
  { municipality: "Goa", agency: "BFP", phone_number: "0999-702-7195" },
  { municipality: "Goa", agency: "MDRRMO", phone_number: "0912-656-7859" },
  { municipality: "San Jose", agency: "PNP", phone_number: "0909-609-2126" },
  { municipality: "San Jose", agency: "BFP", phone_number: "0948-921-2029" },
  { municipality: "San Jose", agency: "MDRRMO", phone_number: "0981-408-9990" },
  { municipality: "Lagonoy", agency: "PNP", phone_number: "0918-318-9108" },
  { municipality: "Lagonoy", agency: "BFP", phone_number: "0917-702-7195" },
  { municipality: "Lagonoy", agency: "MDRRMO", phone_number: "0932-214-3167" },
  { municipality: "Tigaon", agency: "PNP", phone_number: "0998-598-6001" },
  { municipality: "Tigaon", agency: "BFP", phone_number: "0909-257-4100" },
  { municipality: "Tigaon", agency: "MDRRMO", phone_number: "0917-105-9434" },
  { municipality: "Sangay", agency: "PNP", phone_number: "0998-598-5992" },
  { municipality: "Sangay", agency: "BFP", phone_number: "0999-702-7195" },
  { municipality: "Sangay", agency: "MDRRMO", phone_number: "0912-656-7859" },
];

export async function getHotlinesByMunicipality() {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("active", true)
    .order("municipality")
    .order("agency");

  const rows = error || !data?.length ? FALLBACK_HOTLINES : data;

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.municipality]) grouped[row.municipality] = [];
    grouped[row.municipality].push(row);
  }
  return grouped;
}
