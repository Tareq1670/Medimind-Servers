import { usersCol, medicinesCol, doctorsCol, reviewsCol, blogsCol, conditionsCol, chatSessionsCol, reportAnalysesCol, symptomAnalysesCol, healthRecordsCol } from "../db/collections.js";
import type { DashboardStats } from "../types/models.js";
import { ObjectId } from "mongodb";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalUsers,
    patients,
    doctors,
    totalMedicines,
    totalDoctors,
    verifiedDoctors,
    totalReviews,
    totalBlogs,
    publishedBlogs,
  ] = await Promise.all([
    usersCol().countDocuments(),
    usersCol().countDocuments({ role: "user" }),
    usersCol().countDocuments({ role: "doctor" }),
    medicinesCol().countDocuments(),
    doctorsCol().countDocuments(),
    doctorsCol().countDocuments({ isVerified: true }),
    reviewsCol().countDocuments(),
    blogsCol().countDocuments(),
    blogsCol().countDocuments({ status: "Published" }),
  ]);

  const now = new Date();
  const userGrowth: { date: string; count: number }[] = [];
  const contentGrowth: { date: string; medicines: number; blogs: number }[] = [];
  const aiUsage: { date: string; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const [userCount, medCount, blogCount, aiCount] = await Promise.all([
      usersCol().countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
      medicinesCol().countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
      blogsCol().countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
      symptomAnalysesCol().countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
    ]);

    userGrowth.push({ date: label, count: userCount });
    contentGrowth.push({ date: label, medicines: medCount, blogs: blogCount });
    aiUsage.push({ date: label, count: aiCount });
  }

  let mongodbHealth = false;
  let apiHealth = false;
  let aiHealth = false;
  try {
    const { getDB } = await import("../config/db.js");
    await getDB().command({ ping: 1 });
    mongodbHealth = true;
    apiHealth = true;
  } catch {
    mongodbHealth = false;
    apiHealth = false;
  }
  const { env } = await import("../config/env.js");
  aiHealth = !!(env.geminiApiKey || env.groqApiKey);

  return {
    admin: {
      totalUsers,
      totalDoctors,
      totalPatients: patients,
      totalMedicines,
      totalReviews,
      userGrowth,
      contentGrowth,
      aiUsage,
      systemHealth: { mongodb: mongodbHealth, api: apiHealth, ai: aiHealth },
    },
  };
}

export async function getUserDashboardStats(userId: string): Promise<DashboardStats> {
  const [record, recentReviews, symptomCount] = await Promise.all([
    healthRecordsCol().findOne({ patientId: userId }),
    reviewsCol()
      .find({ reviewerId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    symptomAnalysesCol().countDocuments({ patientId: userId }),
  ]);

  const vitalsTrend: { date: string; value: number }[] = [];
  if (record) {
    const baseScore = 85;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      vitalsTrend.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: baseScore + Math.round(Math.sin(i) * 5),
      });
    }
  }

  return {
    user: {
      healthScore: record ? 85 : 70,
      recordCount: record ? 1 : 0,
      recentActivity: recentReviews.map((r) => ({
        label: `Reviewed ${r.targetType}`,
        value: `${r.rating}/5`,
        date: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })),
      vitalsTrend,
    },
  };
}

export async function getDoctorDashboardStats(userId: string): Promise<DashboardStats> {
  const doctor = await doctorsCol().findOne({ userId: new ObjectId(userId) });
  if (!doctor) return { doctor: { patientCount: 0, appointmentCount: 0, reviewCount: 0, earnings: 0 } };

  const doctorId = doctor._id!.toString();
  const [reviewCount, avgResult, patientIds, doctorReviews] = await Promise.all([
    reviewsCol().countDocuments({ targetId: doctorId, targetType: "Doctor" }),
    reviewsCol().aggregate([
      { $match: { targetId: doctorId, targetType: "Doctor", isApproved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]).toArray(),
    reviewsCol().distinct("reviewerId", { targetId: doctorId, targetType: "Doctor" }),
    reviewsCol().find({ targetId: doctorId, targetType: "Doctor", isApproved: true }).toArray(),
  ]);

  const earnings = doctorReviews.length * doctor.consultationFee;

  return {
    doctor: {
      patientCount: patientIds.length,
      appointmentCount: reviewCount,
      reviewCount,
      earnings,
    },
  };
}
