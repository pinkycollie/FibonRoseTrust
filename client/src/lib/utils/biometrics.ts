/**
 * Biometric authentication utilities for FibonroseTrust
 * 
 * This module provides utilities for web-based biometric authentication
 * using the Web Authentication API (WebAuthn)
 */

// Types for biometric credentials
export interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'voice' | 'other';
  createdAt: Date;
  lastUsed?: Date;
}

// Check if the browser supports WebAuthn
export function isBiometricsSupported(): boolean {
  return window.PublicKeyCredential !== undefined && 
         typeof window.PublicKeyCredential === 'function';
}

// Encode a string to base64url format
function encodeBase64Url(data: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decode a base64url string to ArrayBuffer
function decodeBase64Url(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Generate a random challenge
export async function generateChallenge(): Promise<ArrayBuffer> {
  const array = new Uint8Array(32); // 32 bytes for challenge
  window.crypto.getRandomValues(array);
  return array.buffer;
}

// Register a new biometric credential
export async function registerBiometric(
  userId: string,
  username: string,
  displayName: string,
  credentialType: 'fingerprint' | 'face' | 'voice' | 'other' = 'fingerprint'
): Promise<BiometricCredential | null> {
  try {
    // Check if biometrics are supported
    if (!isBiometricsSupported()) {
      throw new Error('Biometric authentication is not supported in this browser');
    }
    
    // Generate challenge
    const challenge = await generateChallenge();
    
    // Create credential creation options
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'FibonroseTrust',
        id: window.location.hostname
      },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: username,
        displayName: displayName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000, // 1 minute
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (like Touch ID, Face ID)
        userVerification: 'preferred',
        requireResidentKey: false
      }
    };
    
    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to create credential');
    }
    
    // Process the credential
    const response = credential.response as AuthenticatorAttestationResponse;
    const clientDataJSON = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
    
    // Extract the credential ID
    const credentialId = encodeBase64Url(credential.rawId);
    
    // This would typically be sent to server for verification
    // For this demo, we're just returning a simulated response
    
    return {
      id: credentialId,
      type: credentialType,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error registering biometric:', error);
    return null;
  }
}

// Verify a biometric credential
export async function verifyBiometric(
  credentialId: string
): Promise<boolean> {
  try {
    // Check if biometrics are supported
    if (!isBiometricsSupported()) {
      throw new Error('Biometric authentication is not supported in this browser');
    }
    
    // Generate challenge
    const challenge = await generateChallenge();
    
    // Create credential request options
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: decodeBase64Url(credentialId),
        type: 'public-key',
        transports: ['internal']
      }],
      timeout: 60000, // 1 minute
      userVerification: 'preferred'
    };
    
    // Get the credential
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to get credential');
    }
    
    // Process the credential
    const response = credential.response as AuthenticatorAssertionResponse;
    const clientDataJSON = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
    
    // This would typically be sent to server for verification
    // For this demo, we're just returning true if we got a credential
    
    return true;
  } catch (error) {
    console.error('Error verifying biometric:', error);
    return false;
  }
}

// Simulated function to get existing biometric credentials for a user
export async function getUserBiometrics(userId: string): Promise<BiometricCredential[]> {
  // This would typically fetch from a server API
  // For this demo, we're simulating a response
  
  // Check localStorage for previously registered credentials
  const storedCredentials = localStorage.getItem(`biometric_${userId}`);
  if (storedCredentials) {
    return JSON.parse(storedCredentials).map((cred: any) => ({
      ...cred,
      createdAt: new Date(cred.createdAt),
      lastUsed: cred.lastUsed ? new Date(cred.lastUsed) : undefined
    }));
  }
  
  return [];
}

// Save a biometric credential to localStorage (for demo purposes)
export async function saveBiometricCredential(
  userId: string,
  credential: BiometricCredential
): Promise<void> {
  const existingCredentials = await getUserBiometrics(userId);
  const updatedCredentials = [...existingCredentials, credential];
  
  localStorage.setItem(
    `biometric_${userId}`,
    JSON.stringify(updatedCredentials)
  );
}

// Delete a biometric credential
export async function deleteBiometricCredential(
  userId: string,
  credentialId: string
): Promise<boolean> {
  try {
    const existingCredentials = await getUserBiometrics(userId);
    const updatedCredentials = existingCredentials.filter(
      cred => cred.id !== credentialId
    );
    
    localStorage.setItem(
      `biometric_${userId}`,
      JSON.stringify(updatedCredentials)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting biometric credential:', error);
    return false;
  }
}