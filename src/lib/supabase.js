import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchFromSupabase(table, orderBy = 'created_at') {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${orderBy}.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn(`Failed to fetch from table "${table}" in Supabase, using fallback.`, error);
    return null;
  }
}

export async function postToSupabase(table, data) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, body: ${errText}`);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await res.text();
      return text ? JSON.parse(text) : true;
    }
    return true;
  } catch (error) {
    console.error(`Failed to post to table "${table}" in Supabase.`, error);
    return null;
  }
}

export function resolveImageUrl(url) {
  if (!url) return '';
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlObj = new URL(trimmed);
      const imgUrlParam = urlObj.searchParams.get('imgurl');
      if (imgUrlParam) {
        return decodeURIComponent(imgUrlParam);
      }
      const mediaUrlParam = urlObj.searchParams.get('mediaurl');
      if (mediaUrlParam) {
        return decodeURIComponent(mediaUrlParam);
      }
    }
  } catch {
    // Ignore error and return original
  }
  return url;
}
