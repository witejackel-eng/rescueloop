import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Pilot",
  description: "Apply for early access to RescueLoop — activation rescue for Whop course creators.",
};

export default function PrivatePilotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
