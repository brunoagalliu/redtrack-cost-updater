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

    // Default to "Conversion" if type is not provided or empty
    const conversionType = body.type && body.type.trim() !== '' ? body.type : 'Conversion';

    // Try sending as an array (common pattern for bulk APIs)
    const payload = [{
      campaign_id: body.campaign_id,
      clickid: body.clickid,
      created_at: body.created_at,
      payout: body.payout,
      type: conversionType,
    }];

    console.log('Sending payload as array:', JSON.stringify(payload, null, 2));

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
      
      // If array didn't work, try as single object
      console.log('Retrying as single object...');
      
      const singlePayload = {
        campaign_id: body.campaign_id,
        clickid: body.clickid,
        created_at: body.created_at,
        payout: body.payout,
        type: conversionType,
      };
      
      const retryResponse = await fetch(
        `https://api.redtrack.io/conversions?api_key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(singlePayload),
        }
      );
      
      console.log('Retry response status:', retryResponse.status);
      
      if (!retryResponse.ok) {
        const retryError = await retryResponse.json();
        console.log('Retry error response:', retryError);
        return NextResponse.json(
          { error: retryError.error || 'Failed to update revenue' },
          { status: retryResponse.status }
        );
      }
      
      console.log('Revenue updated successfully (retry)!');
      return NextResponse.json({ success: true });
    }

    // Success on first try
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