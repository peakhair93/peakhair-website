export default async function handler(request, response) {
  if (request.method === 'GET') {
    return response.status(200).json({ status: 'ready' });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Acknowledge delivery promptly. Add webhook signature verification before
  // processing data from RankPill when its signing secret is available.
  console.log('RankPill webhook received', {
    contentType: request.headers['content-type'],
  });

  return response.status(200).json({ received: true });
}
