import mongoose from 'mongoose';

import { NODE_ENV, DB_URI } from '../config/env.js';

if (!DB_URI) {
  throw new Error(
    'Please provide a valid MONGODB_URI environment variable inside .env.<development|production>.local file',
  );
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URI);

    console.log(`Connected to MongoDB in ${NODE_ENV} environment`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);

    process.exit(1);
  }
};

export default connectToDatabase;
