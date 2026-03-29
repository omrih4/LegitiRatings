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
    if (!validateUuid(req.params.world)) {
        return res.status(400).json({ error: "Invalid UUID" })
    }
    try {
        const world = await World.create({
            uuid: req.params.world,
            rating: req.body.rating,
            description: req.body.description,
            reviewer: req.body.reviewer
        })

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

app.get('/review/:world', async (req, res) => {
    if (!validateUuid(req.params.world)) {
        return res.status(400).json({ error: "Invalid UUID" })
    }
    try {
        const world = await World.findOne({ uuid: req.params.world });
        res.status(200).json({
            uuid: world.uuid,
            rating: world.rating,
            description: world.description,
            reviewer: world.reviewer,
            createdAt: world.createdAt
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
            .select('uuid rating description reviewer createdAt -_id') // remove meta fields
            .lean()
            .exec();

        res.status(200).json(worlds);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
    mongoose.connect(`${MONGODB_URI}legitiratings`)
})
