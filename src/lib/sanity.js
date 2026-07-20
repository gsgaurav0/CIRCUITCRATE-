/**
 * Sanity CMS REST Client Helper (Vite Front-end)
 * Avoiding heavy npm packages like @sanity/client by using direct HTTP fetch requests.
 */

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const API_VERSION = 'v2021-10-21';

/**
 * Fetch all project documents from Sanity CMS
 */
export async function fetchProjectsFromSanity() {
  if (!PROJECT_ID) {
    console.log('Sanity project ID not configured, bypassing Sanity fetching.');
    return null;
  }

  const query = encodeURIComponent(`*[_type == "project"] | order(created_at desc)`);
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${query}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Sanity HTTP fetch failed with status: ${res.status}`);
    }
    const data = await res.json();
    return data.result || [];
  } catch (error) {
    console.warn('Failed to retrieve projects from Sanity CMS, will fallback.', error);
    return null;
  }
}
