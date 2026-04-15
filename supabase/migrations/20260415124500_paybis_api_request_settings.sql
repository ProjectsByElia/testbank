alter table public.paybis_settings
add column if not exists paybis_api_key text,
add column if not exists paybis_private_key_pem text;

comment on column public.paybis_settings.paybis_api_key is
  'Paybis private API key used for requestId flow (server-side only).';

comment on column public.paybis_settings.paybis_private_key_pem is
  'Paybis request-signing RSA private key in PEM format for X-Request-Signature.';
