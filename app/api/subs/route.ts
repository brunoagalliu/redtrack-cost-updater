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

    // Get last 30 days of data to find sub names
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    // Fetch report grouped by sub parameters to see which ones are used
    const params = new URLSearchParams({
      api_key: apiKey,
      group: 'sub1,sub2,sub3,sub4,sub5',
      date_from: dateFromStr,
      date_to: dateTo,
      per: '100',
    });

    const response = await fetch(
      `https://api.redtrack.io/report?${params.toString()}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch subs data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract unique sub names that have data
    const subNames = new Set<string>();
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((row: any) => {
        // Check which sub fields have values
        for (let i = 1; i <= 20; i++) {
          const subKey = `sub${i}`;
          if (row[subKey]) {
            subNames.add(subKey);
          }
        }
      });
    }

    // Convert to array and format
    const subs = Array.from(subNames).map(name => ({
      value: name,
      label: name.replace('sub', 'Sub ').toUpperCase()
    }));

    // Add common RT parameters
    const commonSubs = [
      { value: 'rt_source', label: 'RT Source' },
      { value: 'rt_medium', label: 'RT Medium' },
      { value: 'rt_campaign', label: 'RT Campaign' },
      { value: 'rt_adgroup', label: 'RT Adgroup' },
      { value: 'rt_ad', label: 'RT Ad' },
      { value: 'rt_placement', label: 'RT Placement' },
      { value: 'rt_keyword', label: 'RT Keyword' },
    ];

    return NextResponse.json({
      subs: [...subs, ...commonSubs]
    });
  } catch (error) {
    console.error('Subs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}