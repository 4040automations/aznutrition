// pages/api/get-product-details.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { upc } = req.query;

  if (!upc) {
    return res.status(400).json({ error: 'UPC code is required' });
  }

  try {
      const productResponse = await fetch(`https://world.openfoodfacts.net/api/v2/product/${upc}`);
  
      if (!productResponse.ok) {
        throw new Error('No product nutrition information available.');
      }
  
      const productData = await productResponse.json();

    res.status(200).json(productData);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details from OpenFoodFacts', Response});
  }
}
