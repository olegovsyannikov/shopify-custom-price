# shopify-custom-price

This project is a serverless application designed to manage custom price variants for products in a Shopify store. It provides endpoints to create and delete size variants and handle order completion events.

## Features

- **Create Size Variant**: Creates a new size variant for a product based on the provided dimensions and material.
- **Delete Size Variant**: Deletes a specified size variant.
- **Order Complete**: Handles order completion events and deletes size variants associated with the order.

## Prerequisites

- Node.js
- Serverless Framework
- Shopify Store with API access

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/shopify-custom-price.git
cd shopify-custom-price
```

2. Install dependencies:

   npm install

3. Create a `.env` file in the root directory and add your Shopify credentials:

```bash
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
SHOPIFY_STORE_URL=your_shopify_store_url
```

4. Deploy the service:

```bash
serverless deploy
```

## Endpoints

### Create Size Variant

- **URL**: `/create-size-variant`
- **Method**: `POST`
- **Description**: Creates a new size variant for a product.
- **Request Body**:

```bash
{
  "productId": "string",
  "width": "number",
  "height": "number",
  "material": "string"
}
```

- **Response**: Returns the created variant or the existing variant if it already exists.

### Delete Size Variant

- **URL**: `/delete-size-variant`
- **Method**: `POST`
- **Description**: Deletes a specified size variant.
- **Request Body**:

```bash
{
  "variantId": "string"
}
```

- **Response**: Returns a 204 status code on successful deletion.

### Order Complete

- **URL**: `/order-complete`
- **Method**: `POST`
- **Description**: Handles order completion events and deletes size variants associated with the order.
- **Request Body**: The order object from Shopify.
- **Response**: Returns a 200 status code on successful processing.

## Local Development

To run the service locally, use the following command:

```bash
serverless offline
```

This will start the service on `http://localhost:3000`.

## Use on a Storefront

This app is used in California Custom theme.

Look into theme files: `assets/california_custom.js` and `assets/california_custom.scss`

## License

This project is licensed under the MIT License.
