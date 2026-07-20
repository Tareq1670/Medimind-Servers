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
    password: "hashedpassword",
    role: "user" as const,
    profile: {},
    preferences: { theme: "light" as const, notifications: true },
    healthData: { chronicConditions: [], allergies: [], healthScore: 85 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockDoctor(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(),
    name: "Dr. Test",
    specialization: "Cardiology",
    city: "New York",
    experience: 10,
    rating: 4.5,
    consultationFee: 150,
    languages: ["English"],
    bio: "Test doctor",
    services: ["Consultation"],
    schedule: [],
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
    isPrescriptionRequired: false,
    rating: 4.2,
    reviewCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBlog(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    title: "Test Blog",
    slug: "test-blog",
    content: "Test content for the blog post",
    excerpt: "Test excerpt",
    authorId: new ObjectId(),
    authorName: "Test Author",
    category: "Health Tips",
    tags: ["health", "wellness"],
    coverImage: "https://example.com/image.jpg",
    status: "published" as const,
    viewCount: 0,
    likeCount: 0,
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
    title: "Great product",
    comment: "Works really well",
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
