// pages/api/get-product-details.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { upc } = req.query;

  if (!upc) {
    return res.status(400).json({ error: 'UPC code is required' });
  }

  try {
      const productKnowledgeResponse = await fetch(`https://world.openfoodfacts.net/api/v2/product/${upc}?fields=knowledge_panels`);
  
      if (!productKnowledgeResponse.ok) {
        throw new Error('No product nutrition information available.');
      }
  
      const productKnowledgeData = await productKnowledgeResponse.json();

    res.status(200).json(productKnowledgeData);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details from OpenFoodFacts', Response});
  }
}
