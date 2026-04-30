import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ratingSchema = new Schema({
    reviewer: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 10 },
    review: { type: String, required: true },
}, { _id: false });

const worldSchema = new Schema({
    uuid: { type: String, required: true, unique: true },
    ratings: {
        type: [ratingSchema],
        required: true
    },
    description: { type: String, required: true },
}, {
    timestamps: true
});

const World = model('World', worldSchema);
export default World;
