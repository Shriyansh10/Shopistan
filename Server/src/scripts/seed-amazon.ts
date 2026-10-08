/*
 * Journal — src/scripts/seed-amazon.ts
 *
 * 2026-10-05 (Claude): Created. Seeds Category + Product from the Kaggle "Amazon Products Dataset 2023
 *   (1.4M products)" by asaniczka. Streams amazon_products.csv, upserts by ASIN so re-runs don't duplicate.
 *   Usage: node dist/scripts/seed-amazon.js [--dir ./data/amazon] [--limit 50000] [--per-category 200]
 * 2026-10-05 (Claude): Seeds Departments first (from data/category-departments.ts) and sets each
 *   Category's parent_id. Fails before writing anything if a dataset category has no department.
 */

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { parse } from "csv-parse";
import connectToDB from "../config/db.js";
import { Category, Department, Product } from "../models/index.js";
import categoryDepartments from "./data/category-departments.js";

type CategoryRow = { id: string; category_name: string };
type ProductRow = {
    asin: string;
    title: string;
    imgUrl: string;
    stars: string;
    price: string;
    listPrice: string;
    category_id: string;
};

function arg(name: string, fallback: string) {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const DIR = path.resolve(arg("dir", "./data/amazon"));
const LIMIT = Number(arg("limit", "50000"));          // total products; 0 = no limit
const PER_CATEGORY = Number(arg("per-category", "0")); // cap per category; 0 = no cap
const BATCH_SIZE = 1000;

function csv<T>(file: string): AsyncIterable<T> {
    return fs.createReadStream(path.join(DIR, file)).pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true }));
}

function slugify(name: string) {
    return name.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function seedDepartments() {
    // category name -> our Department ObjectId
    const parentByCategory = new Map<string, mongoose.Types.ObjectId>();

    for (const [name, categories] of Object.entries(categoryDepartments)) {
        const department = await Department.findOneAndUpdate(
            { name },
            { $set: { name, slug: slugify(name) } },
            { upsert: true, returnDocument: "after" },
        );
        for (const category of categories) parentByCategory.set(category, department._id);
    }

    console.log(`Departments ready: ${Object.keys(categoryDepartments).length}`);
    return parentByCategory;
}

async function seedCategories(parentByCategory: Map<string, mongoose.Types.ObjectId>) {
    const rows: CategoryRow[] = [];
    for await (const row of csv<CategoryRow>("amazon_categories.csv")) {
        if (row.category_name?.trim()) rows.push(row);
    }

    // check the mapping covers the whole file before writing any category
    const unmapped = rows.filter((row) => !parentByCategory.has(row.category_name.trim()));
    if (unmapped.length) {
        throw new Error(`No department for: ${unmapped.map((row) => row.category_name).join(", ")}. Add them to data/category-departments.ts`);
    }

    // amazon category id -> our Category ObjectId
    const idMap = new Map<string, mongoose.Types.ObjectId>();

    for (const row of rows) {
        const name = row.category_name.trim();
        const category = await Category.findOneAndUpdate(
            { name },
            { $set: { name, parent_id: parentByCategory.get(name) } },
            { upsert: true, returnDocument: "after" },
        );
        idMap.set(row.id, category._id);
    }

    console.log(`Categories ready: ${idMap.size}`);
    return idMap;
}

function toProduct(row: ProductRow, categoryId: mongoose.Types.ObjectId) {
    const price = Number(row.price);
    const listPrice = Number(row.listPrice);
    const stars = Number(row.stars);

    // price = original (list) price, discount = % off, so selling price = price * (1 - discount / 100)
    const onSale = listPrice > price;
    return {
        asin: row.asin,
        category_id: categoryId,
        image: row.imgUrl,
        name: row.title.trim(),
        price: onSale ? listPrice : price,
        discount: onSale ? Math.round((1 - price / listPrice) * 100) : 0,
        rating: Number.isFinite(stars) ? Math.min(Math.max(stars, 0), 5) : 0,
    };
}

async function flush(batch: ReturnType<typeof toProduct>[]) {
    if (!batch.length) return;
    await Product.bulkWrite(
        batch.map((p) => ({ updateOne: { filter: { asin: p.asin }, update: { $set: p }, upsert: true } })),
        { ordered: false },
    );
}

async function seedProducts(idMap: Map<string, mongoose.Types.ObjectId>) {
    const perCategory = new Map<string, number>();
    let batch: ReturnType<typeof toProduct>[] = [];
    let written = 0;
    let skipped = 0;

    for await (const row of csv<ProductRow>("amazon_products.csv")) {
        if (LIMIT && written + batch.length >= LIMIT) break;

        const categoryId = idMap.get(row.category_id);
        const price = Number(row.price);
        // rows with price 0 are unavailable listings on Amazon
        if (!categoryId || !row.asin || !row.title?.trim() || !row.imgUrl || !(price > 0)) {
            skipped++;
            continue;
        }

        if (PER_CATEGORY) {
            const count = perCategory.get(row.category_id) ?? 0;
            if (count >= PER_CATEGORY) continue;
            perCategory.set(row.category_id, count + 1);
        }

        batch.push(toProduct(row, categoryId));
        if (batch.length >= BATCH_SIZE) {
            await flush(batch);
            written += batch.length;
            batch = [];
            console.log(`Products upserted: ${written}`);
        }
    }

    await flush(batch);
    written += batch.length;
    console.log(`Done. Products upserted: ${written}, skipped invalid rows: ${skipped}`);
}

async function main() {
    for (const file of ["amazon_categories.csv", "amazon_products.csv"]) {
        if (!fs.existsSync(path.join(DIR, file))) {
            throw new Error(`Missing ${file} in ${DIR}. Download the Kaggle dataset and unzip it there.`);
        }
    }

    await connectToDB();
    await Product.syncIndexes(); // ensures the unique asin index exists before upserting
    const parentByCategory = await seedDepartments();
    const idMap = await seedCategories(parentByCategory);
    await seedProducts(idMap);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
