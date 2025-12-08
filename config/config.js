require('dotenv').config();

module.exports = {
  development: {
    username: process.env.user,
    password: process.env.password,
    database: process.env.database,
    host: "sql8.freesqldatabase.com",
    port: 3306, 
    dialect: "mysql",
    dialectOptions: {
      ssl: false   // 👈 disable SSL
    }
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql"
  }
};
