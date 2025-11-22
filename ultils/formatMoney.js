export const formatMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return v
    .toLocaleString("en-US", { style: "currency", currency: "USD" })
    .replace("$", "");
};