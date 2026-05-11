import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ReportBuilder from "@/components/builder/ReportBuilder";

export default function Builder() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-6">
            <Link to="/explorer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Explorer
            </Link>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Builder</div>
              <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">Budget Analysis Builder</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                Compose your own analysis across ministries, demands, major heads and schemes. Save and share via URL.
              </p>
            </div>
          </div>
        </section>
        <section className="container py-6">
          <ReportBuilder />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
