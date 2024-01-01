import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: DB_NAME, // Specify the database name here
        });

        console.log(`MongoDb connected !! DbHost: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGO DB CONNECTION ERROR ", error);
        process.exit(1);
    }
};

export default connectDB;
