import mongoose from "mongoose";

type MongooseType = typeof mongoose;

declare global {
  var mongoose: {
    conn: MongooseType | null;
    promise: Promise<MongooseType> | null;
  };
}

export {};
