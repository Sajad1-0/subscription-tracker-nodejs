import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the Subs tracking application');
});

app.listen(3000, () => {
  console.log('Subscription app running in http://localhost:3000 port');
});

export default app;
