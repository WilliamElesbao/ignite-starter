/**
 * Extracts and formats initials from a full name string.
 *
 * @param name - Full name to extract initials from
 * @returns Uppercase initials from the name
 */
export const getInitials = (name: string) => {
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.toUpperCase();
};
