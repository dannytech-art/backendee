'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Goods extends Model {
    static associate(models) {
      // ✅ Each Goods belongs to a User (the seller)
      Goods.belongsTo(models.User, { foreignKey: 'userId' });

      // ✅ Each Goods can appear in many Purchases
      Goods.hasMany(models.Purchase, { foreignKey: 'goodsId' });
    }
  }
  Goods.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL,
    stock: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Goods',
  });
  return Goods;
};
