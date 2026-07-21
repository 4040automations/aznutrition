"use client";
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { load } from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handler invoked');

  if (req.method === 'POST') {
    const { amazonLink } = req.body;
    // console.log('Received Amazon link:', amazonLink);

    try {
      const response = await axios.get(amazonLink);
      // console.log('Fetched Amazon page');
      const html = response.data;
      const $ = load(html);

      let upcCode: string | null = null;
      let product_title: string | null = null;
      let brand: string | null = null;
      let store: string | null = null;
      let flavor: string | null = null;

      $('#detailBullets_feature_div .a-list-item').each((index, element) => {
        const text = $(element).text();
        console.log('Detail bullet text:', text);

        if (text.includes('UPC')) {
          upcCode = $(element).find('span:last-child').text().trim();
          console.log('Found UPC code:', upcCode);
          return false; // break loop
        }
      });

      if (!upcCode) {
        $('#productDetails_techSpec_section_1 .prodDetSectionEntry').each((index, element) => {
          const text = $(element).text();
          console.log('Detail bullet text:', text);
  
          if (text.includes('UPC')) {
            upcCode = $(element).next('td').find('span').text().trim();
            console.log('Found UPC code:', upcCode);
            return false; // break loop
          }
        });
      }

      // Extract brand
      $('#productOverview_feature_div tr').each((index, element) => {
        const text = $(element).text().trim();
        if (text.includes('Brand')) {
          brand = $(element).find('.a-size-base.po-break-word').text().trim();
          console.log('Found brand:', brand);
          return false; // break loop
        }
      });

      store = $('#bylineInfo').text();
      store = store.replace(/Visit the /i, '').replace(/ Store$/i, '');
      console.log("found store: " + store);

      // Extract flavor
      $('#productOverview_feature_div tr').each((index, element) => {
        const text = $(element).text().trim();
        if (text.includes('Flavor')) {
          flavor = $(element).find('.a-size-base.po-break-word').text().trim();
          console.log('Found flavor:', flavor);
          return false; // break loop
        }
      });

      product_title = $('#productTitle').text();
      console.log("found product title: " + product_title);

      const data = {
        upcCode,
        product_title,
        brand,
        flavor,
        store
      };
    // Check if any of the values in the data object are non-null, non-undefined, or non-empty strings
    const hasData = Object.values(data).some(value => value !== null && value !== undefined && value !== '');

    if (hasData) {
        res.status(200).json(data);
      } else {
        console.log('UPC code and product name not found');
        res.status(404).json({ error: 'UPC code not found' });
      }
    } catch (error: any) {
      console.error('Error fetching Amazon link:', error.message);
      res.status(500).json({ error: 'Failed to fetch Amazon link' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
