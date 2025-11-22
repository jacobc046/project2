//convert into JS date
export const formatDate = (d) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "-"
    : dt.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
};