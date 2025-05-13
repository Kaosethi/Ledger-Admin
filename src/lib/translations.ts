// src/lib/translations.ts
// NEW FILE

export interface TranslationStrings {
    yearPlaceholder: string;
    // Page Title
    pageTitle: string;

    // Form Sections
    guardianInfoTitle: string;
    childInfoTitle: string;
    securityTitle: string;

    // Labels
    guardianNameLabel: string;
    guardianDobLabel: string;
    guardianContactLabel: string;
    addressLabel: string;
    childNameLabel: string;
    pinLabel: string;
    confirmPinLabel: string;

    // Placeholders
    guardianNamePlaceholder: string;
    guardianContactPlaceholder: string;
    addressPlaceholder: string;
    childNamePlaceholder: string;
    pinPlaceholder: string;
    confirmPinPlaceholder: string;

    // Validation & Error Messages
    requiredField: (fieldName: string) => string; // Function to include field name
    pinMustBe4Digits: string;
    pinMustContainDigits: string;
    pinsDoNotMatch: string;
    submissionFailedError: string;
    submissionFailedGeneric: string;

    // Button & Other Text
    submitButton: string;
    submittingButton: string;
    submissionNotice: string;
    requiredIndicator: string; // Usually '*' but could be localized

    // Language Switcher
    switchToEnglish: string;
    switchToThai: string;
}

export const translations: { [key: string]: TranslationStrings } = {
    en: {
        pageTitle: 'Beneficiary Account Registration',
        guardianInfoTitle: "Guardian's Information",
        childInfoTitle: "Child's Information",
        securityTitle: 'Account Security',
        guardianNameLabel: "Guardian's Full Name",
        guardianDobLabel: "Guardian's Date of Birth",
        guardianContactLabel: "Guardian's Contact Number",
        addressLabel: 'Address',
        childNameLabel: "Child's Full Name",
        pinLabel: 'Create 4-Digit PIN',
        confirmPinLabel: 'Confirm 4-Digit PIN',
        guardianNamePlaceholder: "Enter Guardian's Full Name",
        guardianContactPlaceholder: 'Enter Contact Number',
        addressPlaceholder: 'Enter Full Address',
        childNamePlaceholder: "Enter Child's Full Name",
        pinPlaceholder: 'Enter 4-digit PIN',
        confirmPinPlaceholder: 'Confirm 4-digit PIN',
        requiredField: (fieldName: string) => `${fieldName} is required.`,
        pinMustBe4Digits: 'PIN must be exactly 4 digits.',
        pinMustContainDigits: 'PIN must contain only digits.',
        pinsDoNotMatch: 'PINs do not match.',
        submissionFailedError: 'Submission failed:',
        submissionFailedGeneric: 'An unknown error occurred. Please try again later.',
        submitButton: 'Submit Registration Request',
        submittingButton: 'Submitting...',
        submissionNotice: 'Your request will be reviewed by an administrator.',
        requiredIndicator: '*',
        switchToEnglish: 'English',
        switchToThai: 'ภาษาไทย',
        yearPlaceholder: ""
    },
    th: {
        pageTitle: 'ลงทะเบียนบัญชีผู้รับผลประโยชน์',
        guardianInfoTitle: 'ข้อมูลผู้ปกครอง',
        childInfoTitle: 'ข้อมูลเด็ก',
        securityTitle: 'ความปลอดภัยบัญชี',
        guardianNameLabel: 'ชื่อ-นามสกุลเต็มของผู้ปกครอง',
        guardianDobLabel: 'วันเดือนปีเกิดของผู้ปกครอง',
        guardianContactLabel: 'เบอร์ติดต่อของผู้ปกครอง',
        addressLabel: 'ที่อยู่',
        childNameLabel: 'ชื่อ-นามสกุลเต็มของเด็ก',
        pinLabel: 'สร้าง PIN 4 หลัก',
        confirmPinLabel: 'ยืนยัน PIN 4 หลัก',
        guardianNamePlaceholder: 'กรอกชื่อ-นามสกุลเต็มของผู้ปกครอง',
        guardianContactPlaceholder: 'กรอกเบอร์ติดต่อ',
        addressPlaceholder: 'กรอกที่อยู่เต็ม',
        childNamePlaceholder: 'กรอกชื่อ-นามสกุลเต็มของเด็ก',
        pinPlaceholder: 'กรอก PIN 4 หลัก',
        confirmPinPlaceholder: 'ยืนยัน PIN 4 หลัก',
        requiredField: (fieldName: string) => `กรุณากรอก ${fieldName}`, // Simple Thai example
        pinMustBe4Digits: 'PIN ต้องมี 4 หลักเท่านั้น',
        pinMustContainDigits: 'PIN ต้องเป็นตัวเลขเท่านั้น',
        pinsDoNotMatch: 'PIN ไม่ตรงกัน',
        submissionFailedError: 'การส่งข้อมูลล้มเหลว:',
        submissionFailedGeneric: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้งภายหลัง',
        submitButton: 'ส่งคำขอลงทะเบียน',
        submittingButton: 'กำลังส่ง...',
        submissionNotice: 'คำขอของคุณจะถูกตรวจสอบโดยผู้ดูแลระบบ',
        requiredIndicator: '*',
        switchToEnglish: 'English',
        switchToThai: 'ภาษาไทย',
        yearPlaceholder: ""
    },
};