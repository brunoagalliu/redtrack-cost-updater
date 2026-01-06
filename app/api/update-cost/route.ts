import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== UPDATE COST REQUEST ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // First, try to get the serial number for this campaign
    const campaignsResponse = await fetch(
      `https://api.redtrack.io/campaigns?api_key=${apiKey}`
    );

    let campaignSerial = body.campaign_id;

    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      if (campaignsData.items && Array.isArray(campaignsData.items)) {
        const campaign = campaignsData.items.find((c: any) => c.id === body.campaign_id);
        if (campaign) {
          campaignSerial = campaign.serial_number.toString();
          console.log('Found campaign serial:', campaignSerial);
        }
      }
    }

    // Convert dates to ISO 8601 format with timezone
    const timeFrom = new Date(body.time_from + 'T00:00:00Z').toISOString();
    const timeTo = new Date(body.time_to + 'T23:59:59Z').toISOString();

    console.log('Formatted time_from:', timeFrom);
    console.log('Formatted time_to:', timeTo);

    const params = new URLSearchParams({
      api_key: apiKey,
      time_from: timeFrom,
      time_to: timeTo,
      cost: body.cost.toString(),
      campaign_id: campaignSerial,
      currency: 'USD',
    });

    if (body.country_code) params.append('country_code', body.country_code);
    if (body.sub_name) params.append('sub_name', body.sub_name);
    if (body.sub_value) params.append('sub_value', body.sub_value);

    const url = `https://api.redtrack.io/tracks/cost?${params.toString()}`;
    console.log('Request URL (api_key hidden):', url.replace(apiKey, 'API_KEY'));
    
    const response = await fetch(url, { method: 'POST' });

    console.log('Response status:', response.status);

    if (!response.ok) {
      // Only try to parse JSON if there's an error
      const data = await response.json();
      console.log('Error response data:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to update cost' },
        { status: response.status }
      );
    }

    // Success - API returns empty body on 200
    console.log('Cost updated successfully!');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cost update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}