"use client";

import { usePathname } from "next/navigation";

export default function PathnameProvider({
  children,
}: {
  children: (props: { isLandingPage: boolean }) => React.ReactNode;
}) {
  const isLandingPage = usePathname() === "/";
  return <>{children({ isLandingPage })}</>;
}
