import mongoose from "mongoose";

beforeAll(async () => {
  // Setup test database
  const mongoUri =
    process.env["MONGODB_URI"] || "mongodb://localhost:27017/test_db";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Cleanup
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up test data
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});
