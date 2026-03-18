import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garante family_member + conta padrão na primeira família do projeto.
 */
export async function ensureFamilyMember(
  supabase: SupabaseClient,
  user: User,
): Promise<{ memberId: string }> {
  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    return { memberId: existing.id };
  }

  const { count } = await supabase
    .from("family_members")
    .select("*", { count: "exact", head: true });

  const isFirst = count === 0;
  const name =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Membro";

  const { data: inserted, error } = await supabase
    .from("family_members")
    .insert({
      user_id: user.id,
      name,
      role: isFirst ? "admin" : "member",
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!inserted) throw new Error("Falha ao criar membro da família");

  if (isFirst) {
    await supabase.from("accounts").insert({
      name: "Principal",
      type: "checking",
    });
  }

  return { memberId: inserted.id };
}
