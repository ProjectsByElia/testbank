import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Lock } from "lucide-react";
import { jsPDF } from "jspdf";

export const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy • USDT BANC";
    const desc = "USDT Banc Privacy Policy: how we collect, use, and protect your data.";
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", desc); else {
      const m = document.createElement("meta");
      m.name = "description"; m.content = desc; document.head.appendChild(m);
    }
    const existing = document.querySelector('link[rel="canonical"]');
    const href = window.location.href;
    if (existing) existing.setAttribute("href", href); else {
      const l = document.createElement("link"); l.rel = "canonical"; l.href = href; document.head.appendChild(l);
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "PrivacyPolicy",
      name: "Privacy Policy — USDT Banc",
      description: desc,
      url: href,
    } as const;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const effectiveDate = "8/11/2025";

  const sections = useMemo(() => ([
    {
      title: "Information We Collect",
      points: [
        "Personal Information: Name, email, phone number, and account details.",
        "Transaction Information: Purchases, transfers, and wallet addresses.",
        "Technical Information: IP address, browser type, device information, and cookies.",
      ],
    },
    {
      title: "How We Use Your Information",
      points: [
        "Create and manage your account.",
        "Process cryptocurrency purchases and transfers.",
        "Improve our website and services.",
        "Communicate about updates or promotions (with your consent).",
        "Comply with legal and regulatory requirements.",
      ],
    },
    {
      title: "How We Protect Your Data",
      points: [
        "We use industry-standard security measures to protect your personal and financial data from unauthorized access, loss, or misuse.",
        "However, no system is 100% secure, and we cannot guarantee complete protection.",
      ],
    },
    {
      title: "Sharing Your Information",
      points: [
        "Service Providers: Payment processors, wallet providers, and analytics services.",
        "Legal Authorities: If required by law or to prevent fraud or illegal activities.",
        "We do not sell your personal information.",
      ],
    },
    {
      title: "Cookies",
      points: [
        "We use cookies to enhance your browsing experience and track website performance.",
        "You can disable cookies in your browser settings, but some features may not work properly.",
      ],
    },
    {
      title: "Your Rights",
      points: [
        "Access and request a copy of your personal data.",
        "Request correction or deletion of your data.",
        "Opt out of marketing communications.",
      ],
    },
    {
      title: "Third-Party Links",
      points: [
        "Our website may contain links to third-party sites. We are not responsible for their privacy practices or content.",
      ],
    },
    {
      title: "Changes to This Policy",
      points: [
        "We may update this Privacy Policy from time to time. We encourage you to review it periodically.",
      ],
    },
    {
      title: "Contact Us",
      points: [
        "On WhatsApp (log in).",
        "Website: www.usdtbanc.com",
      ],
    },
  ]), []);

  const fullText = useMemo(() => {
    const header = `Privacy Policy\nEffective Date: ${effectiveDate}`;
    const intro = "USDT Banc (\"we,\" \"our,\" or \"us\") respects your privacy and is committed to protecting your personal information.";
    const blocks = sections.map(s => `${s.title}\n- ${s.points.join("\n- ")}`);
    return [header, intro, ...blocks].join("\n\n");
  }, [sections]);

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "usdtbanc-privacy.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("USDT BANC — Privacy Policy", 40, 48);
    doc.setFontSize(11.5);
    const maxWidth = 515;
    let y = 80;
    const lines = doc.splitTextToSize(fullText, maxWidth);
    lines.forEach(line => {
      if (y > 780) { doc.addPage(); y = 40; }
      doc.text(line, 40, y);
      y += 16.5;
    });
    doc.save("usdtbanc-privacy.pdf");
  };

  return (
    <main>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative p-6 lg:p-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-3xl">How USDT Banc collects, uses, and protects your information.</p>
          <div className="mt-2 text-xs text-muted-foreground">Effective Date: {effectiveDate}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="hover-scale">Security</Badge>
            <Badge variant="secondary" className="hover-scale">Compliance</Badge>
            <Badge variant="secondary" className="hover-scale">Transparency</Badge>
          </div>
        </div>
      </section>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="space-y-4">
          {sections.map(({ title, points }) => (
            <Card key={title} className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={downloadPdf} className="bg-gradient-to-r from-primary to-secondary glow-effect">
          <Download className="h-4 w-4 mr-2" /> Download PDF
        </Button>
        <Button variant="outline" onClick={downloadTxt}>
          <Download className="h-4 w-4 mr-2" /> Download TXT
        </Button>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> We respect your privacy and safeguard your data
        </div>
      </div>
    </main>
  );
};
