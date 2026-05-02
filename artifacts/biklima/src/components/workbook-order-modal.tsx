import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, FileText, Download, Printer, Package, Minus, Plus, X,
  AlertCircle, Info, CheckCircle2, Clock, CreditCard, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { T } from "../translations";
import { useLang } from "../hooks/useLang";
import { type getLocalizedProgram, WORKBOOK_PRICES } from "../programsData";
import { useCurrency } from "@/lib/site-config";

type LocalizedProgram = ReturnType<typeof getLocalizedProgram>;

type OrderSuccess = {
  name: string;
  title: string;
  format: string;
  qty: number;
  total: string;
};

type Props = {
  workbook: LocalizedProgram;
  onClose: () => void;
};

export function WorkbookOrderModal({ workbook, onClose }: Props) {
  const { toast } = useToast();
  const { lang } = useLang();
  const t = T[lang];
  const { format: formatPrice, currency } = useCurrency();
  const [, navigate] = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [format, setFormat] = useState<"pdf" | "print">("pdf");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);

  const wb = workbook;
  const unitPrice = WORKBOOK_PRICES[wb.id as keyof typeof WORKBOOK_PRICES] ?? 0;
  const totalPrice = unitPrice * quantity;

  const handleClose = () => {
    setOrderSuccess(null);
    setQuantity(1);
    setFormat("pdf");
    setDeliveryAddress("");
    setCountry("");
    setNotes("");
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setSubmitting(false);
    onClose();
  };

  const handleBackToWorkbooks = () => {
    handleClose();
    const base = import.meta.env.BASE_URL || "/";
    const workbooksPath = base.replace(/\/$/, "") + "/workbooks";
    navigate(workbooksPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      const res = await fetch(`${apiBase}/workbook-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: wb.id,
          workbookTitle: wb.workbook.title,
          quantity,
          format,
          deliveryAddress: format === "print" ? deliveryAddress : "",
          buyerName,
          buyerPhone,
          buyerEmail,
          buyerCountry: country,
          notes,
          unitPrice,
          lang,
          currencyCode: currency.code,
          displayUnitPrice: formatPrice(unitPrice),
          displayTotal: formatPrice(totalPrice),
        }),
      });
      if (!res.ok) throw new Error("server_error");
      setOrderSuccess({
        name: buyerName,
        title: wb.workbook.title,
        format,
        qty: quantity,
        total: formatPrice(totalPrice),
      });
    } catch {
      toast({
        title: lang === "ar" ? "حدث خطأ" : "Something went wrong",
        description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatLabel = format === "pdf"
    ? (lang === "ar" ? "PDF رقمي" : "Digital PDF")
    : (lang === "ar" ? "مطبوعة" : "Printed");

  const wm = t.workbooks;

  // Inline labels with bilingual fallback so we don't break on missing keys
  const L = {
    pendingPaymentNotice: lang === "ar"
      ? "بعد إرسال الطلب سيتواصل معك فريق بكلمة لتأكيد طريقة الدفع وإرسال الكراسة. لن يتم خصم أي مبلغ الآن."
      : "After you submit, the Bikalima team will contact you to confirm the payment method and deliver your workbook. No payment is taken now.",
    countryLabel: lang === "ar" ? "الدولة" : "Country",
    countryPlaceholder: lang === "ar" ? "الأردن، السعودية، قطر..." : "Jordan, KSA, Qatar...",
    notesLabel: lang === "ar" ? "ملاحظات إضافية (اختياري)" : "Additional notes (optional)",
    notesPlaceholder: lang === "ar"
      ? "أي تفاصيل أو طلبات خاصة تساعدنا على خدمتك بشكل أفضل..."
      : "Any details or special requests that help us serve you better...",
    orderSummaryTitle: lang === "ar" ? "ملخص الطلب" : "Order Summary",
    workbookLabel: lang === "ar" ? "الكراسة" : "Workbook",
    unitPriceLabel: lang === "ar" ? "سعر النسخة" : "Unit price",
    qtyLabel: lang === "ar" ? "الكمية" : "Qty",
    submitRequest: lang === "ar" ? "إرسال الطلب" : "Send Request",
    submittingRequest: lang === "ar" ? "جاري الإرسال..." : "Sending...",
    nextStepsTitle: lang === "ar" ? "الخطوات التالية" : "What happens next",
    nextStep1: lang === "ar"
      ? "سنراجع طلبك ونتواصل معك خلال ٢٤ ساعة"
      : "We'll review your request and contact you within 24 hours",
    nextStep2: lang === "ar"
      ? "سنؤكد طريقة الدفع المناسبة لك"
      : "We'll confirm the payment method that works for you",
    nextStep3: lang === "ar"
      ? "نُرسل لك الكراسة فور تأكيد الدفع"
      : "We'll deliver the workbook once payment is confirmed",
    backToWorkbooks: lang === "ar" ? "العودة إلى الكراسات" : "Back to Workbooks",
    formatPdfShort: lang === "ar" ? "PDF رقمي" : "Digital PDF",
    formatPrintShort: lang === "ar" ? "مطبوعة" : "Printed",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border"
      >
        <button
          aria-label="Close"
          onClick={handleClose}
          className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero */}
        <div className="relative aspect-[21/6] overflow-hidden rounded-t-[2rem]">
          <img src={wb.image} alt={wb.workbook.title} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-br ${wb.accentColor} opacity-75 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              <FileText className="w-3.5 h-3.5" />{wb.role}
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">{wb.workbook.title}</h2>
            <p className="text-white/80 text-sm max-w-xl">{wb.workbook.description}</p>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {orderSuccess ? (
              <motion.div
                key="wb-success"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col items-center justify-center text-center py-6 gap-7"
              >
                {/* Animated success orb */}
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
                    className="relative w-32 h-32 flex items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
                      <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.2} />
                    </div>
                  </motion.div>
                  {["-top-3 -start-3", "-top-2 end-0", "bottom-0 -start-4", "-bottom-2 end-2"].map((pos, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 260 }}
                      className={`absolute ${pos} w-5 h-5 rounded-full bg-accent/70 flex items-center justify-center text-[10px]`}
                    >✨</motion.div>
                  ))}
                </div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                    {lang === "ar" ? `تم استلام طلبك يا ${orderSuccess.name} 🎉` : `Request received, ${orderSuccess.name} 🎉`}
                  </h3>
                  <p className="text-lg font-semibold text-primary">
                    {lang === "ar"
                      ? "سنتواصل معك قريباً لتأكيد طريقة الدفع وإرسال الكراسة."
                      : "We'll be in touch shortly to confirm payment and deliver your workbook."}
                  </p>
                </motion.div>

                {/* Order summary */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl px-7 py-5 text-sm w-full max-w-md"
                >
                  <p className="font-bold text-foreground mb-3 text-base flex items-center gap-2 justify-center">
                    <span>🧾</span>{L.orderSummaryTitle}
                  </p>
                  <div className="space-y-2 text-muted-foreground text-start">
                    <div className="flex justify-between gap-4">
                      <span>{L.workbookLabel}</span>
                      <span className="font-semibold text-foreground truncate max-w-[55%] text-end">{orderSuccess.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{wm.formatLabel}</span>
                      <span className="font-semibold text-foreground">
                        {orderSuccess.format === "pdf" ? L.formatPdfShort : L.formatPrintShort}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{L.qtyLabel}</span>
                      <span className="font-semibold text-foreground">{orderSuccess.qty}</span>
                    </div>
                    <div className="flex justify-between border-t border-primary/20 pt-2 mt-2">
                      <span className="font-bold text-primary">{wm.totalLabel}</span>
                      <span className="font-bold text-primary text-lg">{orderSuccess.total}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Next steps timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-secondary/30 border border-border rounded-2xl px-7 py-5 w-full max-w-md text-start"
                >
                  <p className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />{L.nextStepsTitle}
                  </p>
                  <ol className="space-y-3 text-sm">
                    {[
                      { icon: <Send className="w-4 h-4" />, text: L.nextStep1 },
                      { icon: <CreditCard className="w-4 h-4" />, text: L.nextStep2 },
                      { icon: <Package className="w-4 h-4" />, text: L.nextStep3 },
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          {step.icon}
                        </div>
                        <span className="text-muted-foreground leading-relaxed pt-1">{step.text}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
                >
                  <a
                    href={`https://wa.me/97455377065?text=${encodeURIComponent(
                      lang === "ar"
                        ? `السلام عليكم، أنا ${orderSuccess.name} وأودّ الاستفسار عن طلب كراسة بكلمة.`
                        : `Hello, I'm ${orderSuccess.name} and I'd like to ask about my Bikalima workbook order.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold px-7 py-3 rounded-full text-sm transition-colors shadow-lg"
                  >
                    <span>💬</span>{lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                  </a>
                  <button
                    onClick={handleBackToWorkbooks}
                    className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full px-7 py-3 text-sm font-bold transition-colors"
                  >
                    {L.backToWorkbooks}
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="wb-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {/* Pending-payment notice banner */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 md:p-5 mb-6 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                    {L.pendingPaymentNotice}
                  </p>
                </div>

                {/* Sample PDF download */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/20 rounded-2xl border border-border p-6 md:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${wb.accentColor} text-white flex items-center justify-center shadow-lg shrink-0`}>
                    <Download className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-center sm:text-start">
                    <h3 className="font-bold text-lg mb-1">{wm.samplePdfBtn}</h3>
                    <p className="text-sm text-muted-foreground">{wm.samplePdfNote}</p>
                  </div>
                  <Button
                    className={`rounded-full px-8 text-white shadow-md ${wb.samplePdf ? `bg-gradient-to-r ${wb.accentColor} hover:opacity-90` : "bg-muted-foreground/40 cursor-not-allowed"}`}
                    disabled={!wb.samplePdf}
                    onClick={() => { if (wb.samplePdf) window.open(wb.samplePdf, "_blank", "noopener,noreferrer"); }}
                  >
                    <Download className="w-4 h-4 me-2" />
                    {wb.samplePdf ? wm.samplePdfBtn : (lang === "ar" ? "قريباً" : "Coming Soon")}
                  </Button>
                </div>

                {/* Order summary card (visible BEFORE submitting) */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 md:p-6 mb-6">
                  <p className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span>🧾</span>{L.orderSummaryTitle}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{L.workbookLabel}</div>
                      <div className="font-semibold text-foreground truncate">{wb.workbook.title}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{wm.formatLabel}</div>
                      <div className="font-semibold text-foreground">{formatLabel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{L.unitPriceLabel}</div>
                      <div className="font-semibold text-foreground">{formatPrice(unitPrice)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{L.qtyLabel}</div>
                      <div className="font-semibold text-foreground">{quantity}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary/20 pt-3 mt-4">
                    <span className="text-sm font-bold text-primary">{wm.totalLabel}</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Order form */}
                <div className="bg-secondary/20 rounded-2xl border border-border p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />{wm.orderTitle}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{wm.nameLabel}</label>
                        <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder={wm.namePlaceholder} required className="rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{wm.phoneLabel}</label>
                        <Input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+962..." required className="rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{wm.emailLabel}</label>
                        <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="email@example.com" required className="rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{L.countryLabel}</label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={L.countryPlaceholder} required className="rounded-xl" />
                      </div>
                    </div>

                    {/* Format + Quantity */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-3">{wm.formatLabel}</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFormat("pdf")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${format === "pdf" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                          >
                            <FileText className="w-6 h-6" />
                            <span className="text-sm font-medium">{wm.formatPdf}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormat("print")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${format === "print" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                          >
                            <Printer className="w-6 h-6" />
                            <span className="text-sm font-medium">{wm.formatPrint}</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-3">{wm.quantityLabel}</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delivery address (print only) */}
                    {format === "print" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />{wm.deliveryLabel}
                        </label>
                        <Textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder={wm.deliveryPlaceholder}
                          required
                          className="rounded-xl"
                          rows={2}
                        />
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{wm.deliveryNote}
                        </p>
                      </motion.div>
                    )}

                    {/* Notes (optional) */}
                    <div>
                      <label className="block text-sm font-medium mb-2">{L.notesLabel}</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={L.notesPlaceholder}
                        className="rounded-xl"
                        rows={3}
                      />
                    </div>

                    {/* Submit row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                      <div className="text-center sm:text-start">
                        <div className="text-sm text-muted-foreground">{wm.totalLabel}</div>
                        <div className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</div>
                        {format === "print" && (
                          <p className="text-xs text-muted-foreground mt-1">+ {wm.deliveryNote.split("—")[0]}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitting}
                        className="rounded-full h-14 px-10 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90 gap-2"
                      >
                        <Send className="w-5 h-5" />
                        {submitting ? L.submittingRequest : L.submitRequest}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
