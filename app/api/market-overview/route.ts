import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiToken = '65ub9uNRojnZvn0Fp96B3cBVtifiMFtXGQFQ9a49';
    const symbols = 'AAPL,TSLA,MSFT';

    const response = await fetch(`https://api.stockdata.org/v1/data/quote?symbols=${symbols}&api_token=${apiToken}`, {
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
    console.error('Error fetching market overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview data' },
      { status: 500 }
    );
  }
}