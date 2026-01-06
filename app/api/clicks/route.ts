import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Convert dates to ISO format
    const timeFrom = new Date(body.date_from + 'T00:00:00Z').toISOString();
    const timeTo = new Date(body.date_to + 'T23:59:59Z').toISOString();

    const params = new URLSearchParams({
      api_key: apiKey,
      date_from: timeFrom,
      date_to: timeTo,
      campaign_id: body.campaign_id,
      per: '100', // Get first 100 clicks
    });

    const response = await fetch(
      `https://api.redtrack.io/tracks?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch clicks' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the data
    const clicks = Array.isArray(data) ? data.map((click: any) => ({
      clickid: click.clickid || click.click_id,
      created_at: click.created_at,
      campaign_name: click.campaign_name || click.campaign,
    })) : [];

    return NextResponse.json({ clicks });
  } catch (error) {
    console.error('Clicks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}