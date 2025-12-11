import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  console.log('User requested the home page website');
  res.send(`
    <body style="background:#0000ff; color:#fafafa">
      <h1>Hello World!</h1>
    </body>
    `);
});

export default app;
