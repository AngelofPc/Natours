const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! 💀 Shutting down 😥..');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

console.log(process.env.DATABASE_LOCAL);

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

//   START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('App running on port ' + port);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💀 Shutting down 😥');
  server.close(() => {
    process.exit(1);
  });
});
