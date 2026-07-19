import { UserModel } from "../models/User.model.js";
import { MedicineModel } from "../models/Medicine.model.js";
import { DoctorModel } from "../models/Doctor.model.js";
import { ReviewModel } from "../models/Review.model.js";
import { BlogModel } from "../models/Blog.model.js";
import { HealthConditionModel } from "../models/HealthCondition.model.js";
import { ChatSessionModel } from "../models/ChatSession.model.js";
import { ReportAnalysisModel } from "../models/ReportAnalysis.model.js";
import { SymptomAnalysisModel } from "../models/SymptomAnalysis.model.js";

export interface DashboardStats {
  users: { total: number; patients: number; doctors: number; admins: number; newThisMonth: number };
  medicines: { total: number; prescriptionRequired: number; lowStock: number };
  doctors: { total: number; verified: number; unverified: number };
  reviews: { total: number; pendingApproval: number; averageRating: number };
  blogs: { total: number; published: number; drafts: number };
  conditions: { total: number };
  chatSessions: { total: number; active: number; closed: number };
  reportAnalyses: { total: number };
  symptomAnalyses: { total: number };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    patients,
    doctors,
    admins,
    newUsers,
    totalMedicines,
    prescriptionMeds,
    lowStockMeds,
    totalDoctors,
    verifiedDoctors,
    totalReviews,
    pendingReviews,
    avgRatingResult,
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    totalConditions,
    totalChats,
    activeChats,
    totalReports,
    totalSymptoms,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: "user" }),
    UserModel.countDocuments({ role: "doctor" }),
    UserModel.countDocuments({ role: "admin" }),
    UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    MedicineModel.countDocuments(),
    MedicineModel.countDocuments({ isPrescriptionRequired: true }),
    MedicineModel.countDocuments({ stockQuantity: { $lte: 10, $gte: 0 } }),
    DoctorModel.countDocuments(),
    DoctorModel.countDocuments({ isVerified: true }),
    ReviewModel.countDocuments(),
    ReviewModel.countDocuments({ isApproved: false }),
    ReviewModel.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]),
    BlogModel.countDocuments(),
    BlogModel.countDocuments({ status: "Published" }),
    BlogModel.countDocuments({ status: "Draft" }),
    HealthConditionModel.countDocuments(),
    ChatSessionModel.countDocuments(),
    ChatSessionModel.countDocuments({ status: "Active" }),
    ReportAnalysisModel.countDocuments(),
    SymptomAnalysisModel.countDocuments(),
  ]);

  const averageRating = avgRatingResult.length > 0
    ? Math.round(avgRatingResult[0].avgRating * 10) / 10
    : 0;

  return {
    users: {
      total: totalUsers,
      patients,
      doctors,
      admins,
      newThisMonth: newUsers,
    },
    medicines: {
      total: totalMedicines,
      prescriptionRequired: prescriptionMeds,
      lowStock: lowStockMeds,
    },
    doctors: {
      total: totalDoctors,
      verified: verifiedDoctors,
      unverified: totalDoctors - verifiedDoctors,
    },
    reviews: {
      total: totalReviews,
      pendingApproval: pendingReviews,
      averageRating,
    },
    blogs: {
      total: totalBlogs,
      published: publishedBlogs,
      drafts: draftBlogs,
    },
    conditions: { total: totalConditions },
    chatSessions: {
      total: totalChats,
      active: activeChats,
      closed: totalChats - activeChats,
    },
    reportAnalyses: { total: totalReports },
    symptomAnalyses: { total: totalSymptoms },
  };
}
