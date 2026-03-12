export async function uploadImages(files: File[]): Promise<string[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const urls: string[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "listings");

    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(
        `Cloudinary upload failed: ${err.error?.message || res.statusText}`
      );
    }
    const data = await res.json();
    urls.push(data.secure_url);
  }

  return urls;
}
