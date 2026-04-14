// Return in DD-MM-YYYY format
export const formatDateDDMMYYYY = (date) => {
  if (!date) {
    return "";
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Invalid date object provided");
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

// Return in YYYY-MM-DD format
export const formatDateYYYYMMDD = (date) => {
  if (!date) {
    return "";
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Invalid date object provided");
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
};
