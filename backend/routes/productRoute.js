const express = require("express");
const { getAllProduct, createProduct, updateProduct, deleteProduct, getProductDetails, createProductReview, getProductReviews, deleteReview } = require("../controllers/productController");

const { isAuthenticatedUser, authorizedRoles } = require('../middleware/auth')

const router = express.Router();


router.route("/products").get(getAllProduct)

// Add new product
router.route("/admin/products/new").post(isAuthenticatedUser, authorizedRoles('admin'), createProduct);

//  Get Product details
router.route("/products/:id").get(getProductDetails)

//  Updating product
router.route("/admin/products/:id").put(isAuthenticatedUser, authorizedRoles('admin'), updateProduct);

// Delete product
router.route("/admin/products/:id").delete(isAuthenticatedUser, authorizedRoles('admin'), deleteProduct);

// add/change Product Review
router.route('/review').put(isAuthenticatedUser, createProductReview);

// Get Product review
router.route('/reviews').get(getProductReviews);

// Delete Product review
router.route('/reviews').delete(isAuthenticatedUser, authorizedRoles('admin'), deleteReview);





module.exports = router;