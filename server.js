const express = require('express')
const app = express()
const port = 2992
// const sequelize = require('./db/database')
app.use(express.json())


// const test = async ()=>{
//     try {
//   await sequelize.authenticate();
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

// }
// test();

app.listen(port,()=>{
    console.log(`app is running on port:${port}`);
    
})