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
  
  // Special validation for Account SID
  if (name === 'TWILIO_ACCOUNT_SID' && !value.startsWith('AC')) {
    throw new Error(`Invalid TWILIO_ACCOUNT_SID: Must start with 'AC'`);
  }
  
  // Special validation for Verify Service SID
  if (name === 'TWILIO_VERIFY_SERVICE_SID' && !value.startsWith('VA')) {
    throw new Error(`Invalid TWILIO_VERIFY_SERVICE_SID: Must start with 'VA'`);
  }
  
  return value;
}

// Get environment variables with validation
let twilioAccountSid: string;
let twilioAuthToken: string;
let twilioVerifyServiceSid: string;

try {
  twilioAccountSid = getRequiredEnvVar('TWILIO_ACCOUNT_SID');
  twilioAuthToken = getRequiredEnvVar('TWILIO_AUTH_TOKEN');
  twilioVerifyServiceSid = getRequiredEnvVar('TWILIO_VERIFY_SERVICE_SID');
  
  console.log('Twilio environment variables validated successfully');
  console.log('Account SID starts with:', twilioAccountSid.substring(0, 5) + '...');
  console.log('Verify Service SID starts with:', twilioVerifyServiceSid.substring(0, 5) + '...');
} catch (error) {
  console.error('Twilio initialization error:', error);
  throw error;
}

// Initialize Twilio client with explicit region
const client = twilio(twilioAccountSid, twilioAuthToken, {
  region: 'us1', // or your region if different
  edge: 'ashburn', // optional: specify edge location if needed
});

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
