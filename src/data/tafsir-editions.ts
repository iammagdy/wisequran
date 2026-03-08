export interface TafsirEdition {
  id: string;
  name: string;
}

export const TAFSIR_EDITIONS: TafsirEdition[] = [
  { id: "ar.muyassar", name: "تفسير الميسر" },
  { id: "ar.jalalayn", name: "تفسير الجلالين" },
  { id: "ar.qurtubi", name: "تفسير القرطبي" },
  { id: "ar.baghawi", name: "تفسير البغوي" },
  { id: "ar.waseet", name: "التفسير الوسيط" },
  { id: "ar.miqbas", name: "تنوير المقباس" },
];

export const DEFAULT_TAFSIR = "ar.muyassar";
