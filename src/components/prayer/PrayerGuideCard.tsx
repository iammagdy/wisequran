import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Droplets, HandHelping, Volume2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const WUDU_STEPS = [
  "النية في القلب والتسمية (بسم الله)",
  "غسل الكفين ثلاث مرات",
  "المضمضة والاستنشاق ثلاث مرات",
  "غسل الوجه ثلاث مرات",
  "غسل اليد اليمنى إلى المرفق ثلاثًا، ثم اليسرى كذلك",
  "مسح الرأس كله مرة واحدة (من المقدمة إلى القفا ثم الرجوع)",
  "مسح الأذنين مرة واحدة",
  "غسل القدم اليمنى إلى الكعبين ثلاثًا، ثم اليسرى كذلك",
];

const PRAYER_STEPS = [
  "استقبل القبلة وانوِ الصلاة في قلبك",
  "كبّر تكبيرة الإحرام رافعًا يديك حذو منكبيك: «الله أكبر»",
  "ضع يدك اليمنى على اليسرى على صدرك واقرأ دعاء الاستفتاح",
  "تعوّذ بالله من الشيطان ثم اقرأ البسملة والفاتحة وما تيسر من القرآن",
  "كبّر واركع واجعل ظهرك مستويًا وقل: «سبحان ربي العظيم» ثلاثًا",
  "ارفع من الركوع قائلًا: «سمع الله لمن حمده» ثم قل: «ربنا ولك الحمد»",
  "كبّر واسجد على سبعة أعضاء وقل: «سبحان ربي الأعلى» ثلاثًا",
  "اجلس بين السجدتين وقل: «ربِّ اغفر لي» ثم اسجد الثانية مثل الأولى",
  "قم للركعة الثانية وافعل كما في الأولى",
  "في التشهد الأخير: اقرأ التشهد والصلاة الإبراهيمية",
  "سلّم عن يمينك ثم عن يسارك: «السلام عليكم ورحمة الله»",
];

const RAKAT_INFO = [
  { name: "الفجر", count: "٢", note: "" },
  { name: "الظهر", count: "٤", note: "" },
  { name: "العصر", count: "٤", note: "" },
  { name: "المغرب", count: "٣", note: "" },
  { name: "العشاء", count: "٤", note: "" },
];

const JAHRIYA_INFO = [
  { name: "الفجر", icon: "🌅", mode: "جهرًا", loud: true },
  { name: "الظهر", icon: "☀️", mode: "سرًا", loud: false },
  { name: "العصر", icon: "🌤", mode: "سرًا", loud: false },
  { name: "المغرب", icon: "🌅", mode: "جهرًا", loud: true },
  { name: "العشاء", icon: "🌙", mode: "جهرًا", loud: true },
];

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function GuideSection({ icon, title, children }: SectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
        <span className="flex-1 text-right font-bold text-sm">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="px-3 pb-3 pt-1"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function PrayerGuideCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-card p-4 shadow-soft border border-border/50"
    >
      <h2 className="text-center text-lg font-bold mb-3">📖 دليل الصلاة</h2>

      <div className="space-y-1">
        {/* الوضوء */}
        <GuideSection icon={<Droplets className="h-4 w-4" />} title="كيفية الوضوء">
          <ol className="space-y-2 pr-1">
            {WUDU_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {(i + 1).toLocaleString("ar-EG")}
                </span>
                <span className="text-muted-foreground leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </GuideSection>

        {/* كيفية الصلاة */}
        <GuideSection icon={<HandHelping className="h-4 w-4" />} title="كيفية الصلاة">
          <ol className="space-y-2 pr-1 mb-4">
            {PRAYER_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {(i + 1).toLocaleString("ar-EG")}
                </span>
                <span className="text-muted-foreground leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          {/* عدد الركعات */}
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-bold text-center mb-2">عدد الركعات</p>
            <div className="flex justify-around">
              {RAKAT_INFO.map((r) => (
                <div key={r.name} className="text-center">
                  <p className="text-lg font-bold text-primary">{r.count}</p>
                  <p className="text-[10px] text-muted-foreground">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </GuideSection>

        {/* الجهر والسر */}
        <GuideSection icon={<Volume2 className="h-4 w-4" />} title="الجهر والسر في القراءة">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            الإمام يجهر بالقراءة في بعض الصلوات ويُسرّ في أخرى
          </p>
          <div className="space-y-2">
            {JAHRIYA_INFO.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-2.5 text-sm",
                  p.loud ? "bg-primary/5" : "bg-muted/50"
                )}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="flex-1 text-right font-semibold">{p.name}</span>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  p.loud
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {p.mode}
                </span>
              </div>
            ))}
          </div>
        </GuideSection>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        المصدر: صفة صلاة النبي ﷺ — الشيخ الألباني | islamqa.info
      </p>
    </motion.div>
  );
}
