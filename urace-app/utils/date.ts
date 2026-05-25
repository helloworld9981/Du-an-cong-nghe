export const getDaysRemaining = (targetDate: any, fromDate: any): number => {
  const from = new Date(fromDate);
  const target = new Date(targetDate);
  const diffTime = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatToMonthDay = (date: any): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return d.toLocaleDateString("en-US", options);
};
