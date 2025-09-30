# 📨 FOR EUDAURA LANDER DEV

## Hey Eudaura Dev,

We built the entire telehealth platform. You just need to send us signups.

Check this file for the exact code to copy/paste. Stop asking questions and just implement it.

**2 API calls. 20 lines of code. Done.**

- Telehealth Team

---

## 🎯 EXACTLY WHAT YOU NEED TO DO

### **API Base URL**
```javascript
const API_BASE_URL = 'https://main.d28ow29ha3x2t5.amplifyapp.com'
```

---

## 📝 PATIENT SIGNUP (Copy/Paste This)

```javascript
// When patient fills out your signup form
async function submitPatientSignup(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patient/provisional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        email: formData.email,
        phone: formData.phone || undefined,
        address: {
          address1: formData.address1,
          address2: formData.address2 || undefined,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
        insurance: {
          hasInsurance: formData.hasInsurance || false,
          // Add insurance details if hasInsurance = true
        },
        preferredContact: formData.preferredContact || 'email',
        consent: true,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      // Success! Show verification form
      showVerificationForm(result.contact);
      return { success: true };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
    return { success: false };
  }
}
```

---

## 📝 PATIENT VERIFICATION (Copy/Paste This)

```javascript
// When patient enters 6-digit code
async function verifyPatientCode(contact, code) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patient/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: contact,
        code: code,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      // Success! Redirect to main app
      window.location.href = result.next;
      return { success: true };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
    return { success: false };
  }
}
```

---

## 📝 CLINICIAN SIGNUP (Copy/Paste This)

```javascript
// When clinician fills out your application form
async function submitClinicianApplication(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clinician/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        npi: formData.npi,
        licenseNumber: formData.licenseNumber,
        states: formData.states, // Array of state codes
        specialties: formData.specialties, // Array of specialties
        consent: true,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      // Success! Show thank you message
      alert(`Application submitted! ID: ${result.appId}\n\nYou'll receive an email when reviewed.`);
      return { success: true };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
    return { success: false };
  }
}
```

---

## 🔧 MINIMAL FORM FIELDS REQUIRED

### **Patient Form:**
```html
<form id="patientForm">
  <input name="firstName" required />
  <input name="lastName" required />
  <input name="dob" type="date" required />
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <input name="address1" required />
  <input name="address2" />
  <input name="city" required />
  <select name="state" required>
    <option value="CA">California</option>
    <option value="TX">Texas</option>
    <!-- Add all states -->
  </select>
  <input name="postalCode" required />
  <input name="hasInsurance" type="checkbox" />
  <select name="preferredContact">
    <option value="email">Email</option>
    <option value="sms">SMS</option>
  </select>
  <button type="submit">Sign Up</button>
</form>
```

### **Clinician Form:**
```html
<form id="clinicianForm">
  <input name="fullName" required />
  <input name="email" type="email" required />
  <input name="phone" type="tel" required />
  <input name="npi" pattern="[0-9]{10}" required />
  <input name="licenseNumber" required />
  
  <!-- States (checkboxes) -->
  <input name="states" value="CA" type="checkbox" /> California
  <input name="states" value="TX" type="checkbox" /> Texas
  <!-- Add all states -->
  
  <!-- Specialties (checkboxes) -->
  <input name="specialties" value="Family Medicine" type="checkbox" /> Family Medicine
  <input name="specialties" value="Internal Medicine" type="checkbox" /> Internal Medicine
  <!-- Add all specialties -->
  
  <button type="submit">Apply</button>
</form>
```

---

## 🎯 FORM HANDLERS (Copy/Paste This)

```javascript
// Patient form handler
document.getElementById('patientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  // Convert checkbox to boolean
  data.hasInsurance = formData.has('hasInsurance');
  
  const result = await submitPatientSignup(data);
  if (result.success) {
    // Show verification step
  }
});

// Clinician form handler
document.getElementById('clinicianForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  // Get all checked states
  const states = Array.from(formData.getAll('states'));
  const specialties = Array.from(formData.getAll('specialties'));
  
  const data = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    npi: formData.get('npi'),
    licenseNumber: formData.get('licenseNumber'),
    states: states,
    specialties: specialties,
  };
  
  const result = await submitClinicianApplication(data);
  if (result.success) {
    // Show thank you message
  }
});
```

---

## 🔄 VERIFICATION FLOW (Copy/Paste This)

```javascript
function showVerificationForm(contact) {
  // Replace your form with verification input
  document.getElementById('patientForm').innerHTML = `
    <h2>Verify Your Account</h2>
    <p>Enter the 6-digit code sent to: ${contact}</p>
    <input id="verificationCode" maxlength="6" placeholder="000000" />
    <button onclick="submitVerification('${contact}')">Verify</button>
  `;
}

async function submitVerification(contact) {
  const code = document.getElementById('verificationCode').value;
  const result = await verifyPatientCode(contact, code);
  
  if (result.success) {
    alert('Account verified! Redirecting to your patient portal...');
    // User will be redirected automatically
  }
}
```

---

## 📋 REQUIRED STATES ARRAY

```javascript
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const SPECIALTIES = [
  "Family Medicine", "Internal Medicine", "Pediatrics", 
  "Obstetrics & Gynecology", "Psychiatry", "Emergency Medicine",
  "Surgery", "Cardiology", "Dermatology", "Endocrinology",
  "Gastroenterology", "Hematology/Oncology", "Infectious Disease",
  "Nephrology", "Neurology", "Ophthalmology", "Orthopedic Surgery",
  "Otolaryngology", "Pulmonology", "Radiology", "Urology", "Other"
];
```

---

## ⚡ TESTING

### **Test Patient Signup:**
```javascript
const testPatient = {
  firstName: "John",
  lastName: "Doe",
  dob: "1990-01-01",
  email: "test@example.com",
  address1: "123 Main St",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  hasInsurance: false,
  preferredContact: "email"
};

// Should return: { requestId: "...", contact: "test@example.com" }
```

### **Test Clinician Application:**
```javascript
const testClinician = {
  fullName: "Dr. Jane Smith",
  email: "doctor@example.com",
  phone: "+15551234567",
  npi: "1234567890",
  licenseNumber: "MD12345",
  states: ["TX", "CA"],
  specialties: ["Family Medicine"]
};

// Should return: { appId: "...", message: "..." }
```

---

## 🚨 IMPORTANT NOTES

### **What Happens After Signup:**

**Patients:**
- Get OTP code via email
- Verify → Account created in telehealth system
- Redirected to main app to set password

**Clinicians:**
- Application goes to admin for review
- Admin approves → Account created in telehealth system
- Gets email with setup instructions

### **Error Handling:**
```javascript
// Always handle errors gracefully
if (!response.ok) {
  const error = await response.json();
  alert(`Error: ${error.error}`);
  return;
}
```

---

## ✅ THAT'S IT!

**Copy the code above. Paste it in your lander. Test it. Ship it.**

**No more questions needed. It's all here.**

**- Telehealth Team** 🚀
