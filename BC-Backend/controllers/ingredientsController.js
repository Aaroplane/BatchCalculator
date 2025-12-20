const express = require('express')
const ingredientsController = express.Router()
require('dotenv').config()

const {} = require('../Queries/ingredientsQueries')


ingredientsController.use(express.json());
ingredientsController.use(cors());

ingredientsController.get('/',async (req, res) => {
    try {
        const getAllIngredients = await getAllUsers()
        if (getAllIngredients.length === 0) {
            return res.status(404).json({ message: "No users found." });
        }
        res.status(200).json(getAllIngredients);

    }catch(error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ error: "Failed to fetch all users." });
    }
    
})