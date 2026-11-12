/** Default assessment name shown when opening the discovery create modal. */
export const buildDiscoveryAssessmentDefaultName = (
  date = new Date(),
): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `Environment-Assessment-${year}-${month}-${day}`;
};
