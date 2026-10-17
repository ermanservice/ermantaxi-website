import { getStore } from '@netlify/blobs';

const store = getStore('erman-taxi-public-reviews');
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export default async (req) => {
  if (req.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  try {
    if (req.httpMethod === 'GET') {
      const reviews = (await store.get('reviews.json', { type: 'json' })) || [];
      return json(200, reviews.slice(0, 200));
    }
    if (req.httpMethod !== 'POST') return json(405, { error: 'Methode niet toegestaan.' });
    let input;
    try { input = JSON.parse(req.body || '{}'); }
    catch { return json(400, { error: 'Ongeldige aanvraag.' }); }
    if (typeof input.website !== 'undefined' && String(input.website).trim()) return json(200, { ok: true });
    const customer_name = String(input.customer_name || 'Anonieme klant').trim().slice(0, 80) || 'Anonieme klant';
    const rating = Number(input.rating);
    const review_text = String(input.review_text || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'Kies een beoordeling van 1 tot 5 sterren.' });
    if (review_text.length < 3 || review_text.length > 1500) return json(400, { error: 'De review moet 3 tot 1500 tekens bevatten.' });
    const reviews = (await store.get('reviews.json', { type: 'json' })) || [];
    const review = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, customer_name, rating, review_text, created_at: new Date().toISOString() };
    reviews.unshift(review);
    await store.setJSON('reviews.json', reviews.slice(0, 2000));
    return json(201, { ok: true, review });
  } catch (error) {
    console.error('Reviewfunctie mislukt:', error);
    return json(500, { error: 'Reviews zijn tijdelijk niet beschikbaar.' });
  }
};
