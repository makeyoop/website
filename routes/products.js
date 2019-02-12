const express = require("express");
const router = express.Router();
const striptags = require('striptags');
const Product = require("../models/Product")
const User = require("../models/User")
const uploadCloud = require('../config/cloudinary.js');

router.get("/", (req, res, next) => {
  Product.find({})
    .then(products => {
      if (req.user != undefined){
        products = products.map(product => {
          const isFavorite = req.user.favorites.filter(favorite => {
            return favorite._id.equals(product._id) //comparamos un id con otro para ver si está en favoritos.
          }).length > 0;
          product.isFavorite = isFavorite; 
          return product;
        })
      }
      res.render("products/products", {"products": products});
    })
    .catch(err => {
      console.log("The error has occurred", err);
    });
});

router.get("/new", (req, res, next) => {
  let colorObj={
    arrayProp:[]
  }

  let tag = []
  Product.find({})
  .then(products => {
    products.forEach(item => {
      if(item.product_colors.length > 0){
        item.product_colors.forEach(colorsArray=>{
          actualObj={
            name:colorsArray.colour_name,
            hex:colorsArray.hex_value
          }
          colorObj.arrayProp.push(actualObj);
        })
      }
    })
    // products.forEach(item => {
    //   if(item.tag_list.length > 0){
    //     item.tag_list.forEach(tagArray => {
    //       tagArray.tag_list.push(tag)
    //       console.log(tag)
    //     })
    //   }
    // })

    console.log(colorObj)
    res.render("products/newproduct", {"colors":colorObj})
  })
})

router.post("/new", uploadCloud.single('photo'), (req, res, next) => {
  console.log('POST NEW')
  const { brand, name, price, description, category, product_type, tag_list, product_colors} = req.body;
  const image_link = req.file.url;
  const imgName = req.file.originalname;
  const newProduct = new Product({brand, name, price, image_link, description, category, product_type, tag_list, product_colors, image_link, imgName });
  console.log(newProduct)
    newProduct.save()
    .then((product) => {
      
      res.redirect("/products")
    })
    .catch((error) => {
      console.log(error)
  })
})

router.get("/favorite/add/:id", (req, res, next) => {
  const id = req.params.id;
  Product.findById(id)
    .then(product => {
      User.update( {_id: req.user._id}, 
      {$push: {favorites: product} })
      .then(() => {
        res.redirect(req.headers.referer) //actualiza la url de donde vienes.
      })
      .catch(err => {
        console.log("The error has occurred", err);
      });
    })
    .catch(err => {
      console.log("The error has occurred", err);
    });
})

router.get("/favorite/remove/:id", (req, res, next) => {
  const id = req.params.id;
  Product.findById(id)
    .then(product => {
      User.update( {_id: req.user._id}, 
      {$pull: {favorites: product} })
      .then(() => {
        res.redirect(req.headers.referer) //actualiza la url de donde vienes.
      })
      .catch(err => {
        console.log("The error has occurred", err);
      });
    })
    .catch(err => {
      console.log("The error has occurred", err);
    });
})

router.get("/:id", (req, res, next) => {
  const id = req.params.id;
  Product.findById(id)
    .then(product => {
      product.description = striptags(product.description) //Quitar etiquetas html a la descripción
      res.render("products/product-detail", {"product": product});
    })
    .catch(err => {
      console.log("The error has occurred", err);
    });
});

module.exports = router;

