import { verifyCode } from '@/lib/twilio';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();
    
    if (!phoneNumber || !code) {
      console.error('Missing required fields:', { phoneNumber: !!phoneNumber, code: !!code });
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    console.log('Verifying OTP for:', phoneNumber);
    console.log('Using Verify Service SID:', process.env.TWILIO_VERIFY_SERVICE_SID);
    
    const verificationCheck = await verifyCode(phoneNumber, code).catch(error => {
      console.error('Twilio Verify Error:', error);
      throw new Error(`Twilio verification failed: ${error.message}`);
    });
    
    console.log('Verification response:', verificationCheck);

    if (verificationCheck.status === 'approved') {
      return NextResponse.json({ success: true });
    } else {
      console.error('Verification failed:', verificationCheck.status);
      return NextResponse.json(
        { 
          error: 'Invalid verification code',
          details: verificationCheck.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify OTP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
