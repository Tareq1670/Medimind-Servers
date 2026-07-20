import { ObjectId } from "mongodb";

export type UserRole = "user" | "doctor" | "admin";

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  image?: string;
  dob?: string;
  bloodGroup?: string;
  banned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicine {
  _id?: ObjectId;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  price: number;
  stockQuantity: number;
  description: string;
  image?: string;
  dosageForm?: string;
  strength?: string;
  isPrescriptionRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IDoctor {
  _id?: ObjectId;
  userId: ObjectId | string;
  specialty: string;
  experienceYears: number;
  hospitalAffiliation: string;
  bio: string;
  consultationFee: number;
  availabilitySlots: IAvailabilitySlot[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Severity = "Low" | "Medium" | "High";

export interface IHealthCondition {
  _id?: ObjectId;
  title: string;
  description: string;
  symptoms: string[];
  severity: Severity;
  precautions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type BlogStatus = "Draft" | "Published";

export interface IBlog {
  _id?: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId | string;
  tags: string[];
  coverImage?: string;
  status: BlogStatus;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TargetType = "Doctor" | "Medicine";

export interface IReview {
  _id?: ObjectId;
  reviewerId: ObjectId | string;
  targetId: ObjectId | string;
  targetType: TargetType;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  senderId: ObjectId | string;
  content: string;
  timestamp: Date;
  suggestedFollowUps?: string[];
}

export type ChatStatus = "Active" | "Closed";

export interface IChatSession {
  _id?: ObjectId;
  participants: (ObjectId | string)[];
  messages: IMessage[];
  status: ChatStatus;
  sessionTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportFinding {
  name: string;
  value: string;
  unit?: string;
  range?: string;
  status: "Normal" | "Low" | "High" | "Critical";
  explanation?: string;
}

export interface IReportAiAnalysis {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskIndicators: string[];
  normalValues: Record<string, unknown>;
  abnormalValues: Record<string, unknown>;
}

export interface IReportAnalysis {
  _id?: ObjectId;
  patientId: ObjectId | string;
  reportName?: string;
  reportType: string;
  uploadedImageUrl?: string;
  originalText?: string;
  structuredData?: Record<string, unknown>;
  analysisSummary?: string;
  aiDoctorNotes?: string;
  aiAnalysis?: IReportAiAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IHealthRecord {
  _id?: ObjectId;
  patientId: ObjectId | string;
  chronicConditions: string[];
  allergies: string[];
  currentMedications: ICurrentMedication[];
  emergencyContact?: IEmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiSymptomCondition {
  name: string;
  probability: string;
  description: string;
  commonIn?: string;
  urgency?: string;
}

export interface IAiSymptomAnalysis {
  urgencyLevel: "immediate" | "soon" | "routine" | "monitor";
  urgencyExplanation?: string;
  possibleConditions: IAiSymptomCondition[];
  recommendations: string[];
  warningSignsToWatch: string[];
  shouldSeeDoctor: boolean;
  doctorType?: string;
  lifestyleAdvice?: string[];
  disclaimer: string;
}

export interface ISymptomAnalysis {
  _id?: ObjectId;
  patientId: ObjectId | string;
  reportedSymptoms: string[];
  duration?: string;
  severity?: string;
  additionalInfo?: string;
  aiAnalysis?: IAiSymptomAnalysis;
  AI_Assessment_Result?: string;
  recommendedAction?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  user?: {
    healthScore: number;
    recordCount: number;
    recentActivity: { label: string; value: string; date: string }[];
    vitalsTrend: { date: string; value: number }[];
  };
  doctor?: {
    patientCount: number;
    appointmentCount: number;
    reviewCount: number;
    earnings: number;
  };
  admin?: {
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    totalMedicines: number;
    totalReviews: number;
    userGrowth: { date: string; count: number }[];
    contentGrowth: { date: string; medicines: number; blogs: number }[];
    aiUsage: { date: string; count: number }[];
    systemHealth: { mongodb: boolean; api: boolean; ai: boolean };
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
