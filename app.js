import 'dotenv/config'
import express from 'express'
const app = express()
const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI

import mongoose from 'mongoose';
import { validate as validateUuid } from 'uuid'

import World from './model/World.js'

app.use(express.json());

app.post('/review/:world', async (req, res) => {
    const { reviewer, rating, description } = req.body;
    if (!validateUuid(req.params.world)) {
        return res.status(400).json({ error: "Invalid UUID" })
    }
    try {
        let world = await World.findOne({ uuid: req.params.world });

        if (!world) {
            world = new World({
                uuid: req.params.world,
                description,
                ratings: [{ reviewer, rating }]
            });
        } else {
            world.description = description;

            const existing = world.ratings.find(r => r.reviewer === reviewer);

            if (existing) {
                existing.rating = rating;
            } else {
                world.ratings.push({ reviewer, rating });
            }
        }

        await world.save();

        return res.status(201).json({
            success: true,
            data: world
        });
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: e.message
        });
    }
})

const calculateAverage = (ratings) => {
    if (!ratings.length) return 0;
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return total / ratings.length;
}

app.get('/review/:world', async (req, res) => {
    if (!validateUuid(req.params.world)) {
        return res.status(400).json({ error: "Invalid UUID" })
    }
    try {
        const world = await World.findOne({ uuid: req.params.world });
        const averageRating = calculateAverage(world.ratings);
        res.status(200).json({
            uuid: world.uuid,
            rating: averageRating,
            ratings: world.ratings,
            description: world.description,
            createdAt: world.createdAt,
            updatedAt: world.updatedAt
        });
    } catch (e) {
        return res.status(400).json({
            message: e.message
        })
    }
})

app.get('/review', async (req, res) => {
    try {
        const worlds = await World.find({})
            .select('uuid ratings description createdAt updatedAt -_id') // remove meta fields
            .lean()
            .exec();

        const worldsWithAvg = worlds.map(world => ({
            ...world,
            rating: calculateAverage(world.ratings)
        }));

        res.status(200).json(worldsWithAvg);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
    mongoose.connect(`${MONGODB_URI}legitiratings`)
})
