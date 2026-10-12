import mongoose from "mongoose";
import connectToDB from "../config/db.js";
import { Product } from "../models/index.js";

async function main() {
    await connectToDB();

    const result = await Product.updateMany(
        { selling_price: { $exists: false } },
        // the [ ] makes this a pipeline update, so the new value can be computed from the document's own fields
        [
            {
                $set: {
                    selling_price: {
                        $round: [{ $multiply: ["$price", { $subtract: [1, { $divide: ["$discount", 100] }] }] }, 2],
                    },
                },
            },
        ],
        // Mongoose 9 only allows pipeline updates when asked for explicitly
        { updatePipeline: true },
    );

    console.log(`Done. Products matched: ${result.matchedCount}, updated: ${result.modifiedCount}`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
