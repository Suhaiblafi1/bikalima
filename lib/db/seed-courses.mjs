import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../../.env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const courses = [
  {
    programId: "core",
    slug: "influential-speaker",
    titleAr: "المتحدث المؤثر",
    titleEn: "The Influential Speaker",
    titleFr: "Le Conférencier Influent",
    descriptionAr: "برنامج تحويلي يبني مهارات التواصل والإقناع والعرض الاحترافي لدى المشارك، ويمنحه أدوات عملية للتأثير في كل محفل.",
    descriptionEn: "A transformational program that builds communication, persuasion, and professional presentation skills, equipping participants with practical tools for impact in any setting.",
    imageUrl: "/hero-bg.jpg",
    price: 70,
    isPublished: true,
  },
  {
    programId: "tot",
    slug: "certified-trainer",
    titleAr: "المدرّب المعتمد",
    titleEn: "Certified Trainer",
    titleFr: "Formateur Certifié",
    descriptionAr: "برنامج التأهيل التدريبي المعتمد من بكلمة — يؤهلك لتقديم برامج بكلمة وبناء مسيرة احترافية في التدريب.",
    descriptionEn: "Bikalima's official trainer certification program — qualifying you to deliver Bikalima programs and build a professional training career.",
    imageUrl: "/hero-bg.jpg",
    price: 110,
    isPublished: true,
  },
  {
    programId: "teachers",
    slug: "educators-program",
    titleAr: "برنامج المعلمين",
    titleEn: "The Educators Program",
    titleFr: "Programme des Enseignants",
    descriptionAr: "برنامج مخصص للمعلمين يمنحهم مهارات التواصل الفعّال وفن إدارة الصف وتحويل البيئة التعليمية إلى فضاء حيّ مؤثر.",
    descriptionEn: "A program dedicated to educators that provides effective communication skills, classroom management, and the art of transforming the learning environment.",
    imageUrl: "/hero-bg.jpg",
    price: 90,
    isPublished: true,
  },
  {
    programId: "children",
    slug: "young-speaker",
    titleAr: "الناشئ المتحدث",
    titleEn: "The Young Speaker",
    titleFr: "Le Jeune Orateur",
    descriptionAr: "برنامج بكلمة للناشئين يبني مهارات التواصل والثقة بالنفس والقيادة لدى الجيل القادم في بيئة تفاعلية ممتعة.",
    descriptionEn: "Bikalima's program for youth builds communication skills, self-confidence, and leadership in the next generation through a fun, interactive environment.",
    imageUrl: "/hero-bg.jpg",
    price: null,
    isPublished: true,
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const course of courses) {
      const existing = await client.query(
        "SELECT id FROM courses WHERE program_id = $1",
        [course.programId]
      );
      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE courses SET slug=$1, title_ar=$2, title_en=$3, title_fr=$4, description_ar=$5, description_en=$6, image_url=$7, price=$8, is_published=$9, updated_at=NOW()
           WHERE program_id=$10`,
          [course.slug, course.titleAr, course.titleEn, course.titleFr, course.descriptionAr, course.descriptionEn, course.imageUrl, course.price, course.isPublished, course.programId]
        );
        console.log(`✓ Updated course: ${course.titleAr}`);
      } else {
        await client.query(
          `INSERT INTO courses (program_id, slug, title_ar, title_en, title_fr, description_ar, description_en, image_url, price, is_published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [course.programId, course.slug, course.titleAr, course.titleEn, course.titleFr, course.descriptionAr, course.descriptionEn, course.imageUrl, course.price, course.isPublished]
        );
        console.log(`✓ Created course: ${course.titleAr}`);
      }
    }
    console.log("✅ Courses seeded successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
