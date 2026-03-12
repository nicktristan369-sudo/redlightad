import AgeVerificationModal from "@/components/AgeVerificationModal";

export default function Home() {
  return (
    <>
      <AgeVerificationModal />

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          The Premier Adult Advertising Platform
        </h1>
        <p className="mb-10 max-w-xl text-lg text-zinc-400">
          Connect with 5000+ active users worldwide
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#get-started"
            className="rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="rounded-lg border border-zinc-600 px-8 py-3 font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Why RedLightAD?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Massive Reach",
                description:
                  "Tap into a global network of high-traffic adult websites and reach millions of engaged visitors daily.",
              },
              {
                title: "Targeted Ads",
                description:
                  "Advanced targeting by geography, demographics, device, and interests ensures your ads reach the right audience.",
              },
              {
                title: "Real Results",
                description:
                  "Track every click, conversion, and ROI in real time with our comprehensive analytics dashboard.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-black p-8"
              >
                <h3 className="mb-3 text-xl font-semibold text-red-500">
                  {feature.title}
                </h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black px-6 py-8 text-center text-sm text-zinc-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
