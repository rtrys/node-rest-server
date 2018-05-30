const express = require('express');
const logger = require('winston');

const Product = require('../models/product');
const { verifyToken } = require('../middlewares/auth');

const app = express();

app.get('/', [verifyToken], (req, res) => {

    logger.info('Get all product');

    let offset = Number(req.query.offset || 0);
    let limit = Number(req.query.limit || 5);

    Product.find({})
        .skip(offset)
        .limit(limit)
        .sort('name')
        .populate('user', 'name email')
        .populate('Category')
        .exec((err, products) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            return res.json({
                ok: true,
                payload: products
            });
        });
});

app.get('/:id', [verifyToken], (req, res) => {

    logger.info('Get single product');

    Product.findById(req.params.id)
        .populate('user', 'name email')
        .populate('category')
        .exec((err, product) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            if (!product) {
                return res.status(404).json({
                    ok: false,
                    err: { message: 'Product not found with that ID' }
                });
            }
            return res.json({
                ok: true,
                payload: product
            });
        });
});

app.get('/buscar/:search', [verifyToken], (req, res) => {

    logger.info('Find product by name');
    let regex = new RegExp(req.params.search, 'i');

    Product.find({ name: regex })
        .populate('user', 'name email')
        .populate('category')
        .exec((err, product) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            if (!product) {
                return res.status(404).json({
                    ok: false,
                    err: { message: 'Product not found' }
                });
            }
            return res.json({
                ok: true,
                product
            });
        });
});

app.post('/', [verifyToken], (req, res) => {

    logger.info('Post a new product');
    let product = new Product(req.body);
    product.user = req.user._id;
    let err = product.validateSync();

    if (err) {
        return res.status(400).json({
            ok: false,
            err
        });
    }

    product.save((err, savedProduct) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        return res.status(201).json({
            ok: true,
            payload: savedProduct
        });
    });

});

app.put('/:id', [verifyToken], (req, res) => {

    let { id } = req.params;
    let data = new Product(req.body);

    let err = data.validateSync();
    if (err) {
        return res.status(400).json({
            ok: false,
            err
        });
    }

    Product.findByIdAndUpdate(id, req.body, { new: true }, (err, updatedProduct) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!updatedProduct) {
            return res.status(404).json({
                ok: false,
                err: { message: 'Producto not found with that ID' }
            });
        }
        return res.json({
            ok: true,
            payload: updatedProduct
        });
    });
});

app.delete('/:id', [verifyToken], (req, res) => {

    Product.findOneAndRemove(req.params.id, (err, deletedProduct) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!deletedProduct) {
            return res.status(404).json({
                ok: false,
                err: { message: 'Producto not found with that ID' }
            });
        }
        return res.json({
            ok: true,
            payload: deletedProduct
        });
    });
});

module.exports = app;