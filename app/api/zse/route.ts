import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.afristox.com/api/exchanges/zse', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js App)',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`ZSE API returned status ${response.status}. Returning fallback data.`);
      return NextResponse.json({ success: true, stocks: [], message: 'Fallback data used due to API error' });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ZSE data:', error);
    return NextResponse.json(
      { success: false, stocks: [], error: 'Failed to fetch ZSE data' },
      { status: 200 }
    );
  }
}