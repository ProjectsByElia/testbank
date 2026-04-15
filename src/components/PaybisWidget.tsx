import { useMemo, useState } from "react";
import { Globe, ExternalLink, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

type Region = "AMERICAS" | "EUROZONE";

const CRYPTO_OPTIONS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "SOL", label: "Solana (SOL)" },
];

function getLocale(region: Region) {
  return region === "EUROZONE" ? "en" : "en";
}

function getFiat(region: Region) {
  return region === "EUROZONE" ? "EUR" : "USD";
}

function getTitle(region: Region) {
  return region === "EUROZONE" ? "Eurozone Paybis On-Ramp" : "Americas Paybis On-Ramp";
}

function getDescription(region: Region) {
  return region === "EUROZONE"
    ? "Launch Paybis to buy crypto with EUR using API-based requestId sessions."
    : "Launch Paybis to buy crypto with USD using API-based requestId sessions.";
}

export default function PaybisWidget({ region }: { region: Region }) {
  const [amountFrom, setAmountFrom] = useState(region === "EUROZONE" ? "100" : "100");
  const [currencyCodeTo, setCurrencyCodeTo] = useState("BTC");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [widgetUrl, setWidgetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencyCodeFrom = useMemo(() => getFiat(region), [region]);
  const locale = useMemo(() => getLocale(region), [region]);

  const launchWidget = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const successReturnURL = `${window.location.origin}/?paybisStatus=success`;
      const failureReturnURL = `${window.location.origin}/?paybisStatus=failed`;

      const { data, error } = await supabase.functions.invoke<{ widgetUrl: string }>("create-paybis-request", {
        body: {
          transactionFlow: "buyCrypto",
          currencyCodeFrom,
          currencyCodeTo,
          amountFrom,
          locale,
          successReturnURL,
          failureReturnURL,
          cryptoAddress: cryptoAddress.trim() || null,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to prepare the Paybis request.");
      }

      const nextUrl = data?.widgetUrl ?? "";
      if (!nextUrl) {
        throw new Error("Paybis request was created but no widget URL was returned.");
      }
      setWidgetUrl(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare the Paybis request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 border-b border-primary/20 bg-card">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{getTitle(region)}</h2>
            <p className="text-sm text-muted-foreground">{getDescription(region)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Buy Crypto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fiat Currency</Label>
                <Input value={currencyCodeFrom} readOnly className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label>Crypto Asset</Label>
                <Select value={currencyCodeTo} onValueChange={setCurrencyCodeTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="10"
                  step="1"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Destination Wallet Address (optional)</Label>
              <Input
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder={`Paste your ${currencyCodeTo} wallet address`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={launchWidget} disabled={loading} className="sm:w-auto">
                {loading ? "Preparing Paybis session..." : "Load Paybis Widget"}
              </Button>
              {widgetUrl ? (
                <Button asChild variant="outline">
                  <a href={widgetUrl} target="_blank" rel="noreferrer">
                    Open In New Tab
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              ) : null}
            </div>

            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>API-based requestId flow</AlertTitle>
              <AlertDescription>
                Paybis sessions are now generated server-side by creating a quote and requestId, then the widget is
                opened using that one-time request context.
              </AlertDescription>
            </Alert>

            {error ? (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Widget unavailable</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-primary/20 overflow-hidden">
          <CardHeader>
            <CardTitle>Paybis Widget</CardTitle>
          </CardHeader>
          <CardContent>
            {widgetUrl ? (
              <iframe
                title={`${region} Paybis widget`}
                src={widgetUrl}
                className="w-full min-h-[900px] rounded-lg border border-border"
                allow="clipboard-read; clipboard-write *; payment *; camera; microphone;"
              />
            ) : (
              <div className="min-h-[420px] rounded-lg border border-dashed border-primary/30 bg-muted/20 flex items-center justify-center p-6 text-center text-muted-foreground">
                Configure Paybis signing secrets, then click “Load Paybis Widget” to render the buy flow here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
