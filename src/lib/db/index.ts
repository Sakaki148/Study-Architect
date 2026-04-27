// ============================================
// Database - Supabase Storage Layer
// ============================================

import { supabase } from '../supabaseClient';

export async function readCollection<T>(collection: string): Promise<T[]> {
  const { data, error } = await supabase.from(collection).select('data');
  if (error) {
    console.error(`Error reading ${collection}:`, error);
    return [];
  }
  return data.map((row: any) => row.data as T);
}

export async function findById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
  const { data, error } = await supabase.from(collection).select('data').eq('id', id).single();
  if (error || !data) {
    if (error?.code !== 'PGRST116') { // Ignore zero rows error
      console.error(`Error finding id ${id} in ${collection}:`, error);
    }
    return null;
  }
  return data.data as T;
}

export async function insertOne<T extends { id: string; sessionId?: string }>(collection: string, item: T): Promise<T> {
  const sessionId = item.sessionId || null;
  const { error } = await supabase.from(collection).insert({
    id: item.id,
    session_id: sessionId,
    data: item
  });
  if (error) {
    console.error(`Error inserting into ${collection}:`, error);
    throw error;
  }
  return item;
}

export async function updateOne<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
  const existing = await findById<T>(collection, id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };

  const { error } = await supabase.from(collection).update({
    data: merged
  }).eq('id', id);

  if (error) {
    console.error(`Error updating in ${collection}:`, error);
    return null;
  }
  return merged;
}

export async function deleteOne(collection: string, id: string): Promise<boolean> {
  const { error } = await supabase.from(collection).delete().eq('id', id);
  if (error) {
    console.error(`Error deleting from ${collection}:`, error);
    return false;
  }
  return true;
}

export async function findByField<T extends Record<string, any>>(
  collection: string,
  field: string,
  value: unknown
): Promise<T[]> {
  if (field === 'sessionId') {
    const { data, error } = await supabase.from(collection).select('data').eq('session_id', String(value));
    if (error) {
      console.error(`Error finding by session_id in ${collection}:`, error);
      return [];
    }
    return data.map((row: any) => row.data as T);
  }
  
  const { data, error } = await supabase.from(collection).select('data').eq(`data->>${field}`, String(value));
  if (error) {
    console.error(`Error finding by JSON field in ${collection}:`, error);
    return [];
  }
  return data.map((row: any) => row.data as T);
}
