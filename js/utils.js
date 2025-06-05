export function getElement(target) {
  const element = document.querySelector(target);
  if (!element) {
    console.warn(`No element found for selector: ${target}`);
    return null;
  }
  return element;
}

export function randomNumber() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function validNumber(...anyAmountOfArgs) {
  return anyAmountOfArgs.every((val) => Number.isFinite(val) && val > 0);
}
