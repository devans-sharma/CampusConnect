export const generateItemReferenceNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LF-${year}-${random}`;
};

export const generateClaimReferenceNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CLM-${year}-${random}`;
};
