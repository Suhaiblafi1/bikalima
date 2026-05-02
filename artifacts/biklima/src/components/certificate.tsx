import { forwardRef } from "react";

export interface CertificateProps {
  studentName: string;
  courseTitle: string;
  completedAt: string | null;
  lang: "ar" | "en";
}

const T = {
  ar: {
    headline: "شهادة إتمام",
    awarded: "تُمنح هذه الشهادة لـ",
    forCompleting: "تقديراً لإتمام دورة",
    issuedOn: "تاريخ الإصدار",
    org: "بكلمة — البرنامج التحويلي",
    signature: "إدارة بكلمة",
  },
  en: {
    headline: "Certificate of Completion",
    awarded: "This is awarded to",
    forCompleting: "for successfully completing the course",
    issuedOn: "Issued on",
    org: "Bikalima — Transformational Program",
    signature: "Bikalima Team",
  },
};

function formatDate(iso: string | null, lang: "ar" | "en"): string {
  const date = iso ? new Date(iso) : new Date();
  try {
    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  function Certificate({ studentName, courseTitle, completedAt, lang }, ref) {
    const t = T[lang];
    const isRtl = lang === "ar";
    const dateStr = formatDate(completedAt, lang);

    return (
      <div
        ref={ref}
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          width: "1100px",
          height: "780px",
          background: "linear-gradient(135deg, #fffaf3 0%, #f4ecdf 100%)",
          padding: "60px",
          fontFamily: isRtl
            ? "'Tajawal', 'Cairo', 'Amiri', 'Segoe UI', sans-serif"
            : "'Georgia', 'Times New Roman', serif",
          color: "#2b2b2b",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Outer border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "4px double #b38540",
            borderRadius: "12px",
            pointerEvents: "none",
          }}
        />
        {/* Inner content */}
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
            padding: "40px 60px",
          }}
        >
          {/* Header */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: "44px",
                fontWeight: 700,
                color: "#b38540",
                letterSpacing: isRtl ? "0" : "2px",
                marginBottom: "8px",
              }}
            >
              بكلمة
            </div>
            <div
              style={{
                fontSize: "14px",
                letterSpacing: isRtl ? "0" : "4px",
                color: "#7a6a52",
                textTransform: "uppercase",
              }}
            >
              {t.org}
            </div>
          </div>

          {/* Center */}
          <div style={{ width: "100%" }}>
            <h1
              style={{
                fontSize: "52px",
                margin: 0,
                fontWeight: 700,
                color: "#3d2c12",
                letterSpacing: isRtl ? "0" : "2px",
              }}
            >
              {t.headline}
            </h1>
            <div
              style={{
                width: "120px",
                height: "3px",
                background: "#b38540",
                margin: "20px auto 28px",
              }}
            />
            <p
              style={{
                fontSize: "20px",
                color: "#5a4a30",
                margin: "0 0 16px",
              }}
            >
              {t.awarded}
            </p>
            <h2
              style={{
                fontSize: "44px",
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "0 0 24px",
                fontStyle: isRtl ? "normal" : "italic",
                borderBottom: "1px solid #d4b88a",
                display: "inline-block",
                paddingBottom: "10px",
                minWidth: "60%",
              }}
            >
              {studentName}
            </h2>
            <p
              style={{
                fontSize: "18px",
                color: "#5a4a30",
                margin: "0 0 12px",
              }}
            >
              {t.forCompleting}
            </p>
            <h3
              style={{
                fontSize: "30px",
                fontWeight: 600,
                color: "#3d2c12",
                margin: "0",
                lineHeight: 1.3,
              }}
            >
              {courseTitle}
            </h3>
          </div>

          {/* Footer */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "30px",
              fontSize: "14px",
              color: "#5a4a30",
            }}
          >
            <div style={{ textAlign: "start", minWidth: "180px" }}>
              <div
                style={{
                  borderTop: "1px solid #b38540",
                  paddingTop: "8px",
                  fontSize: "13px",
                }}
              >
                {t.issuedOn}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px" }}>
                {dateStr}
              </div>
            </div>
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "3px solid #b38540",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
                color: "#b38540",
                background: "#fffaf3",
              }}
            >
              ✓
            </div>
            <div style={{ textAlign: "end", minWidth: "180px" }}>
              <div
                style={{
                  borderTop: "1px solid #b38540",
                  paddingTop: "8px",
                  fontSize: "13px",
                }}
              >
                {t.signature}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginTop: "4px",
                  color: "#b38540",
                }}
              >
                بكلمة
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
