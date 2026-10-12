// getting-started.js
import mongoose from "mongoose";
import "dotenv/config";
// registers every model so Mongoose creates the collections and indexes on connect
import "../models/index.js";

async function connectToDB() {
    const uri = process.env.MONGODB_URI as string;
    console.log("Connecting to the database...");
    const db = await mongoose.connect( uri );
  return db;
}

export default connectToDB;