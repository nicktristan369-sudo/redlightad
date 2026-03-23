import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import ReviewsClient from "@/components/ReviewsClient"

export const revalidate = 120

export const metadata = {
  title: "Reviews | RedLightAD",
  description: "Read verified reviews from real clients worldwide",
}

export default async function ReviewsPage() {
  const supabase = createServerClient()

  // Try with is_approved filter first, fall back if column missing
  let { data: reviews, error } = await supabase
    .from("reviews")
    .select("*, listings!inner(name, city, country, slug, images)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  // If error (column might not exist), fetch without filter
  if (error) {
    const fallback = await supabase
      .from("reviews")
      .select("*, listings!inner(name, city, country, slug, images)")
      .order("created_at", { ascending: false })
      .limit(20)
    reviews = fallback.data
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7]">
        <section className="py-8">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reviews</h1>
              <p className="text-gray-500 mt-2">Read verified reviews from real clients worldwide</p>
            </div>
            <ReviewsClient reviews={(reviews as any) || []} />
          </div>
        </section>
      </main>
    </>
  )
}
