import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — Nyumba Online" },
    { name: "description", content: "About Nyumba Online — Malawi's premium real estate marketplace." },
  ]}),
  component: About,
});
function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold">About Nyumba Online</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Nyumba Online is Malawi's premium digital real estate marketplace. We connect house hunters with verified, approved landlords and property owners across the country — from Lilongwe and Blantyre to Mzuzu, Zomba and beyond.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Our mission is to make finding and listing property in Malawi simple, trusted and beautiful. Every landlord is reviewed and approved before they can publish, and every listing meets a high quality bar.
        </p>
        <h2 className="font-display text-2xl font-bold mt-12">How we work</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li>• Landlords apply, get verified by our admin team, then activate a monthly subscription.</li>
          <li>• Seekers can browse free, and subscribe to unlock direct contact with owners.</li>
          <li>• Our admin team handles disputes and keeps the marketplace safe.</li>
        </ul>
      </main>
      <Footer />
    </div>
  );
}
