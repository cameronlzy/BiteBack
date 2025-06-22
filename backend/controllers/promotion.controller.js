import * as promotionService from '../services/promotion.service.js';
import * as imageService from '../services/image.service.js';
import Promotion from '../models/promotion.model.js';
import { validatePromotion, validateSearch } from '../validators/promotion.validator.js';

export async function searchPromotions(req, res) {
    const { error } = validateSearch(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const { search, restaurants, page, limit, sortBy, order } = req.query;

    const filters = {
        search: search || null,
        restaurants: restaurants ? restaurants.split(',') : null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit): 8,
        sortBy: sortBy ? sortBy : 'endDate',
        order: order === 'desc' ? 'desc' : 'asc',
    };

    const { status, body } = await promotionService.searchPromotions(filters);
    return res.status(status).json(body);
};

export async function createPromotion(req, res) {
    const { error } = validatePromotion(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await promotionService.createPromotion(req.body);
    return res.status(status).json(body);
}

export async function addPromotionImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage || !bannerImage) {
        return res.status(400).send('Both mainImage and bannerImage are required.');
    }
    
    const [mainResult, bannerResult] = await Promise.all([
        imageService.addImage(Promotion, req.promotion._id, mainImage, 'mainImage'),
        imageService.addImage(Promotion, req.promotion._id, bannerImage, 'bannerImage'),
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).send(failed.body);
    
    return res.status(200).json({
        mainImage: mainResult.body.mainImage,
        bannerImage: bannerResult.body.bannerImage
    });
}

export async function updatePromotionImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage && !bannerImage) return res.status(400).send('Please provide at least one image');

    const updateOps = {};
    if (mainImage) updateOps.mainImage = mainImage;
    if (bannerImage) updateOps.bannerImage = bannerImage;

    const [mainResult, bannerResult] = await Promise.all([
      mainImage ? imageService.addImage(Promotion, req.promotion._id, mainImage, 'mainImage') : Promise.resolve(null),
      bannerImage ? imageService.addImage(Promotion, req.promotion._id, bannerImage, 'bannerImage') : Promise.resolve(null)
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).send(failed.body);

    const body = {};
    if (mainResult) body.mainImage = mainResult.body.mainImage;
    if (bannerResult) body.bannerImage = bannerResult.body.bannerImage;
    return res.status(200).json(body);
}