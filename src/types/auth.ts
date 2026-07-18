import { ObjectId } from "mongodb";

export type UserRole = "user" | "doctor" | "admin";

export type ThemeMode = "light" | "dark" | "system";

export interface UserProfile {
  bloodGroup?: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  notifications: boolean;
}

export interface UserHealthData {
  chronicConditions: string[];
  allergies: string[];
  healthScore: number;
}

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  healthData: UserHealthData;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<UserDocument, "password">;

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
