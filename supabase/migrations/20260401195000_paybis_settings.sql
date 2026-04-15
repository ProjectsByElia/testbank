create extension if not exists pgcrypto with schema extensions;

create table if not exists public.paybis_settings (
  id boolean primary key default true check (id = true),
  partner_id text not null,
  hmac_key_base64 text not null,
  widget_environment text not null default 'sandbox' check (widget_environment in ('sandbox', 'production')),
  enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.paybis_settings enable row level security;

revoke all on table public.paybis_settings from anon;
revoke all on table public.paybis_settings from authenticated;

drop trigger if exists update_paybis_settings_updated_at on public.paybis_settings;
create trigger update_paybis_settings_updated_at
before update on public.paybis_settings
for each row
execute function public.update_updated_at_column();

create or replace function public.create_paybis_widget_url(
  p_transaction_flow text default 'buyCrypto',
  p_currency_code_from text default 'USD',
  p_currency_code_to text default 'BTC',
  p_amount_from text default '100',
  p_locale text default 'en'
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cfg public.paybis_settings%rowtype;
  v_query text;
  v_signature text;
  v_base text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_cfg
  from public.paybis_settings
  where enabled = true
  limit 1;

  if not found then
    raise exception 'Paybis settings are not configured';
  end if;

  v_base :=
    case
      when v_cfg.widget_environment = 'production' then 'https://widget.paybis.com/'
      else 'https://widget.sandbox.paybis.com/'
    end;

  v_query :=
    '?amountFrom=' || trim(p_amount_from) ||
    '&currencyCodeFrom=' || upper(trim(p_currency_code_from)) ||
    '&currencyCodeTo=' || upper(trim(p_currency_code_to)) ||
    '&locale=' || lower(trim(p_locale)) ||
    '&partnerId=' || trim(v_cfg.partner_id) ||
    '&transactionFlow=' || trim(p_transaction_flow);

  v_signature := encode(
    hmac(v_query, decode(trim(v_cfg.hmac_key_base64), 'base64'), 'sha256'),
    'base64'
  );

  return
    v_base || v_query ||
    '&signature=' ||
    replace(replace(replace(v_signature, '+', '%2B'), '/', '%2F'), '=', '%3D');
end;
$$;

revoke all on function public.create_paybis_widget_url(text, text, text, text, text) from public;
grant execute on function public.create_paybis_widget_url(text, text, text, text, text) to authenticated;
