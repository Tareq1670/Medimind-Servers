import mongoose from "mongoose";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.DB_NAME ?? "Medimind";

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required");
  process.exit(1);
}

let nativeClient: MongoClient;
let mongooseConnected = false;

async function connect() {
  nativeClient = new MongoClient(MONGODB_URI);
  await nativeClient.connect();
  console.log("Connected to MongoDB (native driver)");

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  mongooseConnected = true;
  console.log("Connected to MongoDB (Mongoose)");
}

async function disconnect() {
  if (mongooseConnected) await mongoose.disconnect();
  await nativeClient.close();
  console.log("Disconnected");
}

const db = () => nativeClient.db(DB_NAME);

async function dropCollections() {
  const appCollections = [
    "users", "medicines", "doctors", "healthconditions",
    "blogs", "reviews", "chatsessions", "reportanalyses",
    "healthrecords", "symptomanalyses",
  ];
  const authCollections = ["user", "account", "session", "jwks"];

  for (const name of [...appCollections, ...authCollections]) {
    try {
      await db().collection(name).drop();
    } catch {
      // may not exist
    }
  }
  console.log("Dropped existing data");
}

const PATIENT_ID = new ObjectId();
const DOCTOR_USER_ID = new ObjectId();
const ADMIN_ID = new ObjectId();

const DEMO_USERS = [
  {
    _id: PATIENT_ID,
    name: "Sarah Rahman",
    email: "patient@medimind.demo",
    password: "Demo@1234",
    role: "user" as const,
  },
  {
    _id: DOCTOR_USER_ID,
    name: "Dr. Kabir Hossain",
    email: "doctor@medimind.demo",
    password: "Demo@1234",
    role: "doctor" as const,
  },
  {
    _id: ADMIN_ID,
    name: "Admin User",
    email: "admin@medimind.demo",
    password: "Admin@1234",
    role: "admin" as const,
  },
];

