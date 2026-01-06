import { NextResponse } from 'next/server';

interface Campaign {
  id: string;
  serial_number: number;
  name: string;
}

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

    const url = `https://api.redtrack.io/campaigns?api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch campaigns' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.items && Array.isArray(data.items)) {
      const campaigns: Campaign[] = data.items.map((campaign: any) => ({
        id: campaign.id,
        serial_number: campaign.serial_number,
        name: campaign.title,
      })).sort((a: Campaign, b: Campaign) => a.name.localeCompare(b.name));

      console.log(`Total campaigns loaded: ${campaigns.length}`);

      return NextResponse.json({ campaigns });
    }

    if (Array.isArray(data)) {
      const campaigns: Campaign[] = data.map((campaign: any) => ({
        id: campaign.id,
        serial_number: campaign.serial_number,
        name: campaign.title,
      })).sort((a: Campaign, b: Campaign) => a.name.localeCompare(b.name));

      console.log(`Total campaigns loaded: ${campaigns.length}`);

      return NextResponse.json({ campaigns });
    }

    console.log('Unexpected response format');
    return NextResponse.json({ campaigns: [] });

  } catch (error) {
    console.error('Campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}