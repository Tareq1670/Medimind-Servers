import { ObjectId } from "mongodb";

process.env.MONGODB_URI = "mongodb://localhost:27017";
process.env.DB_NAME = "medimind_test";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";

export const mockObjectId = new ObjectId("507f1f77bcf86cd799439011");
export const mockUserId = mockObjectId.toString();

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    avatar: "https://example.com/avatar.jpg",
    image: "https://example.com/image.jpg",
    dob: "1990-01-01",
    bloodGroup: "A+",
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockDoctor(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(),
    specialty: "Cardiology",
    experienceYears: 10,
    hospitalAffiliation: "City Hospital",
    bio: "Test doctor",
    consultationFee: 150,
    availabilitySlots: [
      { day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
    ],
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockMedicine(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    name: "Test Medicine",
    genericName: "Test Generic",
    category: "Painkillers",
    manufacturer: "Test Pharma",
    price: 25.99,
    stockQuantity: 100,
    description: "A test medicine for testing purposes",
    image: "https://example.com/medicine.jpg",
    dosageForm: "Tablet",
    strength: "500mg",
    isPrescriptionRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBlog(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    title: "Test Blog",
    content: "Test content for the blog post",
    authorId: new ObjectId(),
    tags: ["health", "wellness"],
    coverImage: "https://example.com/image.jpg",
    slug: "test-blog",
    status: "Published" as const,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockReview(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    reviewerId: new ObjectId(),
    targetType: "Medicine" as const,
    targetId: new ObjectId(),
    rating: 5,
    comment: "Works really well",
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCondition(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    title: "Test Condition",
    description: "A test condition",
    symptoms: ["symptom1", "symptom2"],
    severity: "Medium" as const,
    precautions: ["precaution1"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockHealthRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    patientId: new ObjectId(),
    chronicConditions: ["Diabetes"],
    allergies: ["Penicillin"],
    currentMedications: [
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
    ],
    emergencyContact: {
      name: "Emergency Contact",
      relationship: "Spouse",
      phone: "1234567890",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockSymptomAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    patientId: new ObjectId(),
    reportedSymptoms: ["fever", "cough"],
    duration: "2 days",
    severity: "mild",
    additionalInfo: "No other symptoms",
    aiAnalysis: {
      urgencyLevel: "routine" as const,
      urgencyExplanation: "Mild symptoms",
      possibleConditions: [
        { name: "Common Cold", probability: "High", description: "Viral infection" },
      ],
      recommendations: ["Rest", "Hydration"],
      warningSignsToWatch: ["High fever"],
      shouldSeeDoctor: false,
      doctorType: "General Practitioner",
      lifestyleAdvice: ["Rest"],
      disclaimer: "Not medical advice",
    },
    AI_Assessment_Result: "Common Cold",
    recommendedAction: "Rest and hydrate",
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockReportAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    patientId: new ObjectId(),
    reportName: "Blood Test",
    reportType: "blood",
    uploadedImageUrl: "https://example.com/report.jpg",
    originalText: "Test results",
    structuredData: {},
    analysisSummary: "Normal results",
    aiDoctorNotes: "All normal",
    aiAnalysis: {
      summary: "Normal",
      keyFindings: [],
      recommendations: [],
      riskIndicators: [],
      normalValues: {},
      abnormalValues: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockContactSubmission(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    name: "John Doe",
    email: "john@example.com",
    subject: "General Inquiry",
    message: "I have a question about the platform.",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockChatSession(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    participants: [new ObjectId()],
    messages: [
      {
        senderId: new ObjectId(),
        content: "Hello",
        timestamp: new Date(),
        suggestedFollowUps: [],
      },
    ],
    status: "Active" as const,
    sessionTitle: "Test Session",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
