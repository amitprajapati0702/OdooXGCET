"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/shared/Navbar";

function ForceChangePasswordCheck() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Cast to any to access custom property
    if (session?.user?.forcePasswordChange && pathname !== "/change-password") {
      router.push("/change-password");
    }
  }, [session, pathname, router]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ForceChangePasswordCheck />
      <div className="layout">
        <Navbar />
        <main className="main-content">{children}</main>
        <style jsx global>{`
          .layout {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
          }
          .main-content {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
          }
        `}</style>
      </div>
    </SessionProvider>
  );
}
