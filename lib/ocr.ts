import { GoogleGenerativeAI } from '@google/generative-ai';

interface OCRResult {
  success: boolean;
  text?: string;
  items?: string[];
  storeName?: string;
  error?: string;
}

interface BarcodeAIResult {
  success: boolean;
  productName?: string;
  brand?: string;
  likelyCategory?: string;
  confidence?: number;
  error?: string;
}

const ai = new GoogleGenerativeAI("AIzaSyDalwIkVFjCgxl28h0THFblV6ejU5GBKwY");

export async function processReceiptImage(base64Image: string): Promise<OCRResult> {
  try {
    console.log('OCR: Starting Gemini Vision processing...');
    const hasDataUrl = base64Image.includes('base64,');
    const mimeMatch = hasDataUrl ? base64Image.match(/data:(.*?);base64,/) : null;
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
    const dataOnly = hasDataUrl ? base64Image.split('base64,')[1] : base64Image;
    console.log('OCR: Using mime type ->', mimeType);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this receipt image and extract product information. Please:

1. First, read all the text you can see in the receipt image
2. Then extract product information in this JSON format:
{
  "storeName": "Name of the store (if visible)",
  "items": ["Product 1", "Product 2", "Product 3"],
  "extractedText": "All text you can read from the receipt"
}

Rules for extraction:
- Extract ONLY actual product/item names that were purchased
- Clean up abbreviated names (e.g., "GRND BEEF 30% 2LB" → "Ground Beef")
- Ignore prices, totals, taxes, dates, receipt numbers, store addresses
- Focus on food, beverages, household goods, personal care, clothing, electronics
- Return clear, readable product names
- Include the raw text you extracted in "extractedText"
- If no clear products found, return: {"storeName": "", "items": [], "extractedText": ""}`;
    let responseText = '';
    try {
      const imagePart = { inlineData: { data: dataOnly, mimeType } } as const;
      console.log('OCR: Sending request to Gemini Vision...');
      const result = await model.generateContent([prompt, imagePart]);
      responseText = await result.response.text();
      console.log('OCR: Gemini Vision raw response ->', responseText);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('❌ Gemini Vision API call failed:', message);
      return { success: false, error: 'Gemini Vision request failed: ' + message };
    }
    if (!responseText) {
      return { success: false, error: 'Gemini returned no text' };
    }
    let parsed: unknown;
    try {
      const cleaned = responseText.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('❌ Gemini returned invalid JSON:', responseText);
      return { success: false, error: 'Gemini returned invalid JSON. Response was: ' + responseText };
    }
    const anyParsed = parsed as Record<string, unknown>;
    const rawItems = Array.isArray(anyParsed.items) ? anyParsed.items : [];
    const items = (rawItems as unknown[]).filter((item) => typeof item === 'string' && (item as string).length > 1) as string[];
    const extractedText = typeof anyParsed.extractedText === 'string' ? (anyParsed.extractedText as string) : responseText;
    const storeName = typeof anyParsed.storeName === 'string' && (anyParsed.storeName as string).length > 0 ? (anyParsed.storeName as string) : 'Unknown Store';
    return { success: true, text: extractedText, items: items.slice(0, 20), storeName };
  } catch (error: unknown) {
    console.error('❌ OCR processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process receipt image' };
  }
}

async function lookupOpenFoodFacts(code: string): Promise<BarcodeAIResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const status = (json.status as number) ?? 0;
    if (status !== 1) return null;
    const product = json.product as Record<string, unknown> | undefined;
    if (!product) return null;
    const productName = (product.product_name as string) ?? (product.generic_name as string) ?? '';
    const brand = (product.brands as string) ?? '';
    const categories = (product.categories as string) ?? '';
    const likelyCategory = categories.split(',').map((s) => s.trim()).filter((s) => s).slice(0, 1)[0] ?? '';
    const name = productName || '';
    if (!name) return null;
    return { success: true, productName: name, brand, likelyCategory, confidence: 0.95 };
  } catch (e) {
    console.log('OpenFoodFacts lookup error', e);
    return null;
  }
}

export async function identifyProductByBarcode(code: string, format: string): Promise<BarcodeAIResult> {
  try {
    const off = await lookupOpenFoodFacts(code);
    if (off) return off;
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a product identification assistant. Given a barcode value and format, infer the most likely retail product name.
Return ONLY valid JSON with fields: {"productName": string, "brand": string, "likelyCategory": string, "confidence": number}
If unknown, set productName to "Unknown Product", brand to "", likelyCategory to "", confidence to 0.

Input:
- Barcode: ${code}
- Format: ${format}

Rules:
- Prefer globally known brands/products associated with the barcode.
- Do not include marketing fluff, only the most likely canonical product name.
- confidence is 0-1.`;
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      success: true,
      productName: typeof parsed.productName === 'string' ? (parsed.productName as string) : 'Unknown Product',
      brand: typeof parsed.brand === 'string' ? (parsed.brand as string) : '',
      likelyCategory: typeof parsed.likelyCategory === 'string' ? (parsed.likelyCategory as string) : '',
      confidence: typeof parsed.confidence === 'number' ? (parsed.confidence as number) : 0,
    };
  } catch (error: unknown) {
    console.error('identifyProductByBarcode error', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to identify product' };
  }
}

export async function getSustainabilityFeedback(items: string[]): Promise<string> {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const safeItems = (items ?? []).filter((v) => typeof v === 'string' && v.trim().length > 0);
    const list = safeItems.length > 0 ? safeItems.join(', ') : 'Unknown product';
    const prompt = `
Analyze these grocery items for sustainability and provide eco-friendly alternatives:

Items: ${list}

Please provide:
1. A brief sustainability assessment
2. Specific eco-friendly alternatives for high-impact items
3. General tips for more sustainable shopping

Keep the response concise and actionable.
`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting sustainability feedback:', error);
    return 'Unable to generate sustainability feedback at this time.';
  }
}

export async function performOCR(base64Image: string): Promise<string> {
  const result = await processReceiptImage(base64Image);
  if (result.success && result.text) {
    return result.text;
  }
  throw new Error(result.error || 'OCR failed');
}

export function parseReceiptItems(text: string): string[] {
  const lines = text.split('\n');
  const potentialItems = lines.filter((line) => {
    const skipPatterns = [
      /total/i,
      /subtotal/i,
      /tax/i,
      /change/i,
      /cash/i,
      /credit/i,
      /debit/i,
      /card/i,
      /payment/i,
      /balance/i,
      /due/i,
      /^\s*$/,
      /^\d+\/\d+\/\d+/,
      /^\d+:\d+/,
      /thank you/i,
      /receipt/i,
      /store/i,
      /location/i,
      /address/i,
      /phone/i,
      /^\d+\.\d{2}$/,
    ];
    return !skipPatterns.some((pattern) => pattern.test(line));
  });
  return potentialItems
    .map((line) => {
      let itemName = line.replace(/\$?\d+\.\d{2}/g, '').trim();
      itemName = itemName.replace(/^\d+\s*[@x]\s*/i, '').trim();
      itemName = itemName.replace(/\s+\d+$/, '').trim();
      return itemName;
    })
    .filter((item) => item.length > 0);
}
