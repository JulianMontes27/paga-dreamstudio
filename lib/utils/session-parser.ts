export interface ParsedUserAgent {
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  browserVersion: string;
  os: string;
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return {
      deviceType: "desktop",
      deviceName: "Dispositivo desconocido",
      browser: "Navegador desconocido",
      browserVersion: "",
      os: "Sistema desconocido",
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect OS
  let os = "Sistema desconocido";
  let deviceName = "Dispositivo desconocido";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  // Check for mobile/tablet devices FIRST before desktop OS
  // (iPhone/iPad user agents contain "Mac OS X" so they must be checked first)
  if (ua.includes("iphone")) {
    os = "iOS";
    deviceName = "iPhone";
    deviceType = "mobile";
  } else if (ua.includes("ipad")) {
    os = "iOS";
    deviceName = "iPad";
    deviceType = "tablet";
  } else if (ua.includes("android")) {
    os = "Android";
    if (ua.includes("mobile")) {
      deviceName = "Android Phone";
      deviceType = "mobile";
    } else {
      deviceName = "Android Tablet";
      deviceType = "tablet";
    }
  } else if (ua.includes("mac os x")) {
    os = "macOS";
    deviceName = "Macintosh";
    deviceType = "desktop";
  } else if (ua.includes("windows")) {
    os = "Windows";
    deviceName = "Windows PC";
    deviceType = "desktop";
  } else if (ua.includes("linux")) {
    os = "Linux";
    deviceName = "Linux PC";
    deviceType = "desktop";
  }

  // Detect Browser
  let browser = "Navegador desconocido";
  let browserVersion = "";

  if (ua.includes("edg/")) {
    browser = "Edge";
    const match = ua.match(/edg\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("chrome/") && !ua.includes("edg")) {
    browser = "Chrome";
    const match = ua.match(/chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
    const match = ua.match(/firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("safari/") && !ua.includes("chrome")) {
    browser = "Safari";
    const match = ua.match(/version\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("opera/") || ua.includes("opr/")) {
    browser = "Opera";
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/);
    browserVersion = match ? match[1] : "";
  }

  return {
    deviceType,
    deviceName,
    browser,
    browserVersion,
    os,
  };
}

export function formatSessionTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Justo ahora";
  } else if (diffMins < 60) {
    return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays === 0) {
    return `Hoy a las ${date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (diffDays === 1) {
    return `Ayer a las ${date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}
