import { NextResponse } from 'next/server';
import { verifyCode } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();
    
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    const result = await verifyCode(phoneNumber, code);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Invalid verification code',
          status: result.status
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      status: result.status
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