async function createDemoUsers() {
  const now = new Date();

  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);

    await db().collection("user").insertOne({
      _id: u._id,
      name: u.name,
      email: u.email,
      emailVerified: true,
      role: u.role,
      createdAt: now,
      updatedAt: now,
    });

    await db().collection("account").insertOne({
      _id: new ObjectId(),
      userId: u._id,
      accountId: u.email,
      providerId: "email",
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await db().collection("users").insertOne({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Created ${DEMO_USERS.length} demo users`);
}

const DOCTORS_DATA = [
  { name: "Dr. Farzana Akhter", specialty: "Cardiology", exp: 18, hospital: "Square Hospital", fee: 1500 },
  { name: "Dr. Shahidul Islam", specialty: "Neurology", exp: 22, hospital: "Apollo Hospital", fee: 2000 },
  { name: "Dr. Nusrat Jahan", specialty: "Pediatrics", exp: 12, hospital: "Labaid Hospital", fee: 1200 },
  { name: "Dr. Mahmud Hasan", specialty: "Orthopedics", exp: 15, hospital: "Ibn Sina Hospital", fee: 1000 },
  { name: "Dr. Tahmina Begum", specialty: "Dermatology", exp: 10, hospital: "United Hospital", fee: 1200 },
  { name: "Dr. Kamal Hossain", specialty: "Ophthalmology", exp: 20, hospital: "Islami Bank Hospital", fee: 800 },
  { name: "Dr. Sharmin Akhter", specialty: "Gynecology", exp: 14, hospital: "Dhaka Medical College", fee: 1000 },
  { name: "Dr. Rezaul Karim", specialty: "Gastroenterology", exp: 16, hospital: "Birdem Hospital", fee: 1300 },
  { name: "Dr. Ayesha Siddiqua", specialty: "Pulmonology", exp: 11, hospital: "National Chest Hospital", fee: 1000 },
  { name: "Dr. Tanvir Ahmed", specialty: "ENT", exp: 9, hospital: "Popular Hospital", fee: 900 },
  { name: "Dr. Jannatul Ferdous", specialty: "Psychiatry", exp: 13, hospital: "National Mental Health Institute", fee: 1500 },
  { name: "Dr. Anisur Rahman", specialty: "Urology", exp: 17, hospital: "Kidney Foundation Hospital", fee: 1200 },
  { name: "Dr. Shamima Nasrin", specialty: "Nephrology", exp: 14, hospital: "Birdem Hospital", fee: 1400 },
  { name: "Dr. Rafiqul Islam", specialty: "Cardiology", exp: 25, hospital: "LabAid Cardiac Hospital", fee: 2500 },
  { name: "Dr. Khaleda Akhter", specialty: "Endocrinology", exp: 16, hospital: "BIRDEM", fee: 1800 },
  { name: "Dr. Masud Rana", specialty: "Orthopedics", exp: 8, hospital: "Evercare Hospital", fee: 1500 },
  { name: "Dr. Parveen Sultana", specialty: "Pediatrics", exp: 20, hospital: "Shishu Hospital", fee: 1000 },
  { name: "Dr. Hasan Imam", specialty: "Neurology", exp: 19, hospital: "Apollo Hospital", fee: 2200 },
  { name: "Dr. Rowshan Ara", specialty: "Dermatology", exp: 7, hospital: "Skin & Laser Center", fee: 1000 },
  { name: "Dr. Nurul Amin", specialty: "Pulmonology", exp: 21, hospital: "Chest Disease Hospital", fee: 800 },
  { name: "Dr. Fahmida Khatun", specialty: "Gynecology", exp: 10, hospital: "Labaid Hospital", fee: 1200 },
  { name: "Dr. Zahidul Islam", specialty: "Gastroenterology", exp: 13, hospital: "Square Hospital", fee: 1100 },
];

async function createDoctors() {
  const now = new Date();
  const doctors = DOCTORS_DATA.map((d) => ({
    userId: new ObjectId(),
    specialty: d.specialty,
    experienceYears: d.exp,
    hospitalAffiliation: d.hospital,
    bio: `${d.name} is a renowned ${d.specialty.toLowerCase()} specialist with ${d.exp} years of experience at ${d.hospital}. Dedicated to providing compassionate, evidence-based care.`,
    consultationFee: d.fee,
    availabilitySlots: [
      { day: "Sunday", startTime: "09:00", endTime: "13:00", isAvailable: true },
      { day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "Wednesday", startTime: "09:00", endTime: "13:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "14:00", isAvailable: true },
    ],
    isVerified: true,
    createdAt: now,
    updatedAt: now,
  }));

  await db().collection("doctors").insertMany(doctors);
  console.log(`Created ${doctors.length} doctors`);

  const doctorMap = new Map<string, ObjectId>();
  DOCTORS_DATA.forEach((d, i) => doctorMap.set(d.name, doctors[i].userId));
  return { doctors, doctorMap };
}

const MEDICINES_DATA = [
  { name: "Napa Extra", generic: "Paracetamol 500mg", category: "Painkiller", mfr: "Beximco Pharma", price: 30, qty: 500, rx: false },
  { name: "Ace Plus", generic: "Paracetamol + Caffeine", category: "Painkiller", mfr: "ACI Pharma", price: 50, qty: 300, rx: false },
  { name: "Seclo", generic: "Omeprazole 20mg", category: "Gastrointestinal", mfr: "Square Pharma", price: 80, qty: 400, rx: false },
  { name: "Maxpro", generic: "Pantoprazole 40mg", category: "Gastrointestinal", mfr: "Healthcare Pharma", price: 100, qty: 350, rx: false },
  { name: "Fexo", generic: "Fexofenadine 120mg", category: "Antihistamine", mfr: "Square Pharma", price: 120, qty: 250, rx: false },
  { name: "Montair", generic: "Montelukast 10mg", category: "Respiratory", mfr: "Incepta Pharma", price: 150, qty: 200, rx: true },
  { name: "Amoxil", generic: "Amoxicillin 500mg", category: "Antibiotic", mfr: "GlaxoSmithKline", price: 100, qty: 600, rx: true },
  { name: "Cef-3", generic: "Cefixime 200mg", category: "Antibiotic", mfr: "Square Pharma", price: 200, qty: 300, rx: true },
  { name: "Azithro", generic: "Azithromycin 500mg", category: "Antibiotic", mfr: "Beximco Pharma", price: 250, qty: 400, rx: true },
  { name: "Ciprocin", generic: "Ciprofloxacin 500mg", category: "Antibiotic", mfr: "ACI Pharma", price: 120, qty: 350, rx: true },
  { name: "Doxy", generic: "Doxycycline 100mg", category: "Antibiotic", mfr: "Renata Pharma", price: 80, qty: 500, rx: true },
  { name: "Flagyl", generic: "Metronidazole 400mg", category: "Antibiotic", mfr: "Square Pharma", price: 40, qty: 800, rx: false },
  { name: "Losar", generic: "Losartan 50mg", category: "Cardiovascular", mfr: "Incepta Pharma", price: 90, qty: 400, rx: true },
  { name: "Cardil", generic: "Amlodipine 5mg", category: "Cardiovascular", mfr: "Square Pharma", price: 70, qty: 450, rx: true },
  { name: "Betacard", generic: "Atenolol 50mg", category: "Cardiovascular", mfr: "Beximco Pharma", price: 60, qty: 500, rx: true },
  { name: "Lisinor", generic: "Lisinopril 10mg", category: "Cardiovascular", mfr: "ACI Pharma", price: 85, qty: 300, rx: true },
  { name: "Rosuvas", generic: "Rosuvastatin 10mg", category: "Cardiovascular", mfr: "Square Pharma", price: 180, qty: 350, rx: true },
  { name: "Metformin", generic: "Metformin 500mg", category: "Diabetes", mfr: "Beximco Pharma", price: 60, qty: 700, rx: true },
  { name: "Glizid", generic: "Gliclazide 80mg", category: "Diabetes", mfr: "Incepta Pharma", price: 120, qty: 250, rx: true },
  { name: "Insulin Mixtard", generic: "Human Insulin 30/70", category: "Diabetes", mfr: "Novo Nordisk", price: 550, qty: 100, rx: true },
  { name: "Salbutamol", generic: "Salbutamol 2mg", category: "Respiratory", mfr: "ACI Pharma", price: 30, qty: 500, rx: false },
  { name: "Budecort", generic: "Budesonide 200mcg", category: "Respiratory", mfr: "Cipla", price: 350, qty: 150, rx: true },
  { name: "Ventolin", generic: "Salbutamol Inhaler", category: "Respiratory", mfr: "GlaxoSmithKline", price: 280, qty: 120, rx: false },
  { name: "Omepra", generic: "Omeprazole 40mg", category: "Gastrointestinal", mfr: "Beximco Pharma", price: 100, qty: 300, rx: false },
  { name: "Domper", generic: "Domperidone 10mg", category: "Gastrointestinal", mfr: "Square Pharma", price: 50, qty: 400, rx: false },
  { name: "Esomez", generic: "Esomeprazole 40mg", category: "Gastrointestinal", mfr: "Renata Pharma", price: 140, qty: 250, rx: false },
  { name: "Zinc", generic: "Zinc Sulfate 20mg", category: "Vitamin", mfr: "Square Pharma", price: 25, qty: 600, rx: false },
  { name: "Vitamin D3", generic: "Cholecalciferol 2000IU", category: "Vitamin", mfr: "Incepta Pharma", price: 200, qty: 300, rx: false },
  { name: "Calbo D", generic: "Calcium + Vitamin D3", category: "Vitamin", mfr: "Beximco Pharma", price: 180, qty: 250, rx: false },
  { name: "Neurobion", generic: "Vitamin B-Complex", category: "Vitamin", mfr: "Merck", price: 150, qty: 350, rx: false },
  { name: "Iron Plus", generic: "Ferrous Sulfate + Folic Acid", category: "Vitamin", mfr: "ACI Pharma", price: 80, qty: 400, rx: false },
  { name: "Ceevit", generic: "Vitamin C 500mg", category: "Vitamin", mfr: "Square Pharma", price: 60, qty: 500, rx: false },
  { name: "Diazepam", generic: "Diazepam 5mg", category: "CNS", mfr: "Square Pharma", price: 40, qty: 200, rx: true },
  { name: "Sertraline", generic: "Sertraline 50mg", category: "CNS", mfr: "Incepta Pharma", price: 180, qty: 180, rx: true },
  { name: "Fluoxetine", generic: "Fluoxetine 20mg", category: "CNS", mfr: "Beximco Pharma", price: 120, qty: 200, rx: true },
  { name: "Clonazepam", generic: "Clonazepam 0.5mg", category: "CNS", mfr: "Renata Pharma", price: 60, qty: 250, rx: true },
  { name: "Prednisolone", generic: "Prednisolone 5mg", category: "Steroid", mfr: "Square Pharma", price: 50, qty: 400, rx: true },
  { name: "Dexamethasone", generic: "Dexamethasone 0.5mg", category: "Steroid", mfr: "Beximco Pharma", price: 30, qty: 500, rx: true },
  { name: "Betnovate", generic: "Betamethasone Valerate Cream", category: "Dermatological", mfr: "GlaxoSmithKline", price: 120, qty: 200, rx: false },
  { name: "Clotrimazole", generic: "Clotrimazole 1% Cream", category: "Antifungal", mfr: "Square Pharma", price: 80, qty: 300, rx: false },
  { name: "Flucan", generic: "Fluconazole 150mg", category: "Antifungal", mfr: "Incepta Pharma", price: 100, qty: 200, rx: true },
  { name: "Ibuprofen", generic: "Ibuprofen 400mg", category: "Painkiller", mfr: "Beximco Pharma", price: 40, qty: 600, rx: false },
  { name: "Diclofenac", generic: "Diclofenac Sodium 50mg", category: "Painkiller", mfr: "ACI Pharma", price: 35, qty: 500, rx: false },
  { name: "Naproxen", generic: "Naproxen 250mg", category: "Painkiller", mfr: "Renata Pharma", price: 100, qty: 300, rx: true },
  { name: "Ketorol", generic: "Ketorolac Trometamol 10mg", category: "Painkiller", mfr: "Square Pharma", price: 60, qty: 250, rx: true },
  { name: "Morphine", generic: "Morphine Sulfate 10mg", category: "Painkiller", mfr: "Beximco Pharma", price: 150, qty: 80, rx: true },
  { name: "Diuretic", generic: "Furosemide 40mg", category: "Cardiovascular", mfr: "Square Pharma", price: 30, qty: 600, rx: true },
  { name: "Spironolactone", generic: "Spironolactone 25mg", category: "Cardiovascular", mfr: "Incepta Pharma", price: 80, qty: 300, rx: true },
  { name: "Digoxin", generic: "Digoxin 0.25mg", category: "Cardiovascular", mfr: "ACI Pharma", price: 45, qty: 200, rx: true },
  { name: "Warfarin", generic: "Warfarin 5mg", category: "Cardiovascular", mfr: "Renata Pharma", price: 70, qty: 180, rx: true },
  { name: "Clopidogrel", generic: "Clopidogrel 75mg", category: "Cardiovascular", mfr: "Beximco Pharma", price: 160, qty: 250, rx: true },
  { name: "Pregabalin", generic: "Pregabalin 75mg", category: "CNS", mfr: "Incepta Pharma", price: 200, qty: 150, rx: true },
  { name: "Gabapentin", generic: "Gabapentin 300mg", category: "CNS", mfr: "Square Pharma", price: 150, qty: 180, rx: true },
  { name: "Loratadine", generic: "Loratadine 10mg", category: "Antihistamine", mfr: "ACI Pharma", price: 50, qty: 400, rx: false },
  { name: "Cetrizine", generic: "Cetirizine 10mg", category: "Antihistamine", mfr: "Square Pharma", price: 30, qty: 500, rx: false },
];

async function createMedicines() {
  const now = new Date();
  const medicines = MEDICINES_DATA.map((m) => ({
    name: m.name,
    genericName: m.generic,
    category: m.category,
    manufacturer: m.mfr,
    price: m.price,
    stockQuantity: m.qty,
    description: `${m.name} (${m.generic}). Manufactured by ${m.mfr}. ${m.rx ? "Prescription required." : "Over-the-counter."} Effective for indicated conditions.`,
    isPrescriptionRequired: m.rx,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await db().collection("medicines").insertMany(medicines);
  const ids = Object.values(result.insertedIds);
  console.log(`Created ${ids.length} medicines`);
  return ids;
}

const CONDITIONS_DATA = [
  {
    title: "Hypertension", severity: "High" as const,
    symptoms: ["Headache", "Shortness of breath", "Nosebleeds", "Chest pain", "Dizziness"],
    description: "A common condition where the long-term force of blood against artery walls is high enough to cause health problems.",
    precautions: ["Reduce salt intake", "Regular exercise", "Maintain healthy weight", "Limit alcohol", "Monitor BP regularly"],
  },
  {
    title: "Type 2 Diabetes", severity: "High" as const,
    symptoms: ["Increased thirst", "Frequent urination", "Blurred vision", "Slow healing", "Fatigue"],
    description: "A chronic condition affecting how the body metabolizes sugar, leading to high blood sugar levels.",
    precautions: ["Monitor blood sugar", "Healthy diet", "Regular exercise", "Medication adherence", "Foot care"],
  },
  {
    title: "Bronchial Asthma", severity: "Medium" as const,
    symptoms: ["Wheezing", "Shortness of breath", "Chest tightness", "Coughing", "Difficulty sleeping"],
    description: "A condition where airways narrow, swell and produce extra mucus, making breathing difficult.",
    precautions: ["Avoid triggers", "Use inhaler as prescribed", "Avoid smoke", "Regular checkups", "Flu vaccination"],
  },
  {
    title: "Migraine", severity: "Medium" as const,
    symptoms: ["Severe headache", "Nausea", "Light sensitivity", "Sound sensitivity", "Visual aura"],
    description: "A neurological condition causing intense, debilitating headaches often accompanied by other symptoms.",
    precautions: ["Identify triggers", "Regular sleep schedule", "Stay hydrated", "Stress management", "Avoid skipping meals"],
  },
  {
    title: "Osteoarthritis", severity: "Medium" as const,
    symptoms: ["Joint pain", "Stiffness", "Swelling", "Reduced range of motion", "Grating sensation"],
    description: "The most common form of arthritis, caused by wear-and-tear damage to joint cartilage.",
    precautions: ["Low-impact exercise", "Weight management", "Joint protection", "Heat/cold therapy", "Physical therapy"],
  },
  {
    title: "Anemia", severity: "Medium" as const,
    symptoms: ["Fatigue", "Pale skin", "Shortness of breath", "Dizziness", "Cold hands and feet"],
    description: "A condition where the blood lacks enough healthy red blood cells to carry adequate oxygen to tissues.",
    precautions: ["Iron-rich diet", "Vitamin B12 supplement", "Folic acid", "Avoid tea with meals", "Regular blood tests"],
  },
  {
    title: "Thyroid Disorder", severity: "Medium" as const,
    symptoms: ["Weight changes", "Fatigue", "Mood swings", "Temperature sensitivity", "Heart palpitations"],
    description: "A condition affecting the thyroid gland, leading to overproduction or underproduction of thyroid hormones.",
    precautions: ["Regular thyroid tests", "Medication compliance", "Stress management", "Iodine balance", "Regular checkups"],
  },
  {
    title: "Gastritis", severity: "Low" as const,
    symptoms: ["Stomach pain", "Nausea", "Bloating", "Indigestion", "Loss of appetite"],
    description: "Inflammation of the stomach lining, often caused by infection or excessive use of NSAIDs.",
    precautions: ["Avoid spicy foods", "Limit alcohol", "No smoking", "Small frequent meals", "Avoid NSAIDs"],
  },
  {
    title: "Urinary Tract Infection", severity: "Low" as const,
    symptoms: ["Burning urination", "Frequent urination", "Cloudy urine", "Pelvic pain", "Blood in urine"],
    description: "An infection in any part of the urinary system, most commonly the bladder and urethra.",
    precautions: ["Stay hydrated", "Proper hygiene", "Urinate after intercourse", "Avoid holding urine", "Cranberry juice"],
  },
  {
    title: "Dengue Fever", severity: "High" as const,
    symptoms: ["High fever", "Severe headache", "Pain behind eyes", "Joint pain", "Skin rash"],
    description: "A mosquito-borne viral infection causing flu-like illness, which can develop into severe dengue.",
    precautions: ["Mosquito repellent", "Remove standing water", "Mosquito nets", "Cover skin", "Community hygiene"],
  },
  {
    title: "Tuberculosis", severity: "High" as const,
    symptoms: ["Persistent cough", "Weight loss", "Night sweats", "Fever", "Coughing blood"],
    description: "A serious infectious disease primarily affecting the lungs, caused by Mycobacterium tuberculosis.",
    precautions: ["Complete DOTS therapy", "Cover mouth when coughing", "Good ventilation", "BCG vaccination", "Regular screening"],
  },
  {
    title: "Allergic Rhinitis", severity: "Low" as const,
    symptoms: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion", "Watery eyes"],
    description: "An allergic response to airborne allergens causing inflammation of the nasal passages.",
    precautions: ["Avoid allergens", "Use antihistamines", "Nasal saline rinse", "Air purifier", "Keep windows closed"],
  },
  {
    title: "Chronic Kidney Disease", severity: "High" as const,
    symptoms: ["Swollen ankles", "Fatigue", "Shortness of breath", "Nausea", "Muscle cramps"],
    description: "A progressive loss of kidney function over months or years, leading to waste accumulation in the blood.",
    precautions: ["Controlled diet", "Blood pressure management", "Limit protein intake", "Avoid NSAIDs", "Regular dialysis if needed"],
  },
  {
    title: "COVID-19", severity: "High" as const,
    symptoms: ["Fever", "Cough", "Loss of taste/smell", "Difficulty breathing", "Fatigue"],
    description: "A respiratory illness caused by SARS-CoV-2, ranging from mild symptoms to severe respiratory distress.",
    precautions: ["Vaccination", "Mask wearing", "Hand hygiene", "Social distancing", "Boost immunity"],
  },
  {
    title: "Common Cold", severity: "Low" as const,
    symptoms: ["Runny nose", "Sore throat", "Cough", "Sneezing", "Mild fever"],
    description: "A viral infection of the upper respiratory tract, usually harmless and self-limiting.",
    precautions: ["Hand washing", "Avoid close contact", "Rest", "Stay hydrated", "Boost vitamin C"],
  },
];

async function createConditions() {
  const now = new Date();
  const conditions = CONDITIONS_DATA.map((c) => ({
    title: c.title,
    description: c.description,
    symptoms: c.symptoms,
    severity: c.severity,
    precautions: c.precautions,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await db().collection("healthconditions").insertMany(conditions);
  const ids = Object.values(result.insertedIds);
  console.log(`Created ${ids.length} health conditions`);
  return ids;
}

const BLOGS_DATA = [
  { title: "Understanding Blood Pressure: A Complete Guide", tags: ["heart", "blood pressure", "hypertension", "prevention"], content: "Blood pressure is the force of blood pushing against artery walls. This comprehensive guide explains what normal and high blood pressure mean, how to measure it accurately at home, lifestyle changes that can lower readings naturally, and when medication becomes necessary. Understanding your numbers is the first step toward cardiovascular health.\n\n## What the Numbers Mean\n\nBlood pressure readings have two numbers: systolic (pressure during heartbeats) and diastolic (pressure between beats). A normal reading is below 120/80 mmHg. Prehypertension ranges from 120-139/80-89 mmHg, and hypertension is 140/90 mmHg or higher.\n\n## Lifestyle Modifications\n\nReducing sodium intake, increasing physical activity, maintaining a healthy weight, limiting alcohol, and managing stress can all contribute to healthier blood pressure levels. Even a 5-10% reduction in body weight can significantly improve readings." },
  { title: "Managing Diabetes in Daily Life", tags: ["diabetes", "blood sugar", "diet", "lifestyle"], content: "Living with diabetes requires consistent management, but modern tools and understanding make it easier than ever. This article covers blood glucose monitoring techniques, carbohydrate counting, the role of exercise in insulin sensitivity, medication adherence strategies, and how to handle special situations like dining out or illness.\n\n## Blood Sugar Monitoring\n\nRegular monitoring helps understand how food, activity, and medication affect blood glucose. Target ranges vary by individual, but generally fasting glucose should be 80-130 mg/dL and post-meal below 180 mg/dL.\n\n## Diet and Exercise\n\nA balanced diet emphasizing whole grains, lean proteins, vegetables, and healthy fats, combined with 150 minutes of moderate exercise weekly, forms the foundation of diabetes management." },
  { title: "The Complete Guide to Childhood Vaccinations", tags: ["pediatrics", "vaccination", "children", "immunization"], content: "Vaccinations are one of the most effective public health interventions, preventing millions of deaths annually. This guide covers the recommended immunization schedule from birth through adolescence, explains how vaccines work to build immunity, addresses common concerns about safety, and discusses the importance of herd immunity for protecting vulnerable community members.\n\n## Recommended Schedule\n\nBirth: BCG, Hepatitis B\n6 Weeks: DPT, Polio, Hib, Rotavirus\n10 Weeks: Second doses\n14 Weeks: Third doses\n9 Months: Measles, Rubella\n12-15 Months: MMR, Varicella\nBooster doses continue through adolescence." },
  { title: "Mental Health in the Digital Age", tags: ["mental health", "stress", "anxiety", "digital wellness"], content: "Our constant connection to digital devices has profound effects on mental wellbeing. This article explores the relationship between screen time and mental health, provides strategies for digital detox, discusses the rise of teletherapy, and offers practical tips for maintaining psychological balance while living in an increasingly connected world.\n\n## Digital Overload\n\nExcessive screen time, especially social media, has been linked to increased rates of anxiety and depression. Setting boundaries, such as no-phone zones and scheduled digital breaks, can significantly improve mental health outcomes.\n\n## Seeking Help\n\nTeletherapy platforms have made mental health support more accessible. Cognitive Behavioral Therapy (CBT) and mindfulness-based approaches have strong evidence for treating anxiety and depression." },
  { title: "Nutrition Myths Debunked by Science", tags: ["nutrition", "diet", "health", "science"], content: "Nutrition advice changes constantly, making it hard to separate fact from fiction. This article examines common nutrition myths through the lens of current scientific evidence, covering topics like carbohydrate fear, detox diets, superfood claims, meal timing, and supplement efficacy.\n\n## Common Myths\n\nMyth: Carbs are bad for you. Fact: Complex carbohydrates from whole grains, fruits, and vegetables are essential for energy and health.\nMyth: Detox diets cleanse your body. Fact: Your liver and kidneys are perfectly capable of detoxification without expensive cleanses.\nMyth: Eating after 8 PM causes weight gain. Fact: Total calorie intake matters more than timing." },
  { title: "Understanding and Managing Allergies", tags: ["allergies", "immunology", "treatment", "seasonal"], content: "Allergies affect millions worldwide, ranging from mild seasonal discomfort to life-threatening anaphylaxis. This comprehensive guide explains how allergic reactions occur, common triggers like pollen, dust mites, and certain foods, diagnostic approaches including skin prick and blood tests, and treatment options from antihistamines to immunotherapy.\n\n## Types of Allergies\n\nSeasonal allergies (hay fever), food allergies, drug allergies, insect sting allergies, and contact dermatitis each require different management approaches. Identifying specific triggers through testing is the first step.\n\n## Treatment Approaches\n\nAntihistamines, nasal corticosteroids, decongestants, and immunotherapy (allergy shots) form the treatment ladder. For severe allergies, carrying epinephrine auto-injectors is essential." },
  { title: "Exercise Guidelines for Heart Health", tags: ["exercise", "heart health", "cardiology", "fitness"], content: "Regular physical activity is one of the most powerful tools for maintaining cardiovascular health. This article outlines evidence-based exercise recommendations, explains how different types of exercise benefit the heart, provides sample workout plans for different fitness levels, and discusses safety considerations for those with existing heart conditions.\n\n## Recommended Activity\n\nThe American Heart Association recommends at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity weekly, plus muscle-strengthening activities twice per week.\n\n## Types of Exercise\n\nAerobic exercise (walking, swimming, cycling) improves cardiovascular endurance. Strength training builds muscle mass and improves metabolism. Flexibility and balance exercises reduce injury risk." },
  { title: "Sleep Hygiene: The Foundation of Health", tags: ["sleep", "health", "wellness", "hygiene"], content: "Quality sleep is as essential to health as nutrition and exercise, yet millions struggle with sleep disorders. This article explores the science of sleep, the consequences of sleep deprivation on physical and mental health, practical sleep hygiene practices, and when to seek professional help for sleep disorders.\n\n## Sleep Requirements\n\nAdults need 7-9 hours of quality sleep per night. Children and teenagers require more. Consistent sleep and wake times, even on weekends, help regulate the body's internal clock.\n\n## Practical Tips\n\nCreate a cool, dark, quiet sleeping environment. Avoid screens 1 hour before bed. Limit caffeine after 2 PM. Establish a relaxing pre-sleep routine. Exercise regularly but not right before bed." },
  { title: "A Guide to Common Diagnostic Tests", tags: ["diagnostics", "tests", "health", "screening"], content: "Medical diagnostic tests can seem overwhelming with their abbreviations and reference ranges. This article explains common blood tests (CBC, lipid panel, liver function, kidney function, thyroid panel), imaging studies (X-ray, ultrasound, CT, MRI), and screening procedures, helping patients understand what each test measures and what results mean.\n\n## Common Blood Tests\n\nComplete Blood Count (CBC) measures red cells, white cells, and platelets. Lipid panel checks cholesterol types. Comprehensive Metabolic Panel (CMP) evaluates kidney and liver function, electrolytes, and blood sugar.\n\n## Imaging Overview\n\nX-rays are best for bones. Ultrasound excels at soft tissues and obstetrics. CT provides detailed cross-sectional images. MRI offers superior soft tissue contrast without radiation." },
  { title: "Preventing and Managing Seasonal Flu", tags: ["flu", "influenza", "prevention", "seasonal"], content: "Seasonal influenza affects millions annually, causing significant illness and sometimes serious complications. This article covers how the flu virus spreads, the importance of annual vaccination, symptoms to watch for, treatment options including antiviral medications, home care strategies, and warning signs that require medical attention.\n\n## Flu vs. Cold\n\nFlu symptoms typically come on suddenly and include high fever, body aches, and fatigue. Colds are usually milder with more nasal symptoms. Antiviral medications like oseltamivir work best when started within 48 hours of symptom onset.\n\n## Prevention\n\nAnnual flu vaccination is the most effective prevention strategy. Hand hygiene, covering coughs, avoiding close contact with sick individuals, and staying home when ill all help reduce transmission." },
];

async function createBlogs() {
  const now = new Date();
  const blogs = BLOGS_DATA.map((b) => ({
    title: b.title,
    content: b.content,
    authorId: ADMIN_ID,
    tags: b.tags,
    status: "Published",
    viewCount: Math.floor(Math.random() * 500) + 50,
    createdAt: new Date(now.getTime() - Math.floor(Math.random() * 30) * 86400000),
    updatedAt: now,
  }));

  const result = await db().collection("blogs").insertMany(blogs);
  const ids = Object.values(result.insertedIds);
  console.log(`Created ${ids.length} blogs`);
  return ids;
}

async function createReviews(doctorIds: ObjectId[], medicineIds: ObjectId[]) {
  const now = new Date();
  const REVIEWERS = [PATIENT_ID, DOCTOR_USER_ID, ADMIN_ID];
  const REVIEW_TEXTS = [
    "Excellent care and very professional. Highly recommended.",
    "Good experience overall. The doctor was knowledgeable.",
    "Very effective medication. Noticed improvement within days.",
    "Affordable and genuine medicine. Will buy again.",
    "The specialist was thorough and explained everything clearly.",
    "Great hospital facilities and caring staff.",
    "Medicine worked as expected with no side effects.",
    "Doctor was very patient and answered all my questions.",
    "Quality product at a reasonable price point.",
    "Lifesaving treatment. Forever grateful.",
    "Clean clinic and efficient service.",
    "Would recommend to family and friends.",
    "Decent experience but waiting time was long.",
    "Very satisfied with the treatment outcome.",
    "Professional approach and modern treatment methods.",
  ];

  const reviews = [];

  // Reviews for doctors
  const doctorSubset = doctorIds.slice(0, 18);
  for (const docId of doctorSubset) {
    const numReviews = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numReviews; i++) {
      reviews.push({
        reviewerId: REVIEWERS[Math.floor(Math.random() * REVIEWERS.length)],
        targetId: docId,
        targetType: "Doctor" as const,
        rating: Math.floor(Math.random() * 3) + 3,
        comment: REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)],
        isApproved: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Reviews for medicines
  const medSubset = medicineIds.slice(0, 30);
  for (const medId of medSubset) {
    const numReviews = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numReviews; i++) {
      reviews.push({
        reviewerId: REVIEWERS[Math.floor(Math.random() * REVIEWERS.length)],
        targetId: medId,
        targetType: "Medicine" as const,
        rating: Math.floor(Math.random() * 3) + 3,
        comment: REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)],
        isApproved: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await db().collection("reviews").insertMany(reviews);
  console.log(`Created ${reviews.length} reviews`);
}

async function createHealthRecords() {
  const now = new Date();
  const records = [
    {
      patientId: PATIENT_ID,
      chronicConditions: ["Hypertension", "Type 2 Diabetes"],
      allergies: ["Penicillin", "Sulfa drugs"],
      currentMedications: [
        { name: "Losar", dosage: "50mg", frequency: "Once daily" },
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
      ],
      emergencyContact: {
        name: "Rahim Rahman",
        relationship: "Spouse",
        phone: "+8801712345678",
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      patientId: DOCTOR_USER_ID,
      chronicConditions: [],
      allergies: ["Dust", "Pollen"],
      currentMedications: [],
      emergencyContact: {
        name: "Fatima Hossain",
        relationship: "Spouse",
        phone: "+8801712345679",
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db().collection("healthrecords").insertMany(records);
  console.log(`Created ${records.length} health records`);
}

async function createChatSessions() {
  const now = new Date();
  const sessions = [
    {
      participants: [PATIENT_ID],
      messages: [
        { senderId: PATIENT_ID, content: "I've been having frequent headaches for the past week. What could be the cause?", timestamp: new Date(now.getTime() - 86400000), suggestedFollowUps: ["What type of headache?", "Any other symptoms?"] },
        { senderId: PATIENT_ID, content: "The pain is usually on both sides of my head and gets worse by evening.", timestamp: new Date(now.getTime() - 82800000) },
      ],
      status: "Active",
      sessionTitle: "Headache Consultation",
      createdAt: new Date(now.getTime() - 86400000),
      updatedAt: now,
    },
    {
      participants: [PATIENT_ID],
      messages: [
        { senderId: PATIENT_ID, content: "I need information about managing blood pressure naturally.", timestamp: new Date(now.getTime() - 172800000), suggestedFollowUps: ["Lifestyle changes", "Diet recommendations", "When to see a doctor"] },
        { senderId: PATIENT_ID, content: "My BP reading was 135/85 this morning.", timestamp: new Date(now.getTime() - 169200000) },
      ],
      status: "Active",
      sessionTitle: "Blood Pressure Management",
      createdAt: new Date(now.getTime() - 172800000),
      updatedAt: now,
    },
    {
      participants: [DOCTOR_USER_ID],
      messages: [
        { senderId: DOCTOR_USER_ID, content: "What are the latest treatment protocols for diabetic neuropathy?", timestamp: new Date(now.getTime() - 259200000) },
      ],
      status: "Closed",
      sessionTitle: "Treatment Protocols",
      createdAt: new Date(now.getTime() - 259200000),
      updatedAt: new Date(now.getTime() - 250000000),
    },
  ];

  await db().collection("chatsessions").insertMany(sessions);
  console.log(`Created ${sessions.length} chat sessions`);
}

async function createSymptomAnalyses() {
  const now = new Date();
  const analyses = [
    {
      patientId: PATIENT_ID,
      reportedSymptoms: ["Headache", "Fatigue", "Dizziness"],
      duration: "5 days",
      severity: "Moderate",
      additionalInfo: "Pain is worse in the afternoon, relieved by rest.",
      aiAnalysis: {
        urgencyLevel: "routine",
        urgencyExplanation: "Symptoms are common and not indicative of an emergency, but persistent headaches warrant evaluation.",
        possibleConditions: [
          { name: "Tension Headache", probability: "65%", description: "Most common type of headache, often triggered by stress", urgency: "routine" },
          { name: "Migraine", probability: "20%", description: "Neurological condition causing moderate to severe headaches", urgency: "soon" },
          { name: "Anemia", probability: "10%", description: "Low red blood cell count causing fatigue and dizziness", urgency: "routine" },
        ],
        recommendations: ["Rest in a dark, quiet room", "Stay hydrated", "Monitor blood pressure", "Keep a headache diary"],
        warningSignsToWatch: ["Sudden severe headache", "Vision changes", "Neck stiffness", "Fever"],
        shouldSeeDoctor: true,
        doctorType: "General Practitioner",
        lifestyleAdvice: ["Maintain regular sleep schedule", "Reduce screen time", "Practice stress management"],
        disclaimer: "This analysis is for informational purposes only and does not constitute medical advice.",
      },
      AI_Assessment_Result: "Routine - Monitor symptoms",
      recommendedAction: "Consult a general practitioner if symptoms persist beyond 7 days.",
      timestamp: new Date(now.getTime() - 86400000),
      createdAt: now,
      updatedAt: now,
    },
    {
      patientId: DOCTOR_USER_ID,
      reportedSymptoms: ["Sore throat", "Cough", "Mild fever"],
      duration: "3 days",
      severity: "Mild",
      additionalInfo: "Fever is below 100°F, cough is dry.",
      aiAnalysis: {
        urgencyLevel: "monitor",
        urgencyExplanation: "Mild upper respiratory symptoms with low-grade fever can be monitored at home.",
        possibleConditions: [
          { name: "Common Cold", probability: "70%", description: "Viral upper respiratory infection", urgency: "monitor" },
          { name: "Pharyngitis", probability: "20%", description: "Inflammation of the pharynx", urgency: "soon" },
          { name: "Allergic Rhinitis", probability: "10%", description: "Allergic reaction causing throat irritation", urgency: "monitor" },
        ],
        recommendations: ["Rest and hydrate", "Warm salt water gargle", "Over-the-counter throat lozenges", "Monitor fever"],
        warningSignsToWatch: ["Fever above 101°F", "Difficulty swallowing", "Difficulty breathing", "Chest pain"],
        shouldSeeDoctor: false,
        doctorType: undefined,
        lifestyleAdvice: ["Avoid cold drinks", "Use a humidifier", "Get plenty of rest"],
        disclaimer: "This analysis is for informational purposes only and does not constitute medical advice.",
      },
      AI_Assessment_Result: "Monitor - Likely viral infection",
      recommendedAction: "Rest and symptomatic treatment. Consult if fever persists beyond 5 days.",
      timestamp: new Date(now.getTime() - 172800000),
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db().collection("symptomanalyses").insertMany(analyses);
  console.log(`Created ${analyses.length} symptom analyses`);
}

async function createReportAnalyses() {
  const now = new Date();
  const analyses = [
    {
      patientId: PATIENT_ID,
      reportName: "Complete Blood Count - March 2026",
      reportType: "Blood Test",
      uploadedImageUrl: "https://i.ibb.co/example/cbc-report.jpg",
      originalText: "Hb: 12.5 g/dL, RBC: 4.2 M/uL, WBC: 6500/uL, Platelets: 250000/uL",
      analysisSummary: "Results are largely within normal range. Slightly low hemoglobin noted.",
      aiAnalysis: {
        summary: "CBC results show mild anemia with hemoglobin slightly below normal. Other parameters within expected ranges.",
        keyFindings: ["Hemoglobin: 12.5 g/dL (low - normal is 13.5-17.5)", "RBC count: Normal", "WBC count: Normal", "Platelet count: Normal"],
        recommendations: ["Iron-rich diet recommended", "Repeat CBC in 3 months", "Consider ferritin test"],
        riskIndicators: ["Mild anemia detected - monitor"],
        normalValues: { RBC: "4.5-5.5 M/uL", WBC: "4500-11000/uL", Platelets: "150000-400000/uL" },
        abnormalValues: { Hemoglobin: { value: "12.5 g/dL", range: "13.5-17.5 g/dL" } },
      },
      createdAt: new Date(now.getTime() - 432000000),
      updatedAt: now,
    },
    {
      patientId: PATIENT_ID,
      reportName: "Chest X-Ray Report",
      reportType: "X-Ray",
      uploadedImageUrl: "https://i.ibb.co/example/chest-xray.jpg",
      originalText: "Normal chest X-ray. No consolidations, effusions, or pneumothorax. Heart size normal.",
      analysisSummary: "Chest X-ray shows normal findings with no abnormalities detected.",
      aiAnalysis: {
        summary: "Chest radiograph is unremarkable. Lungs are clear, heart size is within normal limits, no pleural effusion or pneumothorax identified.",
        keyFindings: ["Lungs: Clear bilaterally", "Heart size: Normal", "No effusion", "No pneumothorax", "Bony structures: Intact"],
        recommendations: ["No immediate follow-up needed", "Routine annual checkup recommended"],
        riskIndicators: [],
        normalValues: { "Heart Size": "< 50% thoracic diameter", "Lung Fields": "Clear" },
        abnormalValues: {},
      },
      createdAt: new Date(now.getTime() - 86400000),
      updatedAt: now,
    },
  ];

  await db().collection("reportanalyses").insertMany(analyses);
  console.log(`Created ${analyses.length} report analyses`);
}

async function main() {
  console.log("\n=== MediMind Database Seed ===\n");

  await connect();
  await dropCollections();

  await createDemoUsers();

  const { doctors, doctorMap } = await createDoctors();
  const doctorIds = doctors.map((d) => d.userId);

  // Create the doctor User model entry for DOCTOR_USER_ID linking to first doctor doc
  console.log(`Doctor user ${DOCTOR_USER_ID.toString()} linked to ${DOCTORS_DATA[0].name}`);

  const medicineIds = await createMedicines();
  await createConditions();
  await createBlogs();
  await createReviews(doctorIds, medicineIds);
  await createHealthRecords();
  await createChatSessions();
  await createSymptomAnalyses();
  await createReportAnalyses();

  console.log("\n=== Seed Complete ===\n");
  console.log("Demo credentials:");
  console.log("  patient@medimind.demo / Demo@1234  (role: user)");
  console.log("  doctor@medimind.demo / Demo@1234  (role: doctor)");
  console.log("  admin@medimind.demo / Admin@1234  (role: admin)");

  await disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
