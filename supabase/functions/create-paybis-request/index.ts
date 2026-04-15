import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { constants, createHash, sign as nodeSign } from "node:crypto";

type PaybisSettings = {
  paybis_api_key: string;
  paybis_private_key_pem: string;
  widget_environment: "sandbox" | "production";
  enabled: boolean;
};

type RequestPayload = {
  transactionFlow?: "buyCrypto" | "sellCrypto";
  currencyCodeFrom: string;
  currencyCodeTo: string;
  amountFrom: string;
  locale: string;
  cryptoAddress?: string | null;
  successReturnURL?: string | null;
  failureReturnURL?: string | null;
  layout?: "embed" | "default" | "light" | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePem(pem: string): string {
  return pem.includes("\\n") ? pem.replaceAll("\\n", "\n") : pem;
}

async function signPaybisBody(body: string, privateKeyPem: string): Promise<string> {
  const digestHex = createHash("sha512").update(body, "utf8").digest("hex");
  const signature = nodeSign("sha512", Buffer.from(digestHex, "utf8"), {
    key: normalizePem(privateKeyPem),
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString("base64");
}

async function callPaybisApi<T>(
  apiBaseUrl: string,
  path: string,
  payload: Record<string, unknown>,
  apiKey: string,
  rsaPrivateKeyPem: string,
): Promise<T> {
  const body = JSON.stringify(payload);
  const signature = await signPaybisBody(body, rsaPrivateKeyPem);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "X-API-KEY": apiKey,
      "X-Request-Signature": signature,
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Paybis ${path} failed (${response.status}): ${responseText}`);
  }

  if (!responseText) {
    return {} as T;
  }
  return JSON.parse(responseText) as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestPayload;
    if (!body?.currencyCodeFrom || !body?.currencyCodeTo || !body?.amountFrom) {
      return new Response(
        JSON.stringify({ error: "currencyCodeFrom, currencyCodeTo, and amountFrom are required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: settings, error: settingsError } = await serviceClient
      .from("paybis_settings")
      .select("paybis_api_key, paybis_private_key_pem, widget_environment, enabled")
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      throw new Error(settingsError.message);
    }
    if (!settings) {
      throw new Error("Paybis settings are not configured.");
    }

    const cfg = settings as PaybisSettings;
    if (!cfg.paybis_api_key || !cfg.paybis_private_key_pem) {
      throw new Error("Paybis API credentials are missing (paybis_api_key/paybis_private_key_pem).");
    }

    const apiBaseUrl =
      cfg.widget_environment === "production"
        ? "https://widget-api.paybis.com"
        : "https://widget-api.sandbox.paybis.com";
    const widgetBaseUrl =
      cfg.widget_environment === "production"
        ? "https://widget.paybis.com/"
        : "https://widget.sandbox.paybis.com/";

    const quotePayload = {
      currencyCodeFrom: body.currencyCodeFrom.trim().toUpperCase(),
      currencyCodeTo: body.currencyCodeTo.trim().toUpperCase(),
      amount: body.amountFrom.trim(),
      directionChange: "from",
      isReceivedAmount: false,
    };

    const quoteResponse = await callPaybisApi<{ id: string }>(
      apiBaseUrl,
      "/v2/quote",
      quotePayload,
      cfg.paybis_api_key,
      cfg.paybis_private_key_pem,
    );

    if (!quoteResponse?.id) {
      throw new Error("Paybis quote response did not include quote id.");
    }

    const requestPayload: Record<string, unknown> = {
      partnerUserId: user.id,
      quoteId: quoteResponse.id,
      locale: (body.locale || "en").trim().toLowerCase(),
      flow: body.transactionFlow || "buyCrypto",
    };

    if (body.cryptoAddress?.trim()) {
      requestPayload.cryptoWalletAddress = {
        address: body.cryptoAddress.trim(),
        currencyCode: body.currencyCodeTo.trim().toUpperCase(),
      };
    }

    if (user.email) {
      requestPayload.email = user.email;
    }

    const requestResponse = await callPaybisApi<{ requestId: string; oneTimeToken?: string | null }>(
      apiBaseUrl,
      "/v2/request",
      requestPayload,
      cfg.paybis_api_key,
      cfg.paybis_private_key_pem,
    );

    if (!requestResponse?.requestId) {
      throw new Error("Paybis request response did not include requestId.");
    }

    const params = new URLSearchParams();
    params.set("requestId", requestResponse.requestId);

    if (body.successReturnURL?.trim()) {
      params.set("successReturnURL", body.successReturnURL.trim());
    }
    if (body.failureReturnURL?.trim()) {
      params.set("failureReturnURL", body.failureReturnURL.trim());
    }
    if (body.layout?.trim()) {
      params.set("layout", body.layout.trim());
    }
    if (requestResponse.oneTimeToken) {
      params.set("oneTimeToken", requestResponse.oneTimeToken);
    }

    const widgetUrl = `${widgetBaseUrl}?${params.toString()}`;

    return new Response(JSON.stringify({ widgetUrl, requestId: requestResponse.requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
