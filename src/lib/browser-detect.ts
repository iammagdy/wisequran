export type BrowserType = "ios-safari" | "chromium" | "firefox" | "generic";

export interface IOSVersionParts {
  major: number;
  minor: number;
}

export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent;

  if (/iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream) {
    return "ios-safari";
  }

  if (/Firefox/i.test(ua) && !/Seamonkey/i.test(ua)) {
    return "firefox";
  }

  if (
    /Chrome|CriOS|Chromium|Edg|OPR|Opera|SamsungBrowser|Brave|Vivaldi|Comet/i.test(ua)
  ) {
    return "chromium";
  }

  return "generic";
}

export function getIOSVersion(): IOSVersionParts | null {
  const ua = navigator.userAgent;
  if (!/iPad|iPhone|iPod/i.test(ua)) return null;

  const match = ua.match(/OS (\d+)(?:_(\d+))?/i);
  if (!match) return null;

  return {
    major: Number(match[1] ?? 0),
    minor: Number(match[2] ?? 0),
  };
}

export function isIOSVersionAtLeast(targetMajor: number, targetMinor = 0): boolean | null {
  const version = getIOSVersion();
  if (!version) return null;

  if (version.major > targetMajor) return true;
  if (version.major < targetMajor) return false;
  return version.minor >= targetMinor;
}

export function getInstallInstructions(
  browser: BrowserType,
  language: "ar" | "en" = "ar"
): { step1: string; step2: string; icon: "share" | "dots-v" | "dots-h" | "menu" } {
  const instructions = {
    "ios-safari": {
      ar: { step1: "اضغط على زر المشاركة", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"" },
      en: { step1: "Tap the Share button", step2: "Choose \"Add to Home Screen\"" },
      icon: "share" as const,
    },
    chromium: {
      ar: { step1: "اضغط على قائمة المتصفح", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"" },
      en: { step1: "Open browser menu", step2: "Choose \"Add to Home Screen\"" },
      icon: "dots-v" as const,
    },
    firefox: {
      ar: { step1: "اضغط على قائمة المتصفح (⋯)", step2: "اختر \"تثبيت\"" },
      en: { step1: "Open browser menu (⋯)", step2: "Choose \"Install\"" },
      icon: "dots-h" as const,
    },
    generic: {
      ar: { step1: "افتح قائمة المتصفح", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"" },
      en: { step1: "Open browser menu", step2: "Choose \"Add to Home Screen\"" },
      icon: "menu" as const,
    },
  };

  const entry = instructions[browser];
  const text = entry[language];
  return { step1: text.step1, step2: text.step2, icon: entry.icon };
}
