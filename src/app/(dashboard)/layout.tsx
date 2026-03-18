import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureFamilyMember } from "@/lib/auth/ensure-member";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureFamilyMember(supabase, user);

  const familyName =
    process.env.NEXT_PUBLIC_FAMILY_NAME?.trim() || "Dino — Família";

  return <DashboardShell familyName={familyName}>{children}</DashboardShell>;
}
