import { createContext, useContext, type ReactNode } from "react";
import type { SiteData } from "./db-types";

const fallback: SiteData = {
  branding: { company_name: "AD Security Camera Solution" },
  contact: { email: "adsecuritycamerasolution@gmail.com" },
  seo: {
    title: "AD Security Camera Solution",
    description: "Professional security systems, installation and technology solutions.",
  },
  appearance: {},
  footerSettings: {},
  navigation: [],
  footerSections: [],
  socialLinks: [],
  announcement: null,
};

const SiteContext = createContext<SiteData>(fallback);

export function SiteProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteData {
  return useContext(SiteContext);
}
