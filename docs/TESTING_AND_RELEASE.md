# الاختبار والإطلاق

## طبقات الاختبار

- Unit: سياسات الصلاحية، أهلية الشهادة، حساب الدرجات والأسعار، State Machines.
- Integration: API + DB + Transactions + Webhooks + idempotency.
- Permission: اختبارات سماح ومنع لكل Resource/Action/Scope.
- E2E: زائر، طالب، مدرب، مراجع ومدير.
- Accessibility: Axe + لوحة مفاتيح + Focus + 200% zoom + Reduced Motion.
- Visual/Responsive: لقطات ثابتة وقياسات JSON.

## مصفوفة الشاشات

PR smoke: 390، 768، 1440 للمسارات الحرجة. قبل الإطلاق: 320، 360، 375، 390، 430، 768، 1024، 1440 لكل المسارات الرئيسية.

لكل حجم نتحقق من:

- Overflow أفقي ≤1px.
- H1 واحد وتسلسل عناوين صحيح.
- CTA الأساسي ضمن ميزانية الوصول.
- Touch targets ≥44px على الهاتف.
- عدم تقاطع fixed/sticky مع المحتوى أو لوحة المفاتيح.
- RTL/LTR والنصوص الطويلة.
- Loading/Empty/Error/Success.
- Dialog focus trap وإغلاق Escape.

## حراس البيئة

- لا يزرع E2E بياناته إلا مع `E2E_ALLOW_DB_SEED=true` صراحة.
- يجب أن يحتوي اسم قاعدة PostgreSQL نفسها على `e2e` أو `test` كجزء مستقل.
- لا تزرع حسابات اختبار في Staging/Production.

## بوابة الإصدار

1. `pnpm install --frozen-lockfile`.
2. `pnpm typecheck`.
3. `pnpm build`.
4. Unit/Integration/Permission/E2E/Accessibility.
5. فحص migrations ونسخة احتياطية وخطة تراجع.
6. Staging ثم اختبار بشري لطالب ومدرب ومدير.
7. لا إطلاق مع P0 أو P1 مفتوح.

## الوضع الحالي

الأنواع والبناء ناجحان. E2E المحلي محجوب عمداً حالياً لعدم توفر `DATABASE_URL`، بينما CI يوفّر PostgreSQL باسم `bikalima_e2e` والحارس الصريح. أضيف `responsive-density.spec.ts` للمقاسات الثمانية والمسارات الحرجة و`security-boundaries.spec.ts` لمنع المسودات وتسريب إجابات الاختبار والثقة بدرجة العميل. لقطات قبل/بعد محفوظة في `docs/audit-assets/`؛ المقارنة البصرية الموثوقة للإطار الأول هي `before-home-390.png` و`after-home-390-viewport.jpg`.
