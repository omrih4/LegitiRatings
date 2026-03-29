import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const worldSchema = new Schema({
    uuid: { type: String, required: true, unique: true },
    rating: { type: Number, required: true, min: 0, max: 10 },
    description: { type: String, required: true },
    reviewer: { type: String, required: true }
}, {
    timestamps: true
});

const World = model('World', worldSchema);
export default World;
