

module.exports = (sequelize, Sequelize, DataTypes) => {
    const comment = sequelize.define(
        "comment", // Model name
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            value: {
                type: DataTypes.STRING,
            },
            rate: {
                type: DataTypes.INTEGER,
            }
        }
    );

    return comment;
};
