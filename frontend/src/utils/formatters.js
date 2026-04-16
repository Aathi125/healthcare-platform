export const formatCurrency = (amount, currency = "LKR") => {
  const numericAmount = Number(amount);
  const normalizedCurrency = (currency || "LKR").toUpperCase();

  if (!Number.isFinite(numericAmount)) {
    return `${normalizedCurrency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency
    }).format(numericAmount);
  } catch {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
};

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};
