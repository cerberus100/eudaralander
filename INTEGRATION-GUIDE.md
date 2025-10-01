# 🔗 Marketing Site → Main App Integration Guide

## Overview

This **marketing site** collects patient and clinician signups, then sends them to your **main telehealth app** where users get login credentials and access portals.

---

## 🎯 Complete User Flow

### **PATIENT SIGNUP FLOW:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MARKETING SITE (This Repo)                              │
│    https://main.d28ow29ha3x2t5.amplifyapp.com              │
├─────────────────────────────────────────────────────────────┤
│ • Patient visits /signup/patient                            │
│ • Fills form (name, DOB, address, insurance)                │
│ • Submits → Saved to DynamoDB                              │
│ • Gets 6-digit OTP via email                                │
│ • Enters code at /verify                                    │
│ • ✅ VERIFIED & AUTO-APPROVED                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  (Auto-sync via API)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MAIN TELEHEALTH APP (Your Platform)                     │
│    https://api.eudaura.com                                  │
├─────────────────────────────────────────────────────────────┤
│ • Receives POST /api/users/create                           │
│ • Creates user account with role=PATIENT                    │
│ • Generates temporary password or magic link                │
│ • Sends welcome email: "Set your password"                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PATIENT GETS EMAIL                                       │
├─────────────────────────────────────────────────────────────┤
│ Subject: "Welcome to Eudaura!"                              │
│                                                             │
│ "Your account is ready!                                     │
│  Click here to set your password and access your portal:    │
│  https://app.eudaura.com/set-password?token=..."            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PATIENT SETS PASSWORD & LOGS IN                          │
│    https://app.eudaura.com/portal                           │
├─────────────────────────────────────────────────────────────┤
│ • Patient clicks link → Sets password                       │
│ • Now can login at: app.eudaura.com/login                   │
│ • Access patient portal to:                                 │
│   - Book appointments                                       │
│   - Join video visits                                       │
│   - View test results                                       │
│   - Message providers                                       │
└─────────────────────────────────────────────────────────────┘
```

### **CLINICIAN SIGNUP FLOW:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MARKETING SITE (This Repo)                              │
├─────────────────────────────────────────────────────────────┤
│ • Clinician visits /signup/clinician                        │
│ • Completes 4-step wizard:                                  │
│   Step 1: Personal info + NPI                               │
│   Step 2: State licenses                                    │
│   Step 3: Upload documents (license, malpractice)           │
│   Step 4: Specialties + flags                               │
│ • Submits → Saved to DynamoDB                              │
│ • Status: SUBMITTED (pending admin review)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN REVIEWS (This Repo)                                │
│    /admin/approvals                                         │
├─────────────────────────────────────────────────────────────┤
│ • Admin sees application in review table                    │
│ • Reviews NPI, licenses, credentials                        │
│ • Clicks "Approve" button                                   │
│ • ✅ Status: APPROVED                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  (Auto-sync via API)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN TELEHEALTH APP                                      │
│    https://api.eudaura.com                                  │
├─────────────────────────────────────────────────────────────┤
│ • Receives POST /api/users/create                           │
│ • Creates clinician account with role=CLINICIAN             │
│ • Sets allowedStates from licenses                          │
│ • Generates invitation link                                 │
│ • Sends approval email                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CLINICIAN GETS EMAIL                                     │
├─────────────────────────────────────────────────────────────┤
│ Subject: "You're Approved to Join Eudaura!"                 │
│                                                             │
│ "Congratulations! Your application has been approved.       │
│  Click here to set up your provider account:                │
│  https://app.eudaura.com/onboarding/clinician?token=..."    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CLINICIAN SETS PASSWORD & LOGS IN                        │
│    https://app.eudaura.com                                  │
├─────────────────────────────────────────────────────────────┤
│ • Clinician clicks link → Sets password                     │
│ • Completes onboarding (availability, bio, etc.)            │
│ • Now can login at: app.eudaura.com/login                   │
│ • Access clinician portal to:                               │
│   - Set availability                                        │
│   - See patient appointments                                │
│   - Conduct video visits                                    │
│   - Write notes/prescriptions                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 API Integration Points

### **What Marketing Site Does:**

#### **After Patient Verification:**
```typescript
// app/api/patient/verify/route.ts (Already implemented!)
// When patient enters correct OTP:

