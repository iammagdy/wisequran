

## المشكلة

من الـ network logs: التحميل من `download.quranicaudio.com` يُرجع status 200 (ناجح!) لكن الطلب الأول يظهر **"The user aborted a request"** — وهذا بسبب الـ timeout المضاف (30 ثانية) الذي يقطع الاتصال قبل اكتمال التحميل. سورة آل عمران ملف كبير (~50MB) يحتاج أكثر من 30 ثانية.

**المشكلة الثانية**: عندما يكون `Content-Length` = 0 (بعض السيرفرات لا تُرجعه)، لا يظهر أي تقدم في النسبة المئوية.

## الحل

### تعديل `src/lib/quran-audio.ts`

1. **زيادة الـ timeout من 30 ثانية إلى 5 دقائق** (300 ثانية) — ملفات القرآن الكبيرة تحتاج وقتاً أطول
2. **إلغاء الـ timeout أثناء التحميل النشط**: بدل timeout ثابت، نُعيد ضبط المؤقت مع كل chunk يُستقبل (activity-based timeout). إذا لم يصل أي بيانات خلال 30 ثانية → abort. لكن طالما البيانات تتدفق → لا يُقطع.
3. **إظهار تقدم تقريبي عند عدم وجود Content-Length**: عرض حجم البيانات المستلمة بدل النسبة المئوية (مثلاً "2.5 MB") عبر استدعاء `onProgress` بقيم سالبة أو بنمط مختلف.

### التغيير الرئيسي في `fetchAudioFromUrl`:

```typescript
// بدل timeout ثابت 30 ثانية:
const controller = new AbortController();
let timeout = setTimeout(() => controller.abort(), 60_000); // 60s للاتصال الأولي

// أثناء القراءة، نُعيد ضبط المؤقت مع كل chunk:
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  clearTimeout(timeout);
  timeout = setTimeout(() => controller.abort(), 30_000); // 30s بين كل chunk
  // ...
}
```

### الملفات المتأثرة
- `src/lib/quran-audio.ts` فقط — تعديل `fetchAudioFromUrl`

