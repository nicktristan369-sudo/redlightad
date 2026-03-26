import { createClient } from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export function generateToken(length = 10): string {
  const chars =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createInviteLink(data: {
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  category?: string;
  description?: string;
  images?: string[];
  source_url?: string;
}) {
  const supabase = db();
  const token = generateToken();
  const { data: invite, error } = await supabase
    .from("invite_links")
    .insert({
      token,
      ...data,
      images: data.images ? JSON.stringify(data.images) : null,
    })
    .select("token")
    .single();
  if (error) throw error;
  return invite.token;
}
