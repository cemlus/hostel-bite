import { asyncHandler } from '../utils/asyncHandler.js';
import { Vote } from '../models/vote.model.js';
import { ApiError } from '../utils/ApiError.js';
import { Product } from '../models/product.model.js';

/**
 * POST /api/products/:productId/vote
 * body: { vote: 1 or -1 }
 */
export const vote = asyncHandler(async (req, res) => {
    const productId = req.params.productId;
    const { vote } = req.body;
    if (![1, -1].includes(vote)) throw new ApiError(400, 'Invalid vote');

    // upsert
    const doc = await Vote.findOneAndUpdate(
        { user: req.user._id, product: productId },         // find the vote document for this exact user and this exact product
        { vote },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // optionally return aggregated score
    const agg = await Vote.aggregate([
        { $match: { product: doc.product } },           
        { $group: { _id: '$product', score: { $sum: '$vote' } } }           
    ]);

    const score = (agg[0] && agg[0].score) || 0;
    res.json({ data: { vote: doc, score } });
});
