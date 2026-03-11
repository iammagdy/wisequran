/** Detect browser type for PWA install instructions */
export type BrowserType = "ios-safari" | "chromium" | "firefox" | "generic";

export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent;

  // iOS (Safari, Chrome on iOS, etc.)
  if (/iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream) {
    return "ios-safari";
  }

  // Firefox (desktop & Android)
  if (/Firefox/i.test(ua) && !/Seamonkey/i.test(ua)) {
    return "firefox";
  }

  // Chromium-based: Chrome, Edge, Brave, Opera, Samsung Internet, Comet, Vivaldi, etc.
  if (
    /Chrome|CriOS|Chromium|Edg|OPR|Opera|SamsungBrowser|Brave|Vivaldi|Comet/i.test(ua)
  ) {
    return "chromium";
  }

  return "generic";
}

/** Get Arabic install instructions based on browser type */
export function getInstallInstructions(browser: BrowserType): { step1: string; step2: string; icon: "share" | "dots-v" | "dots-h" | "menu" } {
  switch (browser) {
    case "ios-safari":
      return { step1: "اضغط على زر المشاركة", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"", icon: "share" };
    case "chromium":
      return { step1: "اضغط على قائمة المتصفح", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"", icon: "dots-v" };
    case "firefox":
      return { step1: "اضغط على قائمة المتصفح (⋯)", step2: "اختر \"تثبيت\"", icon: "dots-h" };
    default:
      return { step1: "افتح قائمة المتصفح", step2: "اختر \"إضافة إلى الشاشة الرئيسية\"", icon: "menu" };
  }
}
