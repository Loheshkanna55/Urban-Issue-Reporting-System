const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://Lohesh:<password>@cluster0-shard-00-00.n992qh5.mongodb.net:27017,cluster0-shard-00-01.n992qh5.mongodb.net:27017,cluster0-shard-00-02.n992qh5.mongodb.net:27017/urban_issues?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
