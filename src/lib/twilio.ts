import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Validate environment variables at module load time
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const twilioAccountSid = getRequiredEnvVar('TWILIO_ACCOUNT_SID');
const twilioAuthToken = getRequiredEnvVar('TWILIO_AUTH_TOKEN');
const twilioVerifyServiceSid = getRequiredEnvVar('TWILIO_VERIFY_SERVICE_SID');

const client = twilio(twilioAccountSid, twilioAuthToken);

export async function sendVerificationCode(phoneNumber: string) {
  try {
    const verification = await client.verify.v2
      .services(twilioVerifyServiceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });
    
    return { success: true, sid: verification.sid };
  } catch (error) {
    console.error('Twilio verification error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send verification code' };
  }
}

export async function verifyCode(phoneNumber: string, code: string) {
  try {
    const verificationCheck = await client.verify.v2
      .services(twilioVerifyServiceSid)
      .verificationChecks
      .create({ to: phoneNumber, code });

    return { 
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status 
    };
  } catch (error) {
    console.error('Twilio verification check error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to verify code' };
  }
}
