import { NextResponse } from 'next/server';

// Simple in-memory cache for source
let sourceCache: any | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SOURCE_ID = '65c405dd0de7ed0001f5d3b8'; // Your single source

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { campaignId } = await params;
    
    console.log(`Fetching subs for campaign ID: ${campaignId}`);

    // Get report data to see which subs have data
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    const searchParams = new URLSearchParams({
      api_key: apiKey,
      group: 'sub1,sub2,sub3,sub4,sub5',
      date_from: dateFromStr,
      date_to: dateTo,
      campaign_id: campaignId,
      per: '100',
    });

    const reportResponse = await fetch(
      `https://api.redtrack.io/report?${searchParams.toString()}`
    );

    const subNamesWithData = new Set<string>();

    if (reportResponse.ok) {
      const data = await reportResponse.json();
      
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((row: any) => {
          for (let i = 1; i <= 5; i++) {
            const subKey = `sub${i}`;
            if (row[subKey] && row[subKey] !== '' && row[subKey] !== null) {
              subNamesWithData.add(subKey);
            }
          }
        });
      }
    }

    console.log('Subs with data:', Array.from(subNamesWithData));

    // Get parameter names from the source
    let parameterNames: { [key: string]: string } = {};

    const now = Date.now();

    // Cache the source
    if (!sourceCache || (now - cacheTime) > CACHE_DURATION) {
      console.log('Fetching source...');
      const sourcesResponse = await fetch(
        `https://api.redtrack.io/sources?api_key=${apiKey}`
      );

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        if (Array.isArray(sourcesData)) {
          sourceCache = sourcesData.find((s: any) => s.id === SOURCE_ID);
          cacheTime = now;
        }
      }
    }

    if (sourceCache) {
      console.log('Using source:', sourceCache.title);
      
      if (sourceCache.subs && Array.isArray(sourceCache.subs)) {
        sourceCache.subs.forEach((sub: any, index: number) => {
          const paramName = sub.alias || sub.hint;
          if (paramName && paramName.trim() !== '') {
            parameterNames[`sub${index + 1}`] = paramName;
          }
        });
      }
    }

    console.log('Parameter mappings:', parameterNames);

    // Build subs array with actual parameter names
    const subs = [];
    for (let i = 1; i <= 5; i++) {
      const subKey = `sub${i}`;
      if (subNamesWithData.has(subKey)) {
        const paramName = parameterNames[subKey];
        subs.push({
          value: subKey,
          label: paramName ? `Sub${i}: ${paramName}` : `Sub${i}`,
        });
      }
    }

    console.log('Final subs:', subs);

    return NextResponse.json({ subs });
  } catch (error) {
    console.error('Subs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}