/*
 * Journal — src/models/index.ts
 *
 * Before: barrel file re-exporting every Mongoose model (User, UserDetail, Category, Product, Wishlist,
 *   Cart, Order, OrderItem, Review).
 *
 * 2026-09-26 (Claude): Updated import paths after renaming model files from *.models.ts to *.model.ts.
 */

export { default as User } from "./user.model.js";
export { default as UserDetail } from "./userDetail.model.js";
export { default as Category } from "./category.model.js";
export { default as Product } from "./product.model.js";
export { default as Wishlist } from "./wishlist.model.js";
export { default as Cart } from "./cart.model.js";
export { default as Order } from "./order.model.js";
export { default as OrderItem } from "./orderItem.model.js";
export { default as Review } from "./review.model.js";
