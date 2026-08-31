import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Lock, NotebookPen, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/states";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api-fetch";

type PageSummary = {
  id: string;
  pageNumber: number;
  sectionAr: string | null;
  sectionEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
  isPublished: boolean;
};

type WorkbookPage = PageSummary & {
  bodyAr: string;
  bodyEn: string | null;
  exerciseAr: string | null;
  exerciseEn: string | null;
};

type Note = {
  id: string;
  pageId: string;
  quote: string | null;
  content: string;
  createdAt: string;
};

type TocResponse = {
  workbook: { id: string; slug: string; titleAr: string; titleEn: string | null };
  pages: PageSummary[];
  totalPages: number;
};

const copy = {
  ar: {
    back: "رجوع",
    notOwned: "لا تملك هذه الكرّاسة بعد",
    notOwnedBody: "تظهر الكرّاسة هنا فور تأكيد طلبك. يمكنك طلبها من صفحة الكرّاسات.",
    browse: "تصفّح الكرّاسات",
    empty: "لم تُضَف صفحات لهذه الكرّاسة بعد",
    emptyBody: "سيضيفها فريق بكلمة قريباً.",
    pageOf: (n: number, total: number) => `صفحة ${n} من ${total}`,
    exercise: "تمرين الصفحة",
    yourNote: "ملاحظاتك على هذه الصفحة",
    placeholder: "اكتب ملاحظتك على هذه الصفحة…",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    private: "خاصة بك — لا يراها المدرب",
    quoted: "على المقطع المحدَّد",
    clearQuote: "إلغاء التحديد",
    selectHint: "حدّد نصاً من الصفحة لتربط ملاحظتك به.",
    prev: "السابق",
    next: "التالي",
    delete: "حذف",
    noNotes: "لا ملاحظات على هذه الصفحة بعد.",
    draft: "مسودة",
  },
  en: {
    back: "Back",
    notOwned: "You don't own this workbook yet",
    notOwnedBody: "It appears here once your order is confirmed. You can order it from the workbooks page.",
    browse: "Browse workbooks",
    empty: "No pages have been added yet",
    emptyBody: "The Bikalima team will add them soon.",
    pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
    exercise: "Page exercise",
    yourNote: "Your notes on this page",
    placeholder: "Write your note on this page…",
    save: "Save",
    saving: "Saving…",
    private: "Private to you — your trainer can't see it",
    quoted: "On the selected passage",
    clearQuote: "Clear selection",
    selectHint: "Select text on the page to anchor your note to it.",
    prev: "Previous",
    next: "Next",
    delete: "Delete",
    noNotes: "No notes on this page yet.",
    draft: "Draft",
  },
} as const;

