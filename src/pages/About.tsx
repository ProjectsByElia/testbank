import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Cpu, Globe, Download, Info, Lock, Scale } from "lucide-react";
import { jsPDF } from "jspdf";

export const About = () => {
  // SEO basics
  useEffect(() => {
    document.title = "About • USDT BANC – Crypto Finance Reimagined";
    const desc = "About USDT BANC: secure crypto wallets, compliant trading, and institutional‑grade custody on blockchain.";
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

    // JSON-LD Organization
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "USDT BANC",
      url: window.location.origin,
      sameAs: [],
      description: desc,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const sections = useMemo(() => ([
    {
      title: "Our Mission",
      body: "Since 2019, we’ve been on a mission to simplify crypto for everyone, everywhere — teaching people how to buy cryptocurrency, set up secure wallets, and trade confidently on exchanges.",
      icon: Info,
    },
    {
      title: "3 Easy Steps",
      body: "Sign Up – Create your account in minutes. Purchase Crypto – Buy digital assets quickly and securely. Hold or Transfer – Keep your crypto safe or send it anywhere in the world.",
      icon: Download,
    },
    {
      title: "Empowering Access",
      body: "Our goal is to empower millions of people — especially those without access to traditional banking — to join the digital economy and take control of their financial future.",
      icon: Globe,
    },
    {
      title: "The USDT Banc Team",
      body: "The USDT Banc team is made up of passionate, experienced professionals who have been in the crypto space for years. We believe in making digital currency accessible, secure, and easy to use for everyone. Whether you’re a beginner or an experienced trader, www.usdtbanc.com is here to guide you every step of the way.",
      icon: Shield,
    },
  ]), []);

  const fullText = useMemo(() => {
    return [
      "Welcome to USDT Banc — your gateway to the digital financial world.",
      "Since 2019, we’ve been on a mission to simplify crypto for everyone, everywhere. We started by teaching people how to buy cryptocurrency, set up secure wallets, and trade confidently on exchanges. Today, we’ve taken that knowledge and built a platform that lets you step into crypto in just 3 easy steps:",
      "- Sign Up – Create your account in minutes.",
      "- Purchase Crypto – Buy digital assets quickly and securely.",
      "- Hold or Transfer – Keep your crypto safe or send it anywhere in the world.",
      "Our goal is to empower millions of people — especially those without access to traditional banking — to join the digital economy and take control of their financial future.",
      "The USDT Banc team is made up of passionate, experienced professionals who have been in the crypto space for years. We believe in making digital currency accessible, secure, and easy to use for everyone. Whether you’re a beginner taking your first step or an experienced trader, www.usdtbanc.com is here to guide you every step of the way."
    ].join("\n\n");
  }, []);

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "usdtbanc-about.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("USDT BANC — About", 40, 48);
    doc.setFontSize(12);
    const maxWidth = 515; // 595 - 2*40
    let y = 80;
    const lines = doc.splitTextToSize(fullText, maxWidth);
    lines.forEach(line => {
      if (y > 780) { doc.addPage(); y = 40; }
      doc.text(line, 40, y);
      y += 18;
    });
    doc.save("usdtbanc-about.pdf");
  };

  return (
    <main>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative p-6 lg:p-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Welcome to USDT Banc — your gateway to the digital financial world.</h1>
          <p className="text-muted-foreground max-w-3xl">Since 2019, we’ve simplified crypto for everyone. Step into crypto in 3 easy steps: Sign Up, Purchase Crypto, Hold or Transfer.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="hover-scale">Secure by Design</Badge>
            <Badge variant="secondary" className="hover-scale">Compliance‑Ready</Badge>
            <Badge variant="secondary" className="hover-scale">Blockchain‑Native</Badge>
          </div>
        </div>
      </section>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map(({ title, body, icon: Icon }) => (
            <Card key={title} className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{body}</p>
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
          <Lock className="h-3.5 w-3.5" /> No personal data in this document
        </div>
      </div>
    </main>
  );
};
