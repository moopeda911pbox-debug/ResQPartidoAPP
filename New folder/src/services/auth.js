import { supabase } from "../lib/supabase";
import { clearPushToken } from "../lib/pushNotifications";

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile } = await supabase.from("profiles").select("is_archived").eq("id", data.user.id).single();
  if (profile?.is_archived) {
    await supabase.auth.signOut();
    throw new Error("This account has been archived. Contact an administrator to have it restored.");
  }

  return data;
}

export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// provider: "google" | "facebook"
export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/home` },
  });
  if (error) throw error;
}

/**
 * Creates the auth user, then writes the extended profile row.
 * profile: { first_name, last_name, phone, date_of_birth, address, gender, municipality }
 *
 * The profile fields are passed as signup metadata so the server-side
 * `handle_new_user` trigger (supabase/profile_trigger.sql) can write the
 * complete profiles row itself, bypassing RLS. That trigger fires
 * regardless of whether "Confirm email" is on, so the account is never
 * left with a missing/partial profile.
 *
 * If signUp() returns an active session (i.e. email confirmation is off),
 * we also upsert directly as a fast-path / defensive backup — this is safe
 * because it's now the same data the trigger already wrote.
 */
export async function signUpWithProfile({ email, password, profile }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: profile },
  });
  if (error) throw error;

  const userId = data.user?.id;
  // Only attempt the client-side write if we actually have an authenticated
  // session — without one, auth.uid() is null and the "profiles: insert
  // own" RLS policy (auth.uid() = id) rejects it. No session simply means
  // email confirmation is required; the trigger already covered the
  // profile in that case, so there's nothing to do here.
  if (userId && data.session) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, ...profile }, { onConflict: "id" });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signOut() {
  // Fetched here (rather than passed in) so every existing call site
  // (Settings, Home) gets the fix for free with no change on their end.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (userId) await clearPushToken(userId);

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