export default function WorkbookReaderPage() {
  const [, params] = useRoute("/workbooks/:slug/read");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { lang, dir } = useLang();
  const isRtl = lang === "ar";
  const t = copy[lang];
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [draft, setDraft] = useState("");
  const [quote, setQuote] = useState("");

  const toc = useQuery<TocResponse | { forbidden: true }>({
    queryKey: ["workbook-toc", slug],
    enabled: !!slug,
    queryFn: async () => {
      const res = await apiFetch(`/workbooks/${encodeURIComponent(slug)}/pages`);
      if (res.status === 403) return { forbidden: true } as const;
      if (!res.ok) throw new Error("toc");
      return (await res.json()) as TocResponse;
    },
  });

  const forbidden = !!toc.data && "forbidden" in toc.data;
  const tocData = forbidden ? null : (toc.data as TocResponse | undefined) ?? null;
  const totalPages = tocData?.totalPages ?? 0;
  const firstPageNumber = tocData?.pages[0]?.pageNumber ?? 1;

  // Land on the first authored page rather than assuming it is numbered 1.
  useEffect(() => {
    if (tocData && tocData.pages.length > 0) setPageNumber((n) => (n === 1 ? firstPageNumber : n));
  }, [tocData, firstPageNumber]);

  const page = useQuery<{ page: WorkbookPage; notes: Note[] }>({
    queryKey: ["workbook-page", slug, pageNumber],
    enabled: !!slug && !!tocData && tocData.pages.length > 0,
    queryFn: async () => {
      const res = await apiFetch(`/workbooks/${encodeURIComponent(slug)}/pages/${pageNumber}`);
      if (!res.ok) throw new Error("page");
      return res.json();
    },
  });

  const invalidatePage = () =>
    queryClient.invalidateQueries({ queryKey: ["workbook-page", slug, pageNumber] });

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/workbook-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.data!.page.id,
          quote: quote || undefined,
          content: draft.trim(),
        }),
      });
      if (!res.ok) throw new Error("save");
      return res.json();
    },
    onSuccess: async () => {
      setDraft("");
      setQuote("");
      await invalidatePage();
    },
  });

  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/workbook-notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
    },
    onSuccess: invalidatePage,
  });

  const pageNumbers = useMemo(() => tocData?.pages.map((p) => p.pageNumber) ?? [], [tocData]);
  const index = pageNumbers.indexOf(pageNumber);
  const prevNumber = index > 0 ? pageNumbers[index - 1] : null;
  const nextNumber = index >= 0 && index < pageNumbers.length - 1 ? pageNumbers[index + 1] : null;

  // Capture the reader's text selection so a note can quote it.
  function captureSelection() {
    const text = window.getSelection?.()?.toString().trim() ?? "";
    if (text) setQuote(text.slice(0, 2000));
  }

  const body = page.data?.page;
  const prose = (lang === "en" && body?.bodyEn ? body.bodyEn : body?.bodyAr ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const exercise = lang === "en" && body?.exerciseEn ? body.exerciseEn : body?.exerciseAr;
  const section = lang === "en" && body?.sectionEn ? body.sectionEn : body?.sectionAr;
  const title = lang === "en" && body?.titleEn ? body.titleEn : body?.titleAr;

  return (
    <AppShell
      containerClassName="container mx-auto px-4 py-6 max-w-3xl"
      breadcrumb={[
        { label: isRtl ? "الكرّاسات" : "Workbooks", href: "/workbooks" },
        { label: tocData?.workbook.titleAr ?? (isRtl ? "قراءة" : "Read") },
      ]}
    >
      <div dir={dir} className="space-y-5" data-testid="workbook-reader">
        <button
          type="button"
          onClick={() => navigate("/dashboard?tab=workbooks")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className={`h-4 w-4 ${isRtl ? "" : "rotate-180"}`} />
          {t.back}
        </button>

        {toc.isLoading ? (
          <LoadingState />
        ) : forbidden ? (
          <Card data-testid="workbook-locked">
            <CardContent className="p-8 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold">{t.notOwned}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.notOwnedBody}</p>
              <Button className="rounded-full font-bold" onClick={() => navigate("/workbooks")}>
                {t.browse}
              </Button>
            </CardContent>
          </Card>
        ) : totalPages === 0 ? (
          <Card data-testid="workbook-empty">
            <CardContent className="p-8 space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold">{t.empty}</h1>
              <p className="text-sm text-muted-foreground">{t.emptyBody}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-bold">{tocData?.workbook.titleAr}</h1>
              <span className="text-xs font-bold text-muted-foreground">
                {t.pageOf(pageNumber, totalPages)}
              </span>
            </div>

            {page.isLoading || !body ? (
              <LoadingState />
            ) : (
              <>
                <Card>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {section && (
                      <p className="text-xs font-bold text-primary">{section}</p>
                    )}
                    {title && (
                      <h2 className="font-serif text-xl font-bold leading-relaxed">{title}</h2>
                    )}
                    {!body.isPublished && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        {t.draft}
                      </span>
                    )}
                    <div
                      className="space-y-4 font-serif text-[15px] leading-loose"
                      onMouseUp={captureSelection}
                      onTouchEnd={captureSelection}
                      data-testid="workbook-page-body"
                    >
                      {prose.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                    {exercise && (
                      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-1.5">
                        <p className="text-xs font-bold text-primary">{t.exercise}</p>
                        <p className="font-serif text-[14px] leading-loose">{exercise}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1 rounded-xl font-bold"
                    disabled={prevNumber === null}
                    onClick={() => prevNumber !== null && setPageNumber(prevNumber)}
                    data-testid="workbook-prev"
                  >
                    {t.prev}
                  </Button>
                  <Button
                    className="min-h-11 flex-1 rounded-xl font-bold"
                    disabled={nextNumber === null}
                    onClick={() => nextNumber !== null && setPageNumber(nextNumber)}
                    data-testid="workbook-next"
                  >
                    {t.next}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">{t.yourNote}</h3>
                    </div>

                    {quote ? (
                      <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 space-y-1.5">
                        <p className="text-[11px] font-bold text-muted-foreground">{t.quoted}</p>
                        <p className="text-xs leading-relaxed line-clamp-3">{quote}</p>
                        <button
                          type="button"
                          onClick={() => setQuote("")}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                        >
                          {t.clearQuote}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">{t.selectHint}</p>
                    )}

                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t.placeholder}
                      rows={3}
                      maxLength={4000}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      data-testid="workbook-note-input"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {t.private}
                      </span>
                      <Button
                        className="min-h-10 rounded-full font-bold"
                        disabled={!draft.trim() || addNote.isPending}
                        onClick={() => addNote.mutate()}
                        data-testid="workbook-note-save"
                      >
                        {addNote.isPending ? t.saving : t.save}
                      </Button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {(page.data?.notes ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t.noNotes}</p>
                      ) : (
                        (page.data?.notes ?? []).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-xl border border-border bg-card p-3 space-y-1.5"
                            data-testid="workbook-note"
                          >
                            {note.quote && (
                              <p className="border-s-2 border-accent/60 ps-2 text-[11px] leading-relaxed text-muted-foreground">
                                {note.quote}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed">{note.content}</p>
                            <button
                              type="button"
                              onClick={() => removeNote.mutate(note.id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t.delete}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
