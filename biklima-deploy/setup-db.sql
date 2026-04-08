-- =============================================
-- إعداد قاعدة بيانات موقع بكلمة
-- شغّل هذا الملف مرة واحدة فقط
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

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

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
