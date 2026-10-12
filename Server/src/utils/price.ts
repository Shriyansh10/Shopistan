// money to 2 decimal places (6.9513 → 6.95)
export const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
// price after the % discount, rounded to cents
export const getSellingPrice = (price: number, discount: number) =>
  roundMoney(price * (1 - discount / 100));
