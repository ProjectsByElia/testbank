drop function if exists public.create_paybis_widget_url(text, text, text, text, text);

create or replace function public.create_paybis_widget_url(
  p_transaction_flow text default 'buyCrypto',
  p_currency_code_from text default 'USD',
  p_currency_code_to text default 'BTC',
  p_amount_from text default '100',
  p_locale text default 'en',
  p_crypto_address text default null,
  p_partner_user_id text default null,
  p_success_return_url text default null,
  p_failure_return_url text default null,
  p_layout text default null
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cfg public.paybis_settings%rowtype;
  v_query_parts text[] := array[]::text[];
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

  v_query_parts := array_append(v_query_parts, 'amountFrom=' || trim(p_amount_from));
  v_query_parts := array_append(v_query_parts, 'currencyCodeFrom=' || upper(trim(p_currency_code_from)));
  v_query_parts := array_append(v_query_parts, 'currencyCodeTo=' || upper(trim(p_currency_code_to)));
  v_query_parts := array_append(v_query_parts, 'locale=' || lower(trim(p_locale)));
  v_query_parts := array_append(v_query_parts, 'partnerId=' || trim(v_cfg.partner_id));
  v_query_parts := array_append(v_query_parts, 'transactionFlow=' || trim(p_transaction_flow));

  if nullif(trim(p_crypto_address), '') is not null then
    v_query_parts := array_append(v_query_parts, 'cryptoAddress=' || trim(p_crypto_address));
  end if;

  if nullif(trim(p_partner_user_id), '') is not null then
    v_query_parts := array_append(v_query_parts, 'partnerUserId=' || trim(p_partner_user_id));
  end if;

  if nullif(trim(p_success_return_url), '') is not null then
    v_query_parts := array_append(v_query_parts, 'successReturnURL=' || trim(p_success_return_url));
  end if;

  if nullif(trim(p_failure_return_url), '') is not null then
    v_query_parts := array_append(v_query_parts, 'failureReturnURL=' || trim(p_failure_return_url));
  end if;

  if nullif(trim(p_layout), '') is not null then
    v_query_parts := array_append(v_query_parts, 'layout=' || trim(p_layout));
  end if;

  v_query := '?' || array_to_string(v_query_parts, '&');

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

revoke all on function public.create_paybis_widget_url(text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_paybis_widget_url(text, text, text, text, text, text, text, text, text, text) to authenticated;
