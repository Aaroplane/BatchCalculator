const {db} = require('../db/dbConfig.js')


const getAllIngredients = async() => {
    try {
        const allIngredients = await db.any("SELECT * FROM ingredients");
        console.log(allIngredients)
        return allIngredients;
    }catch (error) {
        return `Error fetching all users: ${error}`;
    }
};

module.exports = {getAllIngredients};