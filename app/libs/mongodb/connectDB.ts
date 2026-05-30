import mongoose from "mongoose";

const mongoUrl = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("Already connected to MongoDB");
      return mongoose.connection;
    }

    await mongoose.connect(mongoUrl!);
    console.log("Connected to MongoDB");
    console.log("Connected to MongoDB succesfully!");
    return mongoose.connection;
  } catch (err) {
    console.error(
      "MongoDB connection failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw err;
  }
};

export default connectDB;