import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.REDTRACK_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('id');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }

    // Get last 365 days to search for this specific campaign
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 365);
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    const params = new URLSearchParams({
      api_key: apiKey,
      group: 'campaign',
      date_from: dateFromStr,
      date_to: dateTo,
      campaign_id: campaignId,
      per: '1',
    });

    const url = `https://api.redtrack.io/report?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch campaign' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const row = data[0];
      const campaign = {
        id: row.campaign_id || row.campaignId || row.id,
        name: row.campaign_name || row.campaignName || row.name || row.campaign,
      };
      
      return NextResponse.json({ campaign });
    }

    return NextResponse.json({ campaign: null });
  } catch (error) {
    console.error('Campaign search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}