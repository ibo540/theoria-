/**
 * Utilities for managing contributors in Supabase
 */

import { supabase } from "./supabase";

export interface Contributor {
  id?: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  event_count: number;
  role: "contributor" | "admin";
  created_at?: string;
  updated_at?: string;
  last_event_at?: string;
}

/**
 * Save or update a contributor in Supabase
 * Email and phone are optional (used for contributors; admins don't provide them)
 */
export async function saveContributorToSupabase(
  username: string,
  name: string,
  role: "contributor" | "admin" = "contributor",
  email?: string,
  phone?: string
): Promise<Contributor | null> {
  try {
    // Check if contributor already exists
    const { data: existing, error: fetchError } = await supabase
      .from("contributors")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking existing contributor:", fetchError);
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      name,
      role,
      updated_at: now,
    };
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;

    if (existing) {
      // Update existing contributor
      const { data, error } = await supabase
        .from("contributors")
        .update(updatePayload)
        .eq("username", username)
        .select()
        .single();

      if (error) {
        console.error("Error updating contributor:", error);
        return null;
      }

      return data as Contributor;
    } else {
      // Create new contributor
      const insertPayload: Record<string, unknown> = {
        username,
        name,
        role,
        event_count: 0,
        created_at: now,
        updated_at: now,
      };
      if (email !== undefined) insertPayload.email = email;
      if (phone !== undefined) insertPayload.phone = phone;

      const { data, error } = await supabase
        .from("contributors")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Error creating contributor:", error);
        return null;
      }

      return data as Contributor;
    }
  } catch (error) {
    console.error("Error saving contributor to Supabase:", error);
    return null;
  }
}

/**
 * Increment event count for a contributor
 */
export async function incrementContributorEventCount(
  username: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // First, get current event count
    const { data: contributor, error: fetchError } = await supabase
      .from("contributors")
      .select("event_count")
      .eq("username", username)
      .maybeSingle();

    if (fetchError || !contributor) {
      console.error("Error fetching contributor:", fetchError);
      return false;
    }

    // Increment event count
    const { error } = await supabase
      .from("contributors")
      .update({
        event_count: (contributor.event_count || 0) + 1,
        last_event_at: now,
        updated_at: now,
      })
      .eq("username", username);

    if (error) {
      console.error("Error incrementing contributor event count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing contributor event count:", error);
    return false;
  }
}

/**
 * Fetch all contributors, ranked by event count
 */
export async function fetchContributors(): Promise<Contributor[]> {
  try {
    const { data, error } = await supabase
      .from("contributors")
      .select("*")
      .order("event_count", { ascending: false })
      .order("last_event_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching contributors:", error);
      return [];
    }

    return (data || []) as Contributor[];
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return [];
  }
}

/**
 * Get contributor by username
 */
export async function getContributorByUsername(
  username: string
): Promise<Contributor | null> {
  try {
    const { data, error } = await supabase
      .from("contributors")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error fetching contributor:", error);
      return null;
    }

    return data as Contributor | null;
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return null;
  }
}
