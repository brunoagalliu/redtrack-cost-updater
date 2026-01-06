import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== UPDATE REVENUE REQUEST ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const payload = {
      campaign_id: body.campaign_id,
      clickid: body.clickid,
      created_at: new Date().toISOString(),
      payout: body.payout,
      type: body.type,
    };

    console.log('Sending payload:', payload);

    const response = await fetch(
      `https://api.redtrack.io/conversions?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error response:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to update revenue' },
        { status: response.status }
      );
    }

    // Success
    console.log('Revenue updated successfully!');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Revenue update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}