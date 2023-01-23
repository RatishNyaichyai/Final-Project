const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErr = require("../middleware/catchAssyncError");
const apiFeatures = require("../utils/apifeatures")


//  Create Product ---Admin
exports.createProduct = catchAsyncErr(async (req, res, next) => {

    req.body.user = req.user.id;

    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    }
    )
})

//Get all product 
exports.getAllProduct = catchAsyncErr(async (req, res) => {
    const resultPerPage = 5;
    const productCount = await Product.countDocuments()

    const apiFeature = new apiFeatures(Product.find(), req.query).search().filter().pagination(resultPerPage)
    const products = await apiFeature.query;
    res.status(200).json({
        success: true,
        products,
        productCount

    })

})

// Get product detail

exports.getProductDetails = catchAsyncErr(async (req, res, next) => {

    const productId = req.params.id;
    let product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 500))
    }

    res.status(200).json({
        success: true,
        product,
        productCount

    })
})

//Update Product --Admin side

exports.updateProduct = catchAsyncErr(async (req, res, next) => {

    const productId = req.params.id;
    let product = await Product.findByIdAndUpdate(productId, req.body, {
        new: true,
        runValidators: true, useFindAndModify: false
    })
    if (!product) {
        return next(new ErrorHandler("Product not found", 500))
    }
    //console.log('id', productId)
    //console.log('update', product)
    res.status(200).json({
        success: true,
        product
    })

})


// Delete Product --Admin side

exports.deleteProduct = catchAsyncErr(async (req, res, next) => {

    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete({ _id: productId });
    if (!deletedProduct) {
        return res.status(500).json({
            success: false,
            message: "Product not deleted"
        })
    }
    res.status(200).json({
        success: true,
        message: "Product deleted."
    })
})

//Create New Review or Update the review
exports.createProductReview = catchAsyncErr(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());

    if (isReviewed) {
        product.reviews.forEach(rev => {
            if (rev.user.toString() === req.user._id.toString())
                rev.rating = rating,
                    rev.comment = comment
        })

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    })
})

//Get all review of a product
exports.getProductReviews = catchAsyncErr(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler('Product not found'), 404);
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews,
    })
})

//Delete Review
exports.deleteReview = catchAsyncErr(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler('Product not found'), 404);
    }

    const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString())

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    const ratings = avg / reviews.length;

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews,
    },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,

        })

    res.status(200).json({
        success: true,
    })

})