const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryMongo = null;

async function connectDB() {
  const uri = process.env.MONGO_URI;

  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log(`[db] connected -> ${uri}`);
      return;
    }

    memoryMongo = await MongoMemoryServer.create();
    const memoryUri = memoryMongo.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[db] connected -> ${memoryUri} (in-memory MongoDB fallback)`);
  } catch (err) {
    console.error("[db] connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
