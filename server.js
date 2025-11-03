const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Catching uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const app = require('./app');

// Check for required environment variables
if (!process.env.DATABASE) {
  console.error('❌ ERROR: DATABASE environment variable is not set!');
  console.error('Please create a .env file with your database connection string.');
  console.error('See .env.example for reference.');
  process.exit(1);
}

if (!process.env.DATABASE_PASSWORD) {
  console.error('❌ ERROR: DATABASE_PASSWORD environment variable is not set!');
  console.error('Please set DATABASE_PASSWORD in your .env file.');
  process.exit(1);
}

// MongoDB database connection
const uri = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection Successful 🖐'));

// Create a server on 127.0.0.1:8000
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server started ${port} 🖐`);
});

// Handling Promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
