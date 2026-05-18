import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — Nyumba Online" },
    { name: "description", content: "Get in touch with the Nyumba Online team via email, phone or WhatsApp." },
  ]}),
  component: Contact,
});
function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Contact us</h1>
        <p className="text-muted-foreground mt-3">We're here to help with subscriptions, listings and any questions.</p>
        <div className="grid gap-4 sm:grid-cols-2 mt-10">
          <a href={`mailto:${CONTACT.email}`} className="rounded-2xl bg-card border border-border p-6 hover:border-primary transition shadow-card">
            <Mail className="h-6 w-6 text-primary" />
            <div className="font-display font-semibold mt-3">Email</div>
            <div className="text-sm text-muted-foreground">{CONTACT.email}</div>
          </a>
          <a href={`tel:${CONTACT.phone1}`} className="rounded-2xl bg-card border border-border p-6 hover:border-primary transition shadow-card">
            <Phone className="h-6 w-6 text-primary" />
            <div className="font-display font-semibold mt-3">Call</div>
            <div className="text-sm text-muted-foreground">{CONTACT.phone1}</div>
            <div className="text-sm text-muted-foreground">{CONTACT.phone2}</div>
          </a>
          <a href={`https://wa.me/${CONTACT.phone1.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener" className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 shadow-glow sm:col-span-2">
            <MessageCircle className="h-6 w-6" />
            <div className="font-display font-semibold mt-3">WhatsApp us</div>
            <div className="text-sm opacity-90">{CONTACT.phone1} · {CONTACT.phone2}</div>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
