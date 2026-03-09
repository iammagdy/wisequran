

## المشكلة
تنسيقات شريط التمرير (Scrollbar) مُعرّفة فقط للوضع الداكن (`.dark`) ولا توجد تنسيقات للوضع العام تستخدم متغيرات CSS. لذلك في الوضع الداكن، قد يظهر الشريط بلون فاتح على بعض المتصفحات.

## الحل
تعديل `src/index.css` لجعل تنسيقات شريط التمرير تعمل في **كلا الوضعين** باستخدام متغيرات CSS بدلاً من تقييدها بـ `.dark` فقط:

- إزالة الأنماط المحددة بـ `.dark` (الأسطر 111-116)
- استبدالها بأنماط عامة تستخدم `--muted` و `--border` و `--muted-foreground` — هذه المتغيرات تتغير تلقائياً بين الوضعين الفاتح والداكن

```css
/* Scrollbar styling (adapts to light/dark via CSS variables) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: hsl(var(--muted)); }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
* { scrollbar-color: hsl(var(--border)) hsl(var(--muted)); }
```

تعديل بسيط في ملف واحد فقط.

