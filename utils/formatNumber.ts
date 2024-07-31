// format
// const price = 1234.5678;
// const formattedPrice = formatNumber(price);
// console.log(formattedPrice); // Output: "$1,234.57"

export const formatNumber = (digit: number) => {
  return new Intl.NumberFormat("en-us").format(digit);
};
