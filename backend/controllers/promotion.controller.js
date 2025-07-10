import * as promotionService from '../services/promotion.service.js';
import { addImage, deleteImagesFromDocument } from '../services/image.service.js';
import Promotion from '../models/promotion.model.js';
import { validatePromotion, validateSearch, validatePatch, validateOwnerQuery } from '../validators/promotion.validator.js';
import { wrapError } from '../helpers/response.js';

export async function searchPromotions(req, res) {
    const { error } = validateSearch(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { search, page, limit, sortBy, order } = req.query;

    const filters = {
        search: search || null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit): 8,
        sortBy: sortBy ? sortBy : 'endDate',
        order: order === 'desc' ? 'desc' : 'asc',
    };

    const { status, body } = await promotionService.searchPromotions(filters);
    return res.status(status).json(body);
}

export async function getPromotionsByOwner(req, res) {
    const query = {
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 8),
        status: req.query.status,
    };

    const { error } = validateOwnerQuery(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status: httpStatus, body } = await promotionService.getPromotionsByOwner(req.user, query);
    return res.status(httpStatus).json(body);
}

export async function getPromotionById(req, res) {
    const { status, body } = await promotionService.getPromotionById(req.params.id);
    return res.status(status).json(body);
}

export async function createPromotion(req, res) {
    const { error } = validatePromotion(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await promotionService.createPromotion(req.user, req.body);
    return res.status(status).json(body);
}

export async function addPromotionImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage || !bannerImage) {
        return res.status(400).json(wrapError('Both mainImage and bannerImage are required.'));
    }
    
    const [mainResult, bannerResult] = await Promise.all([
        addImage(Promotion, req.promotion._id, mainImage, 'mainImage'),
        addImage(Promotion, req.promotion._id, bannerImage, 'bannerImage'),
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).json(failed.body);

    return res.status(200).json({
        mainImage: mainResult.body.mainImage,
        bannerImage: bannerResult.body.bannerImage
    });
}

export async function updatePromotionImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage && !bannerImage) return res.status(400).json(wrapError('Please provide at least one image'));

    const promotion = req.promotion;

    const deleteOldImages = [];
    if (mainImage && promotion.mainImage) {
        deleteOldImages.push(deleteImagesFromDocument(promotion, 'mainImage'));
    }
    if (bannerImage && promotion.bannerImage) {
        deleteOldImages.push(deleteImagesFromDocument(promotion, 'bannerImage'));
    }
    await Promise.all(deleteOldImages);

    const [mainResult, bannerResult] = await Promise.all([
        mainImage ? addImage(Promotion, promotion._id, mainImage, 'mainImage') : Promise.resolve(null),
        bannerImage ? addImage(Promotion, promotion._id, bannerImage, 'bannerImage') : Promise.resolve(null)
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).json(failed.body);

    const body = {};
    if (mainResult) body.mainImage = mainResult.body.mainImage;
    if (bannerResult) body.bannerImage = bannerResult.body.bannerImage;
    return res.status(200).json(body);
}

export async function updatePromotion(req, res) {
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await promotionService.updatePromotion(req.promotion, req.restaurant, req.body);
    return res.status(status).json(body);
}

export async function deletePromotion(req, res) {
    const { status, body } = await promotionService.deletePromotion(req.promotion);
    return res.status(status).json(body);
}