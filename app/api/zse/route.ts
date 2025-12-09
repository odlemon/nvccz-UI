import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.afristox.com/api/exchanges/zseuse', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js App)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ZSE data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZSE data' },
      { status: 500 }
    );
  }
}