/**
 * Seed LMS data for Bikalima — run once after migrate.js
 * node seed-lms.js
 */
import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log("✅ Connected to DB");

async function seed() {
  // ── 1. Instructor ──────────────────────────────────────────
  const instRes = await client.query(`
    INSERT INTO instructors (name_ar, name_en, title_ar, title_en, bio_ar, bio_en, email)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT DO NOTHING
    RETURNING id
  `, [
    "صهيب الخوالدة",
    "Suhaib Al-Khawaldeh",
    "مستشار · باحث دكتوراه · متحدث TEDx · مؤسس بكلمة",
    "Consultant · PhD Researcher · TEDx Speaker · Founder of Bikalima",
    "مستشار يعمل مع مجموعة من المؤسسات التنموية والخيرية والحكومية في المنطقة، من بينها Qatar Foundation ووزارة الاقتصاد والسياحة في دولة الإمارات. محاضر في عدد من الجامعات، منها American University في الإمارات، وجامعة Aston في المملكة المتحدة. باحث دكتوراه في Aston University ومتحدث TEDx ومؤلف سلسلة كراسات بكلمة التدريبية.",
    "A consultant working with development, charitable and government organisations across the region, including Qatar Foundation and the UAE Ministry of Economy and Tourism. Lecturer at American University in the UAE and Aston University (UK). PhD researcher, TEDx speaker, and author of the Bikalima training workbook series.",
    "info@bikalima.com",
  ]);

  let instructorId;
  if (instRes.rows.length > 0) {
    instructorId = instRes.rows[0].id;
  } else {
    const r = await client.query("SELECT id FROM instructors WHERE email = $1", ["info@bikalima.com"]);
    instructorId = r.rows[0]?.id;
  }

  console.log("✅ Instructor:", instructorId);

  // ── 2. Category ───────────────────────────────────────────
  const catRes = await client.query(`
    INSERT INTO categories (name_ar, name_en, slug)
    VALUES ($1,$2,$3)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `, ["الخطابة والتأثير", "Public Speaking & Impact", "public-speaking"]);

  let categoryId;
  if (catRes.rows.length > 0) {
    categoryId = catRes.rows[0].id;
  } else {
    const r = await client.query("SELECT id FROM categories WHERE slug = $1", ["public-speaking"]);
    categoryId = r.rows[0]?.id;
  }

  console.log("✅ Category:", categoryId);

  // ── 3. Programs ───────────────────────────────────────────
  const programs = [
    {
      programId: "core",
      slug: "influential-speaker",
      titleAr: "المتحدث المؤثر",
      titleEn: "The Influential Speaker",
      titleFr: "L'Orateur Influent",
      subtitleAr: "صناعة التأثير وفن الإلقاء والخطابة",
      subtitleEn: "Crafting Influence & the Art of Public Speaking",
      descriptionAr: "برنامج تدريبي متكامل لليافعين والشباب والكبار، يهدف إلى بناء متحدث أكثر حضوراً ووضوحاً وتأثيراً في الدراسة والعمل والحياة العامة. يركز على تطوير الثقة، وتنظيم الرسائل، وتحسين الإلقاء، ورفع جودة العروض، وبناء قدرة حقيقية على الإقناع.",
      descriptionEn: "A comprehensive training program for youth and professionals, designed to build a more present, clear, and impactful speaker in academic, professional, and public contexts.",
      trailerUrl: "https://www.youtube.com/watch?v=QRHnlnwcFXI",
      seoTitle: "المتحدث المؤثر — برنامج بكلمة للخطابة والتأثير",
      seoDescription: "برنامج تدريبي متكامل لبناء مهارات الخطابة والإلقاء والتأثير — ٢٧ ساعة تدريب مع صهيب الخوالدة",
      price: 70,
      hours: 27,
      sessions: 14,
      whatYouLearnAr: ["بناء حضور الشخصية", "تقنيات الإقناع والتأثير", "هندسة الخطاب والرسالة", "التوازن الانفعالي أمام الجمهور", "أدوات الإلقاء المهني", "التواصل الذكي في السياقات المختلفة"],
      whatYouLearnEn: ["Building personal presence", "Persuasion and influence techniques", "Speech and message architecture", "Emotional balance in front of an audience", "Professional delivery tools", "Smart communication in different contexts"],
      requirementsAr: ["لا يوجد متطلب سابق — الدورة الأساسية مفتوحة للجميع", "حماس وإرادة حقيقية للتطوير"],
      requirementsEn: ["No prerequisite — the core course is open to all", "Genuine enthusiasm and willingness to develop"],
      targetAudienceAr: ["الشباب واليافعون من سن ١٥ فأكثر", "المهنيون الراغبون في تعزيز تأثيرهم", "من يعاني من الخوف والتوتر عند التحدث", "طلاب الجامعات والخريجون الجدد"],
      targetAudienceEn: ["Youth aged 15 and above", "Professionals seeking to boost their impact", "Those struggling with speaking anxiety", "University students and fresh graduates"],
      sections: [
        { titleAr: "الوحدة الأولى: من متحدث عادي إلى متحدث مؤثر", titleEn: "Unit 1: From Ordinary to Influential Speaker", lessons: [
          { titleAr: "من متحدث عادي إلى متحدث مؤثر", titleEn: "From Ordinary to Influential Speaker", duration: 90, isFreePreview: true },
          { titleAr: "الثقة، الحضور، والانطباع الأول", titleEn: "Confidence, Presence, and First Impressions", duration: 90 },
        ]},
        { titleAr: "الوحدة الثانية: إدارة التوتر والخوف", titleEn: "Unit 2: Managing Anxiety and Fear", lessons: [
          { titleAr: "إدارة الخوف والتحكم في التوتر", titleEn: "Managing Fear and Controlling Anxiety", duration: 90, isFreePreview: true },
          { titleAr: "كيف تبني رسالتك بوضوح؟", titleEn: "How to Build Your Message Clearly", duration: 90 },
        ]},
        { titleAr: "الوحدة الثالثة: بناء الرسالة والخطاب", titleEn: "Unit 3: Message and Speech Architecture", lessons: [
          { titleAr: "تنظيم الفكرة وافتتاح الحديث وختامه", titleEn: "Organizing Ideas, Opening, and Closing", duration: 90 },
          { titleAr: "نبرة الصوت، الوقفة، ولغة الجسد", titleEn: "Voice Tone, Pause, and Body Language", duration: 90 },
        ]},
        { titleAr: "الوحدة الرابعة: الإقناع والتأثير", titleEn: "Unit 4: Persuasion and Influence", lessons: [
          { titleAr: "مهارات الإقناع والتأثير", titleEn: "Persuasion and Influence Skills", duration: 90 },
          { titleAr: "مخاطبة الجمهور بحسب السياق", titleEn: "Addressing Different Audiences", duration: 90 },
        ]},
        { titleAr: "الوحدة الخامسة: التطبيق والتطوير", titleEn: "Unit 5: Application and Development", lessons: [
          { titleAr: "تقديم العروض والخطابات", titleEn: "Delivering Presentations and Speeches", duration: 90 },
          { titleAr: "إدارة الأسئلة والاعتراضات", titleEn: "Managing Questions and Objections", duration: 90 },
          { titleAr: "التحدث في الاجتماعات والمناسبات", titleEn: "Speaking in Meetings and Events", duration: 90 },
          { titleAr: "التغذية الراجعة وخطة التطوير الشخصي", titleEn: "Feedback and Personal Development Plan", duration: 90 },
        ]},
      ],
    },
    {
      programId: "tot",
      slug: "certified-trainer",
      titleAr: "المدرب المعتمد",
      titleEn: "The Certified Trainer",
      titleFr: "Le Formateur Certifié",
      subtitleAr: "تدريب المدربين — من متحدث محترف إلى مدرب معتمد",
      subtitleEn: "Train the Trainer — From Professional Speaker to Certified Coach",
      descriptionAr: "برنامج تأهيلي متقدم لإعداد مدربين معتمدين قادرين على تقديم برنامج بكلمة للكبار باحتراف. يركز على بناء هوية المدرب، وفهم فلسفة البرنامج، وإتقان أدوات التدريب، وإدارة الجلسات والمجموعات.",
      descriptionEn: "An advanced qualification program to prepare certified trainers capable of delivering the Bikalima program for adults professionally.",
      trailerUrl: "https://www.youtube.com/watch?v=HAnw168huqA",
      seoTitle: "المدرب المعتمد — برنامج بكلمة لتدريب المدربين ToT",
      seoDescription: "برنامج تأهيل مدربي الخطابة المعتمدين — ٤٠ ساعة تدريب احترافي مع صهيب الخوالدة",
      price: 110,
      hours: 40,
      sessions: 20,
      whatYouLearnAr: ["منهجية التدريب الاحترافي", "تصميم الجلسة التدريبية", "إدارة المجموعات والتفاعل", "الاعتماد الرسمي من بكلمة", "بناء المسار التدريبي", "التطبيق والانطلاق للسوق"],
      whatYouLearnEn: ["Professional training methodology", "Training session design", "Group management and facilitation", "Official Bikalima certification", "Building a training career track", "Implementation and market launch"],
      requirementsAr: ["يشترط إتمام دورة المتحدث المؤثر بنجاح", "شغف حقيقي بمجال التدريب والتأهيل"],
      requirementsEn: ["Completion of The Influential Speaker course is required", "Genuine passion for training and development"],
      targetAudienceAr: ["المدربون والميسّرون الراغبون في الاعتماد", "المختصون في مجال التطوير البشري", "خريجو دورة المتحدث المؤثر الراغبون في التدريس"],
      targetAudienceEn: ["Trainers and facilitators seeking certification", "Human development specialists", "Influential Speaker graduates seeking to teach"],
      sections: [
        { titleAr: "الوحدة الأولى: من متحدث إلى مدرب", titleEn: "Unit 1: From Speaker to Trainer", lessons: [
          { titleAr: "من متحدث إلى مدرب", titleEn: "From Speaker to Trainer", duration: 120, isFreePreview: true },
          { titleAr: "فلسفة برنامج بكلمة وأثره", titleEn: "Bikalima Program Philosophy and Impact", duration: 120 },
        ]},
        { titleAr: "الوحدة الثانية: شخصية المدرب", titleEn: "Unit 2: The Trainer's Identity", lessons: [
          { titleAr: "شخصية المدرب وهويته المهنية", titleEn: "The Trainer's Personality and Professional Identity", duration: 120 },
          { titleAr: "تصميم الجلسة التدريبية", titleEn: "Training Session Design", duration: 120 },
        ]},
        { titleAr: "الوحدة الثالثة: إدارة التدريب", titleEn: "Unit 3: Training Management", lessons: [
          { titleAr: "إدارة المجموعات والتفاعل", titleEn: "Group Management and Facilitation", duration: 120 },
          { titleAr: "بناء الأنشطة والتطبيقات", titleEn: "Building Activities and Applications", duration: 120 },
        ]},
        { titleAr: "الوحدة الرابعة: التطبيق والاعتماد", titleEn: "Unit 4: Application and Certification", lessons: [
          { titleAr: "تقديم جلسات تجريبية", titleEn: "Delivering Trial Sessions", duration: 120 },
          { titleAr: "التغذية الراجعة والتقييم المهني", titleEn: "Feedback and Professional Assessment", duration: 120 },
          { titleAr: "معايير المدرب المعتمد", titleEn: "Standards of the Certified Trainer", duration: 120 },
          { titleAr: "خطة الانطلاق في السوق", titleEn: "Market Launch Plan", duration: 120 },
        ]},
      ],
    },
    {
      programId: "teachers",
      slug: "educators-program",
      titleAr: "تأهيل المعلمين لتعليم الأطفال",
      titleEn: "Educators & Parents Program",
      titleFr: "Programme Enseignants & Parents",
      subtitleAr: "برنامج المعلمين وأولياء الأمور — بيئة الطفل هي مستقبله",
      subtitleEn: "Educators & Parents Program — A child's environment is their future",
      descriptionAr: "برنامج تأهيلي مخصص للمعلمين وأولياء الأمور، يعرّفهم بمنهجية تدريب الأطفال على الخطابة والتواصل وقوة التأثير، ويمكنهم من تطبيق البرنامج داخل الصف أو المنزل.",
      descriptionEn: "A qualification program for educators and parents, introducing them to the methodology of training children in public speaking, communication, and influence.",
      trailerUrl: "https://www.youtube.com/watch?v=iG9CE55wbtY",
      seoTitle: "تأهيل المعلمين وأولياء الأمور — برنامج بكلمة لتدريب الأطفال",
      seoDescription: "برنامج متخصص يؤهل المعلمين وأولياء الأمور لتدريب الأطفال على الخطابة والتواصل — ٢١ ساعة تدريب",
      price: 90,
      hours: 21,
      sessions: 11,
      whatYouLearnAr: ["منهجية تدريب الأطفال على الخطابة", "أدوات تربوية مناسبة للعمر", "دمج البرنامج في البيت والصف", "تعزيز المشاركة وتجاوز الخجل", "التقييم والمتابعة وتطوير الأداء", "بناء جيل واثق ومعبّر"],
      whatYouLearnEn: ["Children's public speaking training methodology", "Age-appropriate educational tools", "Integrating the program at home and in the classroom", "Encouraging participation and overcoming shyness", "Assessment, follow-up, and performance development", "Building a confident and expressive generation"],
      requirementsAr: ["يُستحسن إتمام دورة المتحدث المؤثر مسبقاً (غير إلزامي)", "رغبة حقيقية في تطوير قدرات الأطفال"],
      requirementsEn: ["Completing The Influential Speaker course is recommended (not required)", "Genuine desire to develop children's capabilities"],
      targetAudienceAr: ["المعلمون في جميع المراحل الدراسية", "أولياء الأمور الراغبون في دعم أطفالهم", "المربّون والمدربون الشبابيون"],
      targetAudienceEn: ["Educators at all school levels", "Parents seeking to support their children", "Youth mentors and coaches"],
      sections: [
        { titleAr: "الوحدة الأولى: لماذا نعلّم الأطفال الخطابة؟", titleEn: "Unit 1: Why Teach Children Public Speaking?", lessons: [
          { titleAr: "لماذا نعلّم الأطفال الخطابة؟", titleEn: "Why Teach Children Public Speaking?", duration: 110, isFreePreview: true },
          { titleAr: "الكلمة كأداة بناء شخصية", titleEn: "The Word as a Tool for Character Building", duration: 110 },
        ]},
        { titleAr: "الوحدة الثانية: علم نفس الطفل والتعليم", titleEn: "Unit 2: Child Psychology and Education", lessons: [
          { titleAr: "كيف يختلف التدريب حسب العمر؟", titleEn: "How Does Training Differ by Age?", duration: 110 },
          { titleAr: "الفروق الفردية في التعبير", titleEn: "Individual Differences in Expression", duration: 110 },
          { titleAr: "الحاجات النفسية في كل مرحلة", titleEn: "Psychological Needs at Each Stage", duration: 110 },
        ]},
        { titleAr: "الوحدة الثالثة: التطبيق العملي", titleEn: "Unit 3: Practical Application", lessons: [
          { titleAr: "كيف أقدّم الجلسة للأطفال؟", titleEn: "How to Deliver a Session to Children", duration: 110 },
          { titleAr: "إدارة التفاعل والأنشطة", titleEn: "Managing Interaction and Activities", duration: 110 },
          { titleAr: "تعزيز المشاركة وتجاوز الخجل", titleEn: "Encouraging Participation and Overcoming Shyness", duration: 110 },
          { titleAr: "تطبيق البرنامج في الصف أو البيت", titleEn: "Applying the Program in Class or at Home", duration: 110 },
          { titleAr: "نماذج تدريب عملية", titleEn: "Practical Training Models", duration: 110 },
          { titleAr: "التقييم والمتابعة", titleEn: "Assessment and Follow-up", duration: 110 },
        ]},
      ],
    },
    {
      programId: "children",
      slug: "young-speaker",
      titleAr: "المتحدث الصغير",
      titleEn: "The Young Speaker",
      titleFr: "Le Jeune Orateur",
      subtitleAr: "برنامج الأطفال — صوتك يستحق أن يُسمع",
      subtitleEn: "Children's Program — Your voice deserves to be heard",
      descriptionAr: "برنامج تدريبي تفاعلي للأطفال لبناء الثقة، وتنمية مهارات التعبير، وتعليمهم كيف يتحدثون بوضوح وراحة وتأثير أمام الآخرين. يُقدَّم للمدارس عبر خريجي برنامج المعلمين وأولياء الأمور المعتمدين.",
      descriptionEn: "An interactive training program for children to build confidence, develop expression skills, and teach them how to speak clearly, comfortably, and impactfully in front of others.",
      trailerUrl: "https://www.youtube.com/watch?v=R1vskiVDwl4",
      seoTitle: "المتحدث الصغير — برنامج بكلمة للأطفال",
      seoDescription: "برنامج تدريبي للأطفال لبناء الثقة وتطوير مهارات الخطابة والتعبير — للمدارس فقط",
      price: 50,
      hours: 18,
      sessions: 9,
      whatYouLearnAr: ["بناء الثقة بالنفس", "أساسيات الخطابة للأطفال", "استخدام الصوت ولغة الجسد", "ترتيب الأفكار وإيصالها", "التأثير والإقناع المناسب للعمر", "الحضور الواثق أمام الجمهور"],
      whatYouLearnEn: ["Building self-confidence", "Public speaking fundamentals for children", "Using voice and body language", "Organizing and communicating ideas", "Age-appropriate influence and persuasion", "Confident presence in front of an audience"],
      requirementsAr: ["يُقدَّم بواسطة خريجي برنامج المعلمين وأولياء الأمور المعتمدين", "يُقدَّم للمدارس حصراً"],
      requirementsEn: ["Delivered by certified Educators & Parents program graduates", "Delivered exclusively to schools"],
      targetAudienceAr: ["الأطفال من سن ٥ إلى ١٦ سنة", "طلاب المدارس الابتدائية والمتوسطة", "الأطفال الخجولون أو من يعانون من صعوبات التعبير"],
      targetAudienceEn: ["Children aged 5 to 16 years", "Elementary and middle school students", "Shy children or those with expression difficulties"],
      sections: [
        { titleAr: "الوحدة الأولى: أنا أتكلم بثقة", titleEn: "Unit 1: I Speak with Confidence", lessons: [
          { titleAr: "أتكلم بثقة", titleEn: "I Speak with Confidence", duration: 90, isFreePreview: true },
          { titleAr: "كيف أعبّر عن نفسي دون خوف", titleEn: "How to Express Myself Without Fear", duration: 90 },
          { titleAr: "ما معنى أن أتحدث أمام الآخرين؟", titleEn: "What Does It Mean to Speak in Front of Others?", duration: 90 },
        ]},
        { titleAr: "الوحدة الثانية: كيف أبني حديثي؟", titleEn: "Unit 2: How Do I Build My Speech?", lessons: [
          { titleAr: "كيف أبدأ حديثي بشكل جميل؟", titleEn: "How to Start Speaking Beautifully", duration: 90 },
          { titleAr: "ترتيب أفكاري قبل الكلام", titleEn: "Organizing My Thoughts Before Speaking", duration: 90 },
          { titleAr: "نبرة الصوت ولغة الجسد", titleEn: "Voice Tone and Body Language", duration: 90 },
        ]},
        { titleAr: "الوحدة الثالثة: عرضي الأول", titleEn: "Unit 3: My First Presentation", lessons: [
          { titleAr: "كيف أوصل فكرتي بوضوح؟", titleEn: "How to Communicate My Ideas Clearly", duration: 90 },
          { titleAr: "كيف أترك أثرًا جميلًا في كلامي؟", titleEn: "How to Leave a Beautiful Impression", duration: 90 },
          { titleAr: "عرضي الأول أمام المجموعة", titleEn: "My First Presentation in Front of the Group", duration: 90 },
        ]},
      ],
    },
  ];

  for (const prog of programs) {
    console.log(`\n▶ Seeding: ${prog.titleAr}`);

    const courseRes = await client.query(`
      INSERT INTO courses (
        program_id, slug, title_ar, title_en, title_fr,
        subtitle_ar, subtitle_en, description_ar, description_en,
        trailer_url, seo_title, seo_description,
        price, hours, sessions,
        what_you_learn_ar, what_you_learn_en,
        requirements_ar, requirements_en,
        target_audience_ar, target_audience_en,
        instructor_id, category_id, is_published, is_featured,
        language, level
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
        TRUE,TRUE,'ar','all'
      )
      ON CONFLICT (slug) DO UPDATE SET
        subtitle_ar=$6, subtitle_en=$7,
        trailer_url=$10, seo_title=$11, seo_description=$12,
        price=$13, hours=$14, sessions=$15,
        what_you_learn_ar=$16, what_you_learn_en=$17,
        requirements_ar=$18, requirements_en=$19,
        target_audience_ar=$20, target_audience_en=$21,
        instructor_id=$22, category_id=$22,
        is_published=TRUE, is_featured=TRUE, updated_at=NOW()
      RETURNING id
    `, [
      prog.programId, prog.slug, prog.titleAr, prog.titleEn, prog.titleFr,
      prog.subtitleAr, prog.subtitleEn, prog.descriptionAr, prog.descriptionEn,
      prog.trailerUrl || null, prog.seoTitle || null, prog.seoDescription || null,
      prog.price, prog.hours, prog.sessions,
      JSON.stringify(prog.whatYouLearnAr), JSON.stringify(prog.whatYouLearnEn),
      JSON.stringify(prog.requirementsAr), JSON.stringify(prog.requirementsEn),
      JSON.stringify(prog.targetAudienceAr), JSON.stringify(prog.targetAudienceEn),
      instructorId, categoryId,
    ]);

    const courseId = courseRes.rows[0].id;
    console.log(`  Course ID: ${courseId}`);

    for (let si = 0; si < prog.sections.length; si++) {
      const sec = prog.sections[si];
      const secRes = await client.query(`
        INSERT INTO course_sections (course_id, title_ar, title_en, sort_order)
        VALUES ($1,$2,$3,$4)
        RETURNING id
      `, [courseId, sec.titleAr, sec.titleEn, si]);

      const sectionId = secRes.rows[0].id;

      for (let li = 0; li < sec.lessons.length; li++) {
        const lesson = sec.lessons[li];
        await client.query(`
          INSERT INTO lessons (course_id, section_id, title_ar, title_en, title_fr,
            duration_minutes, sort_order, is_free_preview, is_published)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
        `, [
          courseId, sectionId,
          lesson.titleAr, lesson.titleEn, lesson.titleEn,
          lesson.duration || 90, li,
          lesson.isFreePreview || false,
        ]);
      }

      console.log(`  Section ${si + 1}: ${sec.lessons.length} lessons`);
    }
  }

  console.log("\n✅ LMS seed complete!");
}

try {
  await seed();
} catch (err) {
  console.error("❌ Seed failed:", err.message);
} finally {
  await client.end();
}
