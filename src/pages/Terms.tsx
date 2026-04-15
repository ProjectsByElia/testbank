import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Scale, AlertTriangle, Building2, Download, Lock, FileText, Globe, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";

export const Terms = () => {
  // SEO basics
  useEffect(() => {
    document.title = "Terms & Conditions • USDT BANC";
    const desc = "USDT Banc Terms: eligibility, services, responsibilities, risks, and contact.";
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
    // JSON-LD WebPage
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Terms and Conditions",
      description: desc,
      url: href,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const sections = useMemo(() => ([
    {
      title: "Eligibility",
      points: [
        "You must be at least 18 years old and legally allowed to use cryptocurrency services in your country.",
        "By signing up, you confirm that all information you provide is accurate and complete.",
      ],
      icon: ShieldCheck,
    },
    {
      title: "Services Provided",
      points: [
        "USDT Banc provides tools to help you sign up, purchase cryptocurrency, and hold or transfer it.",
        "We do not offer investment advice, and all purchases are made at your own risk.",
      ],
      icon: FileText,
    },
    {
      title: "User Responsibilities",
      points: [
        "Keep your account details secure and confidential.",
        "Use our services only for lawful purposes.",
        "You are responsible for all transactions made under your account.",
      ],
      icon: Shield,
    },
    {
      title: "Risks of Cryptocurrency",
      points: [
        "Cryptocurrency values can be volatile and may change rapidly.",
        "Transactions are irreversible; always verify details before sending.",
        "You acknowledge these risks and will not hold USDT Banc responsible for any losses.",
      ],
      icon: AlertTriangle,
    },
    {
      title: "No Financial Advice",
      points: [
        "Information on our website is for educational purposes only.",
        "We do not provide investment, tax, or legal advice.",
      ],
      icon: Scale,
    },
    {
      title: "Third-Party Services",
      points: [
        "We may use third-party payment processors or wallet providers.",
        "Your use of these services is subject to their terms and policies.",
      ],
      icon: Globe,
    },
    {
      title: "Limitation of Liability",
      points: [
        "USDT Banc is not liable for any direct, indirect, or incidental damages resulting from your use of our services.",
        "This includes, but is not limited to, loss of funds, data breaches, or system errors.",
      ],
      icon: Lock,
    },
    {
      title: "Termination",
      points: [
        "We may suspend or terminate your account at any time if you violate these Terms & Conditions or engage in fraudulent activity.",
      ],
      icon: Shield,
    },
    {
      title: "Changes to Terms",
      points: [
        "We may update these Terms & Conditions at any time. Continued use of our services means you accept the updated terms.",
      ],
      icon: FileText,
    },
    {
      title: "Contact Us",
      points: [
        "On WhatsApp (log in).",
        "Website: www.usdtbanc.com",
      ],
      icon: FileText,
    },
  ]), []);

  const fullText = useMemo(() => {
    const effectiveDate = new Date().toLocaleDateString();
    const header = `USDT Banc – Terms & Conditions\nEffective Date: ${effectiveDate}`;
    const blocks = sections.map(s => `${s.title}\n- ${s.points.join("\n- ")}`);
    return [header, ...blocks].join("\n\n");
  }, [sections]);

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "usdtbanc-terms.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("USDT BANC — Terms & Conditions", 40, 48);
    doc.setFontSize(11.5);
    const maxWidth = 515; // 595 - 2*40
    let y = 80;
    const lines = doc.splitTextToSize(fullText, maxWidth);
    lines.forEach(line => {
      if (y > 780) { doc.addPage(); y = 40; }
      doc.text(line, 40, y);
      y += 16.5;
    });
    doc.save("usdtbanc-terms.pdf");
  };

  return (
    <main>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative p-6 lg:p-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground max-w-3xl">Please read these terms carefully. By using USDT BANC, you agree to the following conditions aligned with crypto, blockchain, and applicable laws.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">KYC/AML</Badge>
            <Badge variant="secondary">Risk Disclosure</Badge>
            <Badge variant="secondary">Custody</Badge>
          </div>
        </div>
      </section>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="space-y-4">
          {sections.map(({ title, points, icon: Icon }) => (
            <Card key={title} className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
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
          <Lock className="h-3.5 w-3.5" /> Your acknowledgment is required to use the platform
        </div>
      </div>
    </main>
  );
};
