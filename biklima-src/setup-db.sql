-- =============================================
-- إعداد قاعدة بيانات موقع بكلمة
-- آمن للتشغيل المتكرر — يستخدم IF NOT EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── LMS: Instructors ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructors (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  title_ar VARCHAR,
  title_en VARCHAR,
  bio_ar TEXT,
  bio_en TEXT,
  photo_url VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── LMS: Categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Courses (base table) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id VARCHAR,
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR NOT NULL,
  title_fr VARCHAR NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  description_fr TEXT,
  image_url VARCHAR,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add LMS columns to courses (safe, additive only)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle_ar VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle_en VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS trailer_url VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn_ar JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn_en JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements_ar JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements_en JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience_ar JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience_en JSONB;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR DEFAULT 'all';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ar';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS discount_price INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hours INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sessions INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id VARCHAR REFERENCES instructors(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id VARCHAR REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_title VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- ── LMS: Course Sections ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_sections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Lessons (base table) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR NOT NULL,
  title_fr VARCHAR NOT NULL,
  video_url VARCHAR,
  video_type VARCHAR DEFAULT 'youtube',
  duration_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add LMS columns to lessons (safe, additive only)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS section_id VARCHAR REFERENCES course_sections(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN NOT NULL DEFAULT FALSE;

-- ── LMS: Lesson Resources ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id VARCHAR NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR NOT NULL,
  resource_url VARCHAR NOT NULL,
  resource_type VARCHAR DEFAULT 'pdf',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Enrollments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Lesson Progress ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ── LMS: Course Orders ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  course_id VARCHAR REFERENCES courses(id) ON DELETE SET NULL,
  buyer_name VARCHAR NOT NULL,
  buyer_email VARCHAR NOT NULL,
  buyer_phone VARCHAR NOT NULL,
  amount INTEGER,
  currency VARCHAR DEFAULT 'JOD',
  status VARCHAR NOT NULL DEFAULT 'pending',
  payment_notes TEXT,
  admin_notes TEXT,
  admin_approved_by VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── LMS: Reviews ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment_ar TEXT,
  comment_en TEXT,
  reviewer_name VARCHAR,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Enrollment Requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  applicant_type VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  program_id VARCHAR NOT NULL,
  training_type VARCHAR,
  private_mode VARCHAR,
  youtube_link VARCHAR,
  discount_code VARCHAR,
  institution_name VARCHAR,
  student_count INTEGER,
  teacher_count INTEGER,
  workbooks_needed INTEGER,
  message TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Workbook Orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workbook_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  workbook_id VARCHAR NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  format VARCHAR NOT NULL,
  buyer_name VARCHAR NOT NULL,
  buyer_email VARCHAR NOT NULL,
  buyer_phone VARCHAR NOT NULL,
  delivery_address TEXT,
  total_price INTEGER,
  currency VARCHAR DEFAULT 'JOD',
  status VARCHAR NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
