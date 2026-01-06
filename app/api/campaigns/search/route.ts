import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching campaigns...');

    // Try simple request first
    const url = `https://api.redtrack.io/campaigns?api_key=${apiKey}`;
    console.log('Fetching from /campaigns endpoint');

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch campaigns' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Response type:', typeof data);
    console.log('Response keys:', Object.keys(data));
    console.log('Has items?', 'items' in data);
    
    if (data.items) {
      console.log('Items length:', data.items.length);
      console.log('First item sample:', JSON.stringify(data.items[0], null, 2));
    }

    // Check if response has 'items' array
    if (data.items && Array.isArray(data.items)) {
      const campaigns = data.items.map((campaign: any) => ({
        id: campaign.id,
        serial_number: campaign.serial_number,
        name: campaign.title,
      })).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Total campaigns loaded: ${campaigns.length}`);

      return NextResponse.json({ campaigns });
    }

    // If data is directly an array
    if (Array.isArray(data)) {
      const campaigns = data.map((campaign: any) => ({
        id: campaign.id,
        serial_number: campaign.serial_number,
        name: campaign.title,
      })).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`Total campaigns loaded: ${campaigns.length}`);

      return NextResponse.json({ campaigns });
    }

    console.log('Unexpected response format:', data);
    return NextResponse.json({ campaigns: [] });

  } catch (error) {
    console.error('Campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}