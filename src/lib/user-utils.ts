/**
 * User utility functions for saving and loading users from Supabase
 */

import { supabase } from "@/lib/supabase";

export interface UserData {
  username: string;
  name: string;
  created_at?: string;
}

/**
 * Save or update user in Supabase
 * Uses upsert to handle both new users and existing users
 */
export async function saveUserToSupabase(username: string, name: string): Promise<void> {
  try {
    const userData: UserData = {
      username: username.trim(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    console.log("💾 Saving user to Supabase:", { username, name });

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('username, created_at')
      .eq('username', userData.username)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking for existing user:", fetchError);
      // Continue anyway - we'll try to insert
    }

    // If user exists, preserve their original created_at
    if (existingUser && existingUser.created_at) {
      userData.created_at = existingUser.created_at;
    }

    // Upsert (insert or update) user
    // Note: Supabase upsert requires all columns or we need to specify which ones to update
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          username: userData.username,
          name: userData.name,
          created_at: userData.created_at,
        },
        { 
          onConflict: 'username',
          ignoreDuplicates: false // Update if exists
        }
      )
      .select(); // Request data back to verify

    if (error) {
      console.error("❌ Error saving user to Supabase:", {
        error,
        message: error.message,
        code: error.code,
        username,
      });

      // Check if it's an RLS error
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.error("🔒 RLS Policy Error: Check your Supabase Row Level Security policies for the 'users' table.");
        console.error("   Make sure INSERT and UPDATE policies are enabled for 'anon' role.");
      }

      // Don't throw - user login should still work even if Supabase save fails
      console.warn("⚠️ User saved to localStorage only. Not saved to Supabase.");
      return;
    }

    console.log("✅ User saved successfully to Supabase:", {
      username: userData.username,
      name: userData.name,
      data,
    });
  } catch (error) {
    console.error("Error saving user to Supabase:", error);
    // Don't throw - allow login to continue even if Supabase save fails
    console.warn("⚠️ User saved to localStorage only. Not saved to Supabase.");
  }
}

/**
 * Get all users from Supabase
 */
export async function getAllUsersFromSupabase(): Promise<UserData[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading users from Supabase:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}
