import { usersCol, medicinesCol, doctorsCol, reviewsCol, blogsCol, conditionsCol, chatSessionsCol, reportAnalysesCol, symptomAnalysesCol } from "../db/collections.js";
import type { DashboardStats } from "../types/models.js";

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
    usersCol().countDocuments(),
    usersCol().countDocuments({ role: "user" }),
    usersCol().countDocuments({ role: "doctor" }),
    usersCol().countDocuments({ role: "admin" }),
    usersCol().countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    medicinesCol().countDocuments(),
    medicinesCol().countDocuments({ isPrescriptionRequired: true }),
    medicinesCol().countDocuments({ stockQuantity: { $lte: 10, $gte: 0 } }),
    doctorsCol().countDocuments(),
    doctorsCol().countDocuments({ isVerified: true }),
    reviewsCol().countDocuments(),
    reviewsCol().countDocuments({ isApproved: false }),
    reviewsCol().aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]).toArray(),
    blogsCol().countDocuments(),
    blogsCol().countDocuments({ status: "Published" }),
    blogsCol().countDocuments({ status: "Draft" }),
    conditionsCol().countDocuments(),
    chatSessionsCol().countDocuments(),
    chatSessionsCol().countDocuments({ status: "Active" }),
    reportAnalysesCol().countDocuments(),
    symptomAnalysesCol().countDocuments(),
  ]);

  const averageRating = avgRatingResult.length > 0
    ? Math.round(avgRatingResult[0].avgRating * 10) / 10
    : 0;

  return {
    users: { total: totalUsers, patients, doctors, admins, newThisMonth: newUsers },
    medicines: { total: totalMedicines, prescriptionRequired: prescriptionMeds, lowStock: lowStockMeds },
    doctors: { total: totalDoctors, verified: verifiedDoctors, unverified: totalDoctors - verifiedDoctors },
    reviews: { total: totalReviews, pendingApproval: pendingReviews, averageRating },
    blogs: { total: totalBlogs, published: publishedBlogs, drafts: draftBlogs },
    conditions: { total: totalConditions },
    chatSessions: { total: totalChats, active: activeChats, closed: totalChats - activeChats },
    reportAnalyses: { total: totalReports },
    symptomAnalyses: { total: totalSymptoms },
  };
}