await syncPatientToMainApp({
  userId: 'generated-id',
  email: 'patient@example.com',
  phone: '+15551234567',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    dob: '1990-01-01',
    address: {...},
    insurance: {...}
  }
});

// This POSTs to: MAIN_APP_API_URL/api/users/create
```

#### **After Admin Approves Clinician:**
```typescript
// app/api/admin/clinician/[appId]/approve/route.ts (Already implemented!)
// When admin clicks "Approve":

await syncClinicianToMainApp({
  userId: 'generated-id',
  email: 'doctor@example.com',
  npi: '1234567890',
  allowedStates: ['CA', 'TX'],
  licenses: [...],
  specialties: ['Family Medicine']
});

// This POSTs to: MAIN_APP_API_URL/api/users/create
```

---

## 📋 What Your Main App Needs

### **Endpoint: POST /api/users/create**

Your main telehealth app needs this endpoint to receive users from the marketing site:

```typescript
// In your main app: app/api/users/create/route.ts

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== process.env.MARKETING_SITE_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, role, email, profile, allowedStates } = body;

  // 1. Create user in your database
  await db.users.create({
    id: userId,
    email,
    role, // 'PATIENT' or 'CLINICIAN'
    profile,
    ...(role === 'CLINICIAN' && { allowedStates }),
    status: 'PENDING_ONBOARDING',
    createdAt: new Date()
  });

  // 2. Generate password reset token
  const token = generateSecureToken();
  await db.passwordResets.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  // 3. Send welcome email
  if (role === 'PATIENT') {
    await sendEmail({
      to: email,
      subject: 'Welcome to Eudaura!',
      template: 'patient-welcome',
      data: {
        firstName: profile.firstName,
        setupLink: `https://app.eudaura.com/set-password?token=${token}`
      }
    });
  } else {
    await sendEmail({
      to: email,
      subject: 'You're Approved to Join Eudaura!',
      template: 'clinician-approved',
      data: {
        fullName: profile.fullName,
        setupLink: `https://app.eudaura.com/onboarding/clinician?token=${token}`
      }
    });
  }

  return Response.json({
    success: true,
    userId,
    message: 'User created and invitation sent'
  });
}
```

---

## ⚙️ Configuration

### **Environment Variables Needed:**

**On Marketing Site (Already set!):**
```bash
MAIN_APP_API_URL=https://api.eudaura.com
MAIN_APP_API_KEY=your-secret-key
MAIN_APP_URL=https://app.eudaura.com
```

**On Main App (You need to add):**
```bash
MARKETING_SITE_API_KEY=same-secret-key
```

---

## 🎯 Summary

### **YES - This site IS equipped to do signups!**

**What Works Now:**
- ✅ Patient fills form → Auto-approved → Syncs to main app
- ✅ Clinician fills form → Admin reviews → Approves → Syncs to main app

**What Your Main App Does:**
- ✅ Receives user data via POST /api/users/create
- ✅ Creates user account with password system
- ✅ Sends email with setup link
- ✅ User sets password → Can login to portal

**Users Get Login/Password:**
- 📧 Via email after signup is approved
- 🔑 Click link to set their password
- 🚪 Login at app.eudaura.com/login
- ✅ Access their portal (patient or clinician)

---

## 🚀 You're All Set!

Your marketing site will:
1. ✅ Collect signups fast (instant load, no delays)
2. ✅ Verify patients automatically
3. ✅ Let admin review clinicians
4. ✅ Send approved users to your main app
5. ✅ Main app creates their login credentials

**No code changes needed on this marketing site - it's ready to go!**

Just make sure your main app has the `/api/users/create` endpoint to receive the user data.

