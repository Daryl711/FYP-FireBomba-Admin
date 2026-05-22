const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/auth', userRouter);

app.listen(PORT, () => {
    console.log(`FireBomba backend running on port ${PORT}`);
});
