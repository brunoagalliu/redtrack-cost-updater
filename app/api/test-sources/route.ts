import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.redtrack.io/sources?api_key=${apiKey}`);
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error, status: response.status });
    }

    const data = await response.json();
    
    // Log the structure
    console.log('Sources response type:', typeof data);
    console.log('Sources response keys:', Object.keys(data));
    
    if (data.items && Array.isArray(data.items)) {
      console.log('First source sample:', JSON.stringify(data.items[0], null, 2));
    } else if (Array.isArray(data)) {
      console.log('First source sample:', JSON.stringify(data[0], null, 2));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}