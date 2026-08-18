"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !user) {
      router.replace("/login");
    }
  }, [carregando, user, router]);

  if (carregando || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="animate-spin text-navy-600" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
