// Sync user data from marketing site to main telehealth app

interface PatientData {
  userId: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    dob: string;
    address: unknown;
    insurance: unknown;
    preferredContact: string;
  };
}

interface ClinicianData {
  userId: string;
  email: string;
  phone: string;
  npi: string;
  profile: {
    fullName: string;
  };
  allowedStates: string[];
  licenses: unknown[];
  specialties: string[];
}

/**
 * Sync patient data to main app after verification
 */
export async function syncPatientToMainApp(patientData: PatientData) {
  const MAIN_APP_API = process.env.MAIN_APP_API_URL || 'https://api.eudaura.com';
  const API_KEY = process.env.MAIN_APP_API_KEY || '';

  try {
    const response = await fetch(`${MAIN_APP_API}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Source': 'marketing-site',
      },
      body: JSON.stringify({
        userId: patientData.userId,
        role: 'PATIENT',
        email: patientData.email,
        phone: patientData.phone,
        profile: patientData.profile,
        source: 'marketing_signup',
        autoApproved: true, // Patients are auto-approved
        sendWelcomeEmail: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync patient to main app');
    }

    const result = await response.json();
    
    console.log('✅ Patient synced to main app:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Failed to sync patient to main app:', error);
    // Don't fail the signup if main app sync fails
    // Store in queue for retry or manual sync
    return { success: false, error };
  }
}

/**
 * Sync clinician data to main app after admin approval
 */
export async function syncClinicianToMainApp(clinicianData: ClinicianData) {
  const MAIN_APP_API = process.env.MAIN_APP_API_URL || 'https://api.eudaura.com';
  const API_KEY = process.env.MAIN_APP_API_KEY || '';

  try {
    const response = await fetch(`${MAIN_APP_API}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Source': 'marketing-site',
      },
      body: JSON.stringify({
        userId: clinicianData.userId,
        role: 'CLINICIAN',
        email: clinicianData.email,
        phone: clinicianData.phone,
        npi: clinicianData.npi,
        profile: clinicianData.profile,
        allowedStates: clinicianData.allowedStates,
        licenses: clinicianData.licenses,
        specialties: clinicianData.specialties,
        source: 'marketing_signup',
        status: 'APPROVED', // Already approved by admin
        sendInviteEmail: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync clinician to main app');
    }

    const result = await response.json();
    
    console.log('✅ Clinician synced to main app:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Failed to sync clinician to main app:', error);
    // Don't fail the approval if main app sync fails
    // Admin can manually trigger sync later
    return { success: false, error };
  }
}
