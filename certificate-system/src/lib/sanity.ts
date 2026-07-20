/**
 * Sanity CMS REST Client Helper (Next.js TypeScript App)
 * Directly handles CRUD operations against Sanity CMS API.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const WRITE_TOKEN = process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN;
const API_VERSION = 'v2021-10-21';

/**
 * Fetch all project documents from Sanity CMS
 */
export async function fetchProjectsFromSanity(): Promise<any[] | null> {
  if (!PROJECT_ID) {
    console.log('Sanity project ID not configured, bypassing projects fetch.');
    return null;
  }

  const query = encodeURIComponent(`*[_type == "project"] | order(created_at desc)`);
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${query}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Sanity HTTP fetch failed: ${res.status}`);
    }
    const data = await res.json();
    return data.result || [];
  } catch (error) {
    console.warn('Failed to retrieve projects from Sanity CMS:', error);
    return null;
  }
}

/**
 * Create or replace a project document in Sanity CMS
 */
export async function saveProjectToSanity(project: any): Promise<boolean> {
  if (!PROJECT_ID || !WRITE_TOKEN) {
    console.log('Sanity configuration or write token missing. Bypassing Sanity write.');
    return false;
  }

  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`;

  const mutation = {
    mutations: [
      {
        createOrReplace: {
          _type: 'project',
          _id: project.id,
          title: project.title,
          category: project.category,
          difficulty: project.difficulty,
          time_est: project.time_est,
          desc_text: project.desc_text,
          image: project.image,
          tools: project.tools,
          steps: project.steps
        }
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WRITE_TOKEN}`
      },
      body: JSON.stringify(mutation)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Sanity HTTP save failed: ${res.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error('Error writing to Sanity CMS:', error);
    return false;
  }
}

/**
 * Delete a project document from Sanity CMS
 */
export async function deleteProjectFromSanity(id: string): Promise<boolean> {
  if (!PROJECT_ID || !WRITE_TOKEN) {
    console.log('Sanity configuration or write token missing. Bypassing Sanity delete.');
    return false;
  }

  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`;

  const mutation = {
    mutations: [
      {
        delete: {
          id: id
        }
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WRITE_TOKEN}`
      },
      body: JSON.stringify(mutation)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Sanity HTTP delete failed: ${res.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting from Sanity CMS:', error);
    return false;
  }
}
