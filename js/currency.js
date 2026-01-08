const EXCHANGE_RATES = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79
};

export function getUserCurrency() {
  const locale = navigator.language;

  if (locale.startsWith("en-IN")) return "INR";
  if (locale.startsWith("en-GB")) return "GBP";
  if (locale.startsWith("de") || locale.startsWith("fr")) return "EUR";

  return "USD";
}

export function formatPrice(usdAmount) {
  const currency = getUserCurrency();
  const rate = EXCHANGE_RATES[currency] || 1;

  const converted = usdAmount * rate;

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(converted);
}