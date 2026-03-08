import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Loader2, BookOpen } from "lucide-react";
import { fetchTafsir, type TafsirAyah } from "@/lib/tafsir-api";
import { TAFSIR_EDITIONS } from "@/data/tafsir-editions";
import { toArabicNumerals } from "@/lib/utils";

interface TafsirPanelProps {
  open: boolean;
  onClose: () => void;
  surahNumber: number;
  ayahNumber: number;
  editionId: string;
}

export default function TafsirPanel({ open, onClose, surahNumber, ayahNumber, editionId }: TafsirPanelProps) {
  const [tafsirText, setTafsirText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const editionName = TAFSIR_EDITIONS.find((e) => e.id === editionId)?.name || editionId;

  useEffect(() => {
    if (!open || !surahNumber || !ayahNumber) return;
    setLoading(true);
    setError("");
    fetchTafsir(surahNumber, editionId)
      .then((ayahs) => {
        const found = ayahs.find((a) => a.numberInSurah === ayahNumber);
        setTafsirText(found?.text || "لم يتم العثور على التفسير");
        setLoading(false);
      })
      .catch(() => {
        setError("تعذر تحميل التفسير. تحقق من الاتصال بالإنترنت.");
        setLoading(false);
      });
  }, [open, surahNumber, ayahNumber, editionId]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[70vh]" dir="rtl">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <DrawerTitle className="text-base">
              {editionName} — الآية {toArabicNumerals(ayahNumber)}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="px-5 pb-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive py-4">{error}</p>
          ) : (
            <p
              className="font-arabic text-foreground/90 leading-[2.2]"
              style={{ fontSize: 18 }}
            >
              {tafsirText}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
