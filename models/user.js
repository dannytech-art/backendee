'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // ✅ A User can own many Goods
      User.hasMany(models.Goods, { foreignKey: 'userId' });

      // ✅ A User can make many Purchases
      User.hasMany(models.Purchase, { foreignKey: 'userId' });
    }
  }
  User.init({
    fullName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    isVerified: DataTypes.BOOLEAN,
    verificationToken: DataTypes.STRING,
    verifiedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
