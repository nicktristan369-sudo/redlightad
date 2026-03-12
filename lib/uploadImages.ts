import { createClient } from "@/lib/supabase";

export async function uploadImages(
  files: File[],
  userId: string
): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const filename = `listings/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(filename, file, { upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from("images").getPublicUrl(filename);
    urls.push(data.publicUrl);
  }

  return urls;
}
