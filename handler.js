require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-size-variant', async (req, res) => {
  const { productId, width, height, material } = req.body;

  if (!productId || !width || !height || !material) {
    return res.status(400).send('Missing productId, or size, or material');
  }

  // Shopify API request headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
  };
  
  // Shopify API URL to get the product details
  const productUrl = `https://fdcca5-1e.myshopify.com/admin/api/2021-07/products/${productId}.json`;

  const size = `${width}x${height} in`;

  try {

    // Get the product details
    const productResponse = await axios.get(productUrl, { headers });
    const product = productResponse.data.product;

    // Search from existing variants
    const variant = product.variants.find(
      (variant) => variant.option2 === material && variant.option1 === size
    );

    let resultVariant;

    if (variant) {
      // If variant is found, return it
      resultVariant = variant;
    } else {      
      const defaultVariant = product.variants.find(v => v.option2 === material && v.option1 === "Default");

      if (!defaultVariant) {
        return res.status(404).send('Default variant not found');
      }

      const price = width * height / 144 * defaultVariant.price;

      // Shopify API URL to create a variant
      const variantUrl = `https://fdcca5-1e.myshopify.com/admin/api/2021-07/products/${productId}/variants.json`;

      // Shopify API request payload
      const payload = {
        variant: {
          price,
          inventory_management: null,
          option1: size,
          option2: material,
          barcode: 'tmp'
        },
      };

      // Make the request to Shopify API to create the variant
      const response = await axios.post(variantUrl, payload, { headers });
      resultVariant = response.data.variant;
    }
    // Send the response back to the client
    res.status(201).json(resultVariant);
  } catch (error) {
    console.error('Error creating size variant:', error);
    console.error(error.response.data.errors);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/delete-size-variant', async (req, res) => {
  const { variantId } = req.body;
  if (!variantId) {
    return res.status(400).json({ error: 'variantId is required' });
  }
  try {
    await deleteVariant(variantId);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting size variant:', error);
    res.status(500).json({ error: 'Error deleting size variant' });
  }
});

app.post('/order-complete', async (req, res) => {
  const order = req.body;
  // Iterate through line items and delete size variants
  const deletePromises = order.line_items.map(async item => {
    console.log('Processing variant: ', item.variant_id);
    const cropPreviewUrlProperty = item.properties.find(property => property.name === '_cropPreviewUrl');
    if (item.variant_id && cropPreviewUrlProperty) { 
      console.log('This is temp size variant. Deleting...');
      await deleteVariant(item.variant_id);
    }
  });

  // Wait for all delete operations to complete
  await Promise.all(deletePromises);
  res.status(200).send();
});

app.post('/delete-old-variants', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const response = await axios.get(`${process.env.SHOPIFY_STORE_URL}/admin/api/2021-07/variants.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
      },
      timeout: 120000
    });

    const oldVariants = response.data.variants.filter(variant => {
      const createdAt = new Date(variant.created_at);
      const barcode = variant.barcode;
      return createdAt < sevenDaysAgo && barcode == 'tmp';
    });

    console.log(oldVariants)
    const deletePromises = oldVariants.map(variant => deleteVariant(variant.id));
    await Promise.all(deletePromises);

    console.log(`Deleted ${oldVariants.length} old variants.`);
    res.status(200).send();
  } catch (error) {
    console.error('Error deleting old variants:', error);
    res.status(500).json({ error: 'Error deleting old variants.' });
  }
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

module.exports.createSizeVariant = serverless(app);
module.exports.deleteSizeVariant = serverless(app);
module.exports.orderComplete = serverless(app);
module.exports.deleteOldVariants = serverless(app);

const deleteVariant = async (variantId) => {
  try {
    await axios.delete(`${process.env.SHOPIFY_STORE_URL}/admin/api/2021-07/variants/${variantId}.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
      },
      timeout: 30000 // Set timeout to 30 seconds
    });
    console.log(`Variant ${variantId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting variant ${variantId}:`, error);
  }
};
