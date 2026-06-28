export const config = { runtime: 'edge' };

export default async function handler (req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const join = arr => (Array.isArray(arr) ? arr.join(', ') : arr || '');

  const fields = {
    'Submitted At':     data.createdAt                 || new Date().toISOString(),
    'Group':            data.group                     || '',
    'Name':             data.name                      || '',
    'Email':            data.email                     || '',
    'Dinner Dates':     join(data.availableDates),
    'Dietary Notes':    data.foodDrinkPreferences      || '',
    'Interests':        join(data.selectedInterests),
    'Wants More Of':    join(data.desiredMoreOf),
    'Ink blot choice':  data.inkblotChoice             || '',
    'Fruit Choice':     data.fruitChoice               || '',
    'Dinner Style':     join(data.dinnerStyle),
    'Ideal Neighbour':  join(data.preferredSeatmateTraits),
    'Shocking Fact':    data.shockingFact              || '',
    'Cocktail Choice':  data.cocktailChoice            || '',
    'Network Referral': data.networkReferral           || '',
  };

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.json();
      console.error('Airtable error:', JSON.stringify(err));
      return new Response(JSON.stringify({ error: err?.error?.message || 'Airtable error', detail: err }), {
        status: airtableRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Submission failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
