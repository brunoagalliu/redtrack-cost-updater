import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== FETCH CLICKS REQUEST ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Try simple date format first (YYYY-MM-DD)
    const params = new URLSearchParams({
      api_key: apiKey,
      date_from: body.date_from,
      date_to: body.date_to,
      campaign_id: body.campaign_id,
      per: '100',
    });

    const url = `https://api.redtrack.io/tracks?${params.toString()}`;
    console.log('Request URL (key hidden):', url.replace(apiKey, 'API_KEY'));

    const response = await fetch(url);

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch clicks' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Response data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log('Number of clicks:', data.length);
      if (data.length > 0) {
        console.log('First click sample:', JSON.stringify(data[0], null, 2));
      }
    }
    
    // Transform the data
    const clicks = Array.isArray(data) ? data.map((click: any) => ({
      clickid: click.clickid || click.click_id,
      created_at: click.created_at,
      campaign_name: click.campaign_name || click.campaign,
    })) : [];

    console.log('Returning clicks:', clicks.length);

    return NextResponse.json({ clicks });
  } catch (error) {
    console.error('Clicks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}