import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ProductData {
  name: string;
  category: string;
  brand?: string;
  sustainabilityScore: number;
  impact: 'low' | 'medium' | 'high';
  carbonFootprint: number;
  waterUsage: number;
  packaging: 'minimal' | 'moderate' | 'excessive';
  alternatives: string[];
  reasons: string[];
  organic?: boolean;
  local?: boolean;
  seasonal?: boolean;
}

interface ReceiptData {
  storeName: string;
  address: string;
  date: string;
  time: string;
  total: number;
  subtotal: number;
  tax: number;
  items: ReceiptItem[];
  paymentMethod: string;
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  category: string;
  taxable: boolean;
  discount?: number;
}

interface SustainabilityMetrics {
  totalScore: number;
  averageScore: number;
  carbonFootprint: number;
  waterUsage: number;
  packagingWaste: number;
  itemBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  improvements: string[];
  alternatives: Array<{
    item: string;
    alternatives: string[];
    potentialSavings: number;
  }>;
}

const ai = new GoogleGenerativeAI("nope");

const COMPREHENSIVE_PRODUCT_DATABASE: Record<string, ProductData> = {
  'ground beef': {
    name: 'Ground Beef',
    category: 'meat',
    sustainabilityScore: 15,
    impact: 'high',
    carbonFootprint: 60.0,
    waterUsage: 1800,
    packaging: 'moderate',
    alternatives: ['lentils', 'black beans', 'mushrooms', 'plant-based ground'],
    reasons: ['high methane emissions', 'land use', 'water consumption']
  },
  'ribeye steak': {
    name: 'Ribeye Steak',
    category: 'meat',
    sustainabilityScore: 10,
    impact: 'high',
    carbonFootprint: 70.0,
    waterUsage: 2000,
    packaging: 'moderate',
    alternatives: ['portobello mushrooms', 'cauliflower steak'],
    reasons: ['extremely high carbon footprint', 'water intensive']
  },
  'chicken breast': {
    name: 'Chicken Breast',
    category: 'meat',
    sustainabilityScore: 50,
    impact: 'medium',
    carbonFootprint: 20.0,
    waterUsage: 500,
    packaging: 'moderate',
    alternatives: ['tofu', 'tempeh', 'seitan'],
    reasons: ['moderate emissions', 'feed conversion']
  },
  'salmon': {
    name: 'Salmon',
    category: 'seafood',
    sustainabilityScore: 45,
    impact: 'medium',
    carbonFootprint: 25.0,
    waterUsage: 300,
    packaging: 'moderate',
    alternatives: ['sustainable fish options', 'plant-based fish'],
    reasons: ['overfishing concerns', 'farm pollution']
  },
  'doritos': {
    name: 'Doritos',
    category: 'snacks',
    sustainabilityScore: 30,
    impact: 'high',
    carbonFootprint: 15.0,
    waterUsage: 200,
    packaging: 'excessive',
    alternatives: ['homemade baked chips', 'air-popped popcorn', 'roasted chickpeas'],
    reasons: ['excessive packaging', 'processed ingredients', 'palm oil']
  },
  'coca cola': {
    name: 'Coca Cola',
    category: 'beverages',
    sustainabilityScore: 25,
    impact: 'high',
    carbonFootprint: 12.0,
    waterUsage: 300,
    packaging: 'excessive',
    alternatives: ['sparkling water', 'homemade sodas', 'fruit-infused water'],
    reasons: ['plastic bottles', 'high sugar', 'water usage in production']
  },
  'paper towels': {
    name: 'Paper Towels',
    category: 'household',
    sustainabilityScore: 15,
    impact: 'high',
    carbonFootprint: 8.0,
    waterUsage: 150,
    packaging: 'moderate',
    alternatives: ['reusable cloths', 'bamboo towels', 'washable rags'],
    reasons: ['tree consumption', 'single-use waste']
  },
  'plastic bags': {
    name: 'Plastic Bags',
    category: 'household',
    sustainabilityScore: 5,
    impact: 'high',
    carbonFootprint: 6.0,
    waterUsage: 50,
    packaging: 'minimal',
    alternatives: ['reusable bags', 'paper bags', 'cloth bags'],
    reasons: ['ocean pollution', 'non-biodegradable']
  },
  'organic spinach': {
    name: 'Organic Spinach',
    category: 'vegetables',
    sustainabilityScore: 90,
    impact: 'low',
    carbonFootprint: 2.0,
    waterUsage: 30,
    packaging: 'minimal',
    alternatives: [],
    reasons: ['low emissions', 'organic farming'],
    organic: true
  },
  'bananas': {
    name: 'Bananas',
    category: 'fruits',
    sustainabilityScore: 75,
    impact: 'low',
    carbonFootprint: 1.5,
    waterUsage: 20,
    packaging: 'minimal',
    alternatives: [],
    reasons: ['efficient transport', 'natural packaging']
  },
  'avocados': {
    name: 'Avocados',
    category: 'fruits',
    sustainabilityScore: 35,
    impact: 'medium',
    carbonFootprint: 8.0,
    waterUsage: 280,
    packaging: 'minimal',
    alternatives: ['local seasonal fruits'],
    reasons: ['high water usage', 'transport emissions']
  },
  'almonds': {
    name: 'Almonds',
    category: 'nuts',
    sustainabilityScore: 40,
    impact: 'medium',
    carbonFootprint: 5.0,
    waterUsage: 500,
    packaging: 'moderate',
    alternatives: ['walnuts', 'sunflower seeds'],
    reasons: ['extremely high water usage', 'bee population impact']
  },
  'quinoa': {
    name: 'Quinoa',
    category: 'grains',
    sustainabilityScore: 75,
    impact: 'low',
    carbonFootprint: 3.0,
    waterUsage: 100,
    packaging: 'moderate',
    alternatives: [],
    reasons: ['complete protein', 'drought resistant']
  },
  'white bread': {
    name: 'White Bread',
    category: 'bakery',
    sustainabilityScore: 55,
    impact: 'medium',
    carbonFootprint: 8.0,
    waterUsage: 120,
    packaging: 'moderate',
    alternatives: ['whole grain bread', 'sourdough'],
    reasons: ['processing', 'preservatives']
  },
  'cheese': {
    name: 'Cheese',
    category: 'dairy',
    sustainabilityScore: 30,
    impact: 'high',
    carbonFootprint: 45.0,
    waterUsage: 800,
    packaging: 'moderate',
    alternatives: ['plant-based cheese', 'nutritional yeast'],
    reasons: ['dairy emissions', 'processing']
  },
  'oat milk': {
    name: 'Oat Milk',
    category: 'dairy alternatives',
    sustainabilityScore: 80,
    impact: 'low',
    carbonFootprint: 3.0,
    waterUsage: 40,
    packaging: 'moderate',
    alternatives: [],
    reasons: ['low water usage', 'plant-based']
  }
};

const BARCODE_DATABASE: Record<string, string> = {
  '012000001017': 'coca cola',
  '028400064316': 'doritos',
  '041220576463': 'ground beef',
  '041303001202': 'chicken breast',
  '041789000393': 'white bread',
  '020132706030': 'bananas',
  '033383401027': 'paper towels',
  '041303045547': 'cheese'
};

const STORE_PATTERNS = [
  { pattern: /walmart/i, name: 'Walmart' },
  { pattern: /target/i, name: 'Target' },
  { pattern: /kroger/i, name: 'Kroger' },
  { pattern: /safeway/i, name: 'Safeway' },
  { pattern: /whole foods/i, name: 'Whole Foods Market' },
  { pattern: /trader joe/i, name: "Trader Joe's" },
  { pattern: /costco/i, name: 'Costco' },
  { pattern: /publix/i, name: 'Publix' }
];

const PRODUCT_ALIASES = {
  'grnd beef': 'ground beef',
  'grd beef': 'ground beef',
  'hamburger': 'ground beef',
  'ground chuck': 'ground beef',
  'chk breast': 'chicken breast',
  'chicken brt': 'chicken breast',
  'chkn breast': 'chicken breast',
  'org spinach': 'organic spinach',
  'baby spinach': 'organic spinach',
  'wht bread': 'white bread',
  'wonder bread': 'white bread',
  'pepsi cola': 'coca cola',
  'coke': 'coca cola',
  'diet coke': 'coca cola'
};

const CATEGORY_KEYWORDS = {
  meat: ['beef', 'chicken', 'pork', 'lamb', 'turkey', 'ham', 'bacon', 'sausage'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  vegetables: ['spinach', 'carrot', 'broccoli', 'potato', 'tomato', 'onion'],
  fruits: ['apple', 'banana', 'orange', 'grapes', 'strawberry'],
  grains: ['bread', 'rice', 'pasta', 'quinoa', 'oats'],
  snacks: ['chips', 'crackers', 'cookies', 'candy'],
  beverages: ['soda', 'juice', 'water', 'coffee', 'tea'],
  household: ['paper towels', 'toilet paper', 'detergent', 'soap']
};

const ORGANIC_KEYWORDS = ['organic', 'org', 'natural', 'grass-fed', 'free-range'];
const LOCAL_KEYWORDS = ['local', 'farm fresh', 'regional'];
const PROCESSED_KEYWORDS = ['instant', 'frozen', 'canned', 'packaged', 'processed'];

function cleanReceiptText(rawText: string): string {
  return rawText
    .replace(/[^\w\s$.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractReceiptMetadata(text: string): Partial<ReceiptData> {
  const lines = text.split('\n').map(line => line.trim());
  const metadata: Partial<ReceiptData> = {
    items: []
  };
  
  for (const line of lines) {
    if (!metadata.storeName) {
      for (const store of STORE_PATTERNS) {
        if (store.pattern.test(line)) {
          metadata.storeName = store.name;
          break;
        }
      }
    }
    
    const dateMatch = line.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
    if (dateMatch && !metadata.date) {
      metadata.date = dateMatch[0];
    }
    
    const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch && !metadata.time) {
      metadata.time = timeMatch[0];
    }
    
    const totalMatch = line.match(/total[:\s]*\$?(\d+\.\d{2})/i);
    if (totalMatch) {
      metadata.total = parseFloat(totalMatch[1]);
    }
    
    const subtotalMatch = line.match(/subtotal[:\s]*\$?(\d+\.\d{2})/i);
    if (subtotalMatch) {
      metadata.subtotal = parseFloat(subtotalMatch[1]);
    }
    
    const taxMatch = line.match(/tax[:\s]*\$?(\d+\.\d{2})/i);
    if (taxMatch) {
      metadata.tax = parseFloat(taxMatch[1]);
    }
  }
  
  return metadata;
}

function parseReceiptItemsToReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n').map(line => line.trim());
  const items: ReceiptItem[] = [];
  
  const skipPatterns = [
    /^total/i, /^subtotal/i, /^tax/i, /^change/i, /^cash/i,
    /^credit/i, /^debit/i, /^card/i, /^payment/i, /^balance/i,
    /^due/i, /^\d+\/\d+\/\d+/, /^\d+:\d+/, /thank you/i,
    /receipt/i, /store/i, /location/i, /address/i, /phone/i,
    /^\$?\d+\.\d{2}$/, /visa/i, /mastercard/i, /approval/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (skipPatterns.some(pattern => pattern.test(line))) continue;
    
    const itemMatch = line.match(/^(.+?)\s+\$?(\d+\.\d{2})$/);
    if (itemMatch) {
      const [, itemText, priceStr] = itemMatch;
      const price = parseFloat(priceStr);
      
      const qtyMatch = itemText.match(/^(\d+)\s*[@x]\s*(.+)/i);
      let name: string;
      let quantity: number;
      
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1]);
        name = qtyMatch[2].trim();
      } else {
        quantity = 1;
        name = itemText.trim();
      }
      
      const cleanedName = cleanItemName(name);
      const category = categorizeProduct(cleanedName);
      
      items.push({
        name: cleanedName,
        price: price,
        quantity: quantity,
        unitPrice: price / quantity,
        category: category,
        taxable: !isNonTaxableCategory(category)
      });
    }
  }
  
  return items;
}

function cleanItemName(name: string): string {
  let cleaned = name
    .replace(/\d+\s*(lb|oz|kg|g)\b/gi, '')
    .replace(/\b\d+%\b/g, '')
    .replace(/[#*&%$@!]/g, '')
    .trim();
  
  const replacements = {
    'GRND': 'Ground',
    'GRD': 'Ground',
    'BEEF': 'Beef',
    'CHK': 'Chicken',
    'CHKN': 'Chicken',
    'POT': 'Potato',
    'TOMS': 'Tomatoes',
    'ORG': 'Organic'
  };
  
  for (const [abbr, full] of Object.entries(replacements)) {
    cleaned = cleaned.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  
  return cleaned;
}

function categorizeProduct(productName: string): string {
  const lower = productName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'other';
}

function isNonTaxableCategory(category: string): boolean {
  const nonTaxableCategories = ['vegetables', 'fruits', 'meat', 'dairy'];
  return nonTaxableCategories.includes(category);
}

function calculateSustainabilityScore(productName: string): ProductData {
  const normalizedName = productName.toLowerCase().trim();
  const aliasedName = (PRODUCT_ALIASES as Record<string, string>)[normalizedName] || normalizedName;
  
  for (const [key, data] of Object.entries(COMPREHENSIVE_PRODUCT_DATABASE)) {
    if (aliasedName.includes(key) || key.includes(aliasedName)) {
      return { ...data };
    }
  }
  
  const estimatedData = estimateProductSustainability(productName);
  return estimatedData;
}

function estimateProductSustainability(productName: string): ProductData {
  const lower = productName.toLowerCase();
  let score = 50;
  let impact: 'low' | 'medium' | 'high' = 'medium';
  let carbonFootprint = 10.0;
  let waterUsage = 100;
  let packaging: 'minimal' | 'moderate' | 'excessive' = 'moderate';
  const alternatives: string[] = [];
  const reasons: string[] = [];
  
  if (ORGANIC_KEYWORDS.some(keyword => lower.includes(keyword))) {
    score += 20;
    reasons.push('organic production');
  }
  
  if (LOCAL_KEYWORDS.some(keyword => lower.includes(keyword))) {
    score += 15;
    reasons.push('local sourcing');
  }
  
  if (PROCESSED_KEYWORDS.some(keyword => lower.includes(keyword))) {
    score -= 15;
    carbonFootprint += 5;
    reasons.push('processed ingredients');
  }
  
  const category = categorizeProduct(productName);
  
  switch (category) {
    case 'meat':
      score = Math.max(10, score - 30);
      impact = 'high';
      carbonFootprint += 30;
      waterUsage += 500;
      alternatives.push('plant-based proteins', 'legumes');
      reasons.push('livestock emissions');
      break;
    
    case 'dairy':
      score = Math.max(20, score - 20);
      impact = 'high';
      carbonFootprint += 20;
      waterUsage += 300;
      alternatives.push('plant-based alternatives');
      reasons.push('dairy farming emissions');
      break;
    
    case 'vegetables':
      score = Math.min(90, score + 20);
      impact = 'low';
      carbonFootprint = Math.max(1, carbonFootprint - 8);
      waterUsage = Math.max(10, waterUsage - 50);
      packaging = 'minimal';
      reasons.push('low environmental impact');
      break;
    
    case 'fruits':
      score = Math.min(85, score + 15);
      impact = 'low';
      carbonFootprint = Math.max(1, carbonFootprint - 6);
      waterUsage = Math.max(15, waterUsage - 30);
      packaging = 'minimal';
      reasons.push('natural packaging', 'renewable resource');
      break;
    
    case 'snacks':
      score = Math.max(20, score - 25);
      impact = 'high';
      carbonFootprint += 10;
      packaging = 'excessive';
      alternatives.push('homemade alternatives', 'fresh fruits');
      reasons.push('excessive packaging', 'processed ingredients');
      break;
    
    case 'beverages':
      if (lower.includes('soda') || lower.includes('cola')) {
        score = Math.max(15, score - 35);
        impact = 'high';
        packaging = 'excessive';
        alternatives.push('water', 'homemade drinks');
        reasons.push('plastic waste', 'high sugar content');
      }
      break;
  }
  
  if (score >= 70) impact = 'low';
  else if (score >= 40) impact = 'medium';
  else impact = 'high';
  
  return {
    name: productName,
    category,
    sustainabilityScore: score,
    impact,
    carbonFootprint,
    waterUsage,
    packaging,
    alternatives,
    reasons: reasons.length > 0 ? reasons : ['general environmental considerations']
  };
}

function calculateOverallSustainabilityMetrics(items: string[]): SustainabilityMetrics {
  const productData = items.map(item => calculateSustainabilityScore(item));
  
  const totalScore = productData.reduce((sum, data) => sum + data.sustainabilityScore, 0);
  const averageScore = totalScore / productData.length;
  
  const carbonFootprint = productData.reduce((sum, data) => sum + data.carbonFootprint, 0);
  const waterUsage = productData.reduce((sum, data) => sum + data.waterUsage, 0);
  
  let packagingWaste = 0;
  productData.forEach(data => {
    switch (data.packaging) {
      case 'excessive': packagingWaste += 3; break;
      case 'moderate': packagingWaste += 2; break;
      case 'minimal': packagingWaste += 1; break;
    }
  });
  
  const itemBreakdown = {
    high: productData.filter(d => d.impact === 'high').length,
    medium: productData.filter(d => d.impact === 'medium').length,
    low: productData.filter(d => d.impact === 'low').length
  };
  
  const improvements: string[] = [];
  const alternatives: Array<{ item: string; alternatives: string[]; potentialSavings: number }> = [];
  
  productData.forEach(data => {
    if (data.impact === 'high' && data.alternatives.length > 0) {
      alternatives.push({
        item: data.name,
        alternatives: data.alternatives,
        potentialSavings: 100 - data.sustainabilityScore
      });
    }
  });
  
  if (itemBreakdown.high > 0) {
    improvements.push('Consider plant-based alternatives for high-impact items');
  }
  if (packagingWaste > items.length * 2) {
    improvements.push('Choose products with minimal packaging');
  }
  if (carbonFootprint > items.length * 15) {
    improvements.push('Focus on local and seasonal products');
  }
  
  return {
    totalScore,
    averageScore,
    carbonFootprint,
    waterUsage,
    packagingWaste,
    itemBreakdown,
    improvements,
    alternatives
  };
}

function formatSustainabilityFeedback(metrics: SustainabilityMetrics, items: string[]): string {
  let feedback = '**Sustainability Assessment:**\n\n';
  
  feedback += `Overall Score: ${Math.round(metrics.averageScore)}/100\n`;
  feedback += `Carbon Footprint: ${metrics.carbonFootprint.toFixed(1)} kg CO2\n`;
  feedback += `Water Usage: ${metrics.waterUsage} liters\n\n`;
  
  if (metrics.itemBreakdown.high > 0) {
    feedback += `**High Impact Items (${metrics.itemBreakdown.high}):** `;
    const highImpactItems = items.filter(item => {
      const data = calculateSustainabilityScore(item);
      return data.impact === 'high';
    });
    feedback += highImpactItems.join(', ') + '\n\n';
  }
  
  if (metrics.alternatives.length > 0) {
    feedback += '**Eco-Friendly Alternatives:**\n';
    metrics.alternatives.forEach(alt => {
      feedback += `• **${alt.item}:** ${alt.alternatives.join(', ')}\n`;
    });
    feedback += '\n';
  }
  
  feedback += '**Improvement Recommendations:**\n';
  metrics.improvements.forEach(improvement => {
    feedback += `• ${improvement}\n`;
  });
  
  feedback += '\n**General Tips for Sustainable Shopping:**\n';
  feedback += '• **Buy in bulk:** Reduces packaging waste\n';
  feedback += '• **Choose minimally packaged items:** Look for items with little to no packaging\n';
  feedback += '• **Buy local and seasonal produce:** Reduces transportation emissions\n';
  feedback += '• **Reduce meat consumption:** Opt for plant-based protein sources more often\n';
  feedback += '• **Plan meals:** Reduces food waste\n';
  feedback += '• **Choose reusable bags and containers:** Skip single-use plastics\n';
  feedback += '• **Support sustainable brands:** Look for certifications (e.g., organic, fair trade)\n';
  feedback += '• **Compost food scraps:** Reduces landfill waste\n\n';
  
  feedback += 'By focusing on these changes, you can significantly reduce your grocery\'s environmental footprint.';
  
  return feedback;
}

async function fallbackAIProcessing(base64Image: string): Promise<string> {
  try {
    const hasDataUrl = base64Image.includes('base64,');
    const mimeType = hasDataUrl ? (base64Image.match(/data:(.*?);base64,/)?.[1] ?? 'image/jpeg') : 'image/jpeg';
    const dataOnly = hasDataUrl ? base64Image.split('base64,')[1] : base64Image;

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = 'Extract only the readable text from this receipt image. Return raw text only.';

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: dataOnly, mimeType } }
    ]);

    return await result.response.text() || '';
  } catch (error) {
    console.error('AI fallback failed:', error);
    return '';
  }
}

export async function processReceiptImage(base64Image: string): Promise<OCRResult> {
  try {
    console.log('OCR: Starting Gemini Vision processing...');
    const hasDataUrl = base64Image.includes('base64,');
    const mimeMatch = hasDataUrl ? base64Image.match(/data:(.*?);base64,/) : null;
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
    const dataOnly = hasDataUrl ? base64Image.split('base64,')[1] : base64Image;
    console.log('OCR: Using mime type ->', mimeType);

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

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }, { inlineData: { data: dataOnly, mimeType } }]
      }]
    };

    let responseText = '';
    try {
      console.log('OCR: Sending request to Gemini Vision...');
      const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDalwIkVFjCgxl28h0THFblV6ejU5GBKwY`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!result.ok) {
        const errorData = await result.json().catch(() => ({}));
        throw new Error(`API request failed: ${result.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await result.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
        throw new Error("Invalid response format from Gemini API.");
      }
      responseText = data.candidates[0].content.parts[0].text;
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
    
    return { 
      success: true, 
      text: extractedText, 
      items: items.slice(0, 20), 
      storeName: storeName 
    };
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
    
    return {
      success: true,
      productName: name,
      brand,
      likelyCategory,
      confidence: 0.95
    };
  } catch (e) {
    console.log('OpenFoodFacts lookup error', e);
    return null;
  }
}

function lookupBarcodeLocally(code: string): string | null {
  return BARCODE_DATABASE[code] || null;
}

export async function identifyProductByBarcode(code: string, format: string): Promise<BarcodeAIResult> {
  try {
    const localProduct = lookupBarcodeLocally(code);
    if (localProduct) {
      const productData = calculateSustainabilityScore(localProduct);
      return {
        success: true,
        productName: productData.name,
        brand: productData.brand || '',
        likelyCategory: productData.category,
        confidence: 0.9
      };
    }
    
    const off = await lookupOpenFoodFacts(code);
    if (off) return off;
    
    const commonPrefixes = {
      '0': 'US/Canada',
      '1': 'US/Canada',
      '2': 'Local store',
      '3': 'Pharmaceuticals',
      '4': 'Local products',
      '5': 'Coupons',
      '6': 'Local products',
      '7': 'Local products',
      '8': 'Local products',
      '9': 'Local products'
    };
    
    const prefix = code.substring(0, 1);
    const region = (commonPrefixes as Record<string, string>)[prefix] || 'Unknown';
    
    if (code.length === 12 || code.length === 13) {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Identify this ${format} barcode: ${code} (region: ${region}). Return only: {"productName": "name", "brand": "brand", "likelyCategory": "category", "confidence": 0.8}`;
      
      try {
        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        
        return {
          success: true,
          productName: typeof parsed.productName === 'string' ? (parsed.productName as string) : 'Unknown Product',
          brand: typeof parsed.brand === 'string' ? (parsed.brand as string) : '',
          likelyCategory: typeof parsed.likelyCategory === 'string' ? (parsed.likelyCategory as string) : '',
          confidence: typeof parsed.confidence === 'number' ? (parsed.confidence as number) : 0.3,
        };
      } catch {
        return {
          success: true,
          productName: 'Unknown Product',
          brand: '',
          likelyCategory: 'unknown',
          confidence: 0.1
        };
      }
    }
    
    return {
      success: true,
      productName: 'Unknown Product',
      brand: '',
      likelyCategory: 'unknown',
      confidence: 0.1
    };
  } catch (error: unknown) {
    console.error('identifyProductByBarcode error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to identify product'
    };
  }
}

export async function getSustainabilityFeedback(items: string[]): Promise<string> {
  try {
    const safeItems = (items ?? []).filter((v) => typeof v === 'string' && v.trim().length > 0);
    
    if (safeItems.length === 0) {
      return 'Unable to analyze sustainability - no items detected. Please ensure the receipt is clear and try again.';
    }
    
    const metrics = calculateOverallSustainabilityMetrics(safeItems);
    const formattedFeedback = formatSustainabilityFeedback(metrics, safeItems);
    
    if (metrics.averageScore < 30) {
      const aiSuggestions = await getAIEnhancedSuggestions(safeItems);
      return formattedFeedback + '\n\n' + aiSuggestions;
    }
    
    return formattedFeedback;
  } catch (error) {
    console.error('Error getting sustainability feedback:', error);
    return 'Unable to generate sustainability feedback at this time. Please try again.';
  }
}

async function getAIEnhancedSuggestions(items: string[]): Promise<string> {
  try {
    const unknownItems = items.filter(item => {
      const data = calculateSustainabilityScore(item);
      return data.reasons.includes('general environmental considerations');
    });
    
    if (unknownItems.length === 0) return '';
    
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Provide specific eco-friendly alternatives for these grocery items: ${unknownItems.join(', ')}. 
Focus on practical, actionable suggestions. Format as:
**Additional Suggestions:**
• Item: alternative1, alternative2
Keep it concise and practical.`;
    
    const result = await model.generateContent(prompt);
    return await result.response.text() || '';
  } catch (error) {
    console.error('AI enhanced suggestions failed:', error);
    return '';
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
  const receiptItems = parseReceiptItemsToReceiptItems(text);
  return receiptItems.map(item => item.name);
}

function validateReceiptData(data: Partial<ReceiptData>): string[] {
  const errors: string[] = [];
  
  if (!data.total || data.total <= 0) {
    errors.push('Invalid total amount');
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('No items found in receipt');
  }
  
  if (data.subtotal && data.tax && Math.abs((data.subtotal + data.tax) - (data.total || 0)) > 0.02) {
    errors.push('Receipt totals do not match');
  }
  
  return errors;
}

async function cacheProductData(productName: string, data: ProductData): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem('productCache');
    const cache = cached ? JSON.parse(cached) : {};
    cache[productName.toLowerCase()] = data;
    await AsyncStorage.setItem('productCache', JSON.stringify(cache));
  } catch (error) {
    console.log('Cache storage failed:', error);
  }
}

async function getCachedProductData(productName: string): Promise<ProductData | null> {
  try {
    const cached = await AsyncStorage.getItem('productCache');
    if (!cached) return null;
    const cache = JSON.parse(cached);
    return cache[productName.toLowerCase()] || null;
  } catch (error) {
    console.log('Cache retrieval failed:', error);
    return null;
  }
}

async function logScanSession(items: string[], metrics: SustainabilityMetrics): Promise<void> {
  try {
    const session = {
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      averageScore: metrics.averageScore,
      carbonFootprint: metrics.carbonFootprint,
      waterUsage: metrics.waterUsage,
      items: items
    };
    
    const logs = await AsyncStorage.getItem('scanLogs');
    const logHistory = logs ? JSON.parse(logs) : [];
    logHistory.push(session);
    
    if (logHistory.length > 100) {
      logHistory.shift();
    }
    
    await AsyncStorage.setItem('scanLogs', JSON.stringify(logHistory));
  } catch (error) {
    console.log('Logging failed:', error);
  }
}

async function analyzeTrends(items: string[]): Promise<string> {
  try {
    const logs = await AsyncStorage.getItem('scanLogs');
    if (!logs) return '';
    
    const logHistory = JSON.parse(logs);
    if (logHistory.length < 2) return '';
    
    const recent = logHistory.slice(-5);
    const avgScores = recent.map((log: any) => log.averageScore);
    const trend = avgScores[avgScores.length - 1] - avgScores[0];
    
    if (trend > 10) {
      return '\n**Progress Update:** Your sustainability choices are improving! Keep up the great work.';
    } else if (trend < -10) {
      return '\n**Progress Update:** Consider reviewing your recent choices to maintain your sustainability goals.';
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

export function getProductRecommendations(category: string): string[] {
  const recommendations: Record<string, string[]> = {
    meat: [
      'Choose grass-fed and organic options',
      'Consider plant-based proteins 2-3 times per week',
      'Buy from local farms when possible',
      'Look for humane certification labels'
    ],
    dairy: [
      'Try plant-based milk alternatives',
      'Choose organic dairy products',
      'Buy from local dairies',
      'Consider reducing portion sizes'
    ],
    snacks: [
      'Make homemade alternatives',
      'Choose bulk bins over packaged',
      'Look for minimal packaging',
      'Support brands with sustainable practices'
    ],
    beverages: [
      'Use reusable water bottles',
      'Make drinks at home',
      'Choose glass over plastic containers',
      'Support local beverage companies'
    ],
    vegetables: [
      'Buy seasonal and local produce',
      'Choose organic when possible',
      'Shop at farmers markets',
      'Consider growing your own herbs'
    ],
    fruits: [
      'Buy local and in-season fruits',
      'Choose loose fruits over packaged',
      'Support organic farming',
      'Preserve seasonal fruits for later'
    ]
  };
  
  return recommendations[category] || [
    'Research sustainable brands in this category',
    'Look for minimal packaging options',
    'Consider local alternatives',
    'Check for certification labels'
  ];
}

export async function calculateCarbonFootprintTrend(): Promise<number> {
  try {
    const logs = await AsyncStorage.getItem('scanLogs');
    if (!logs) return 0;
    
    const logHistory = JSON.parse(logs);
    if (logHistory.length < 2) return 0;
    
    const recent = logHistory.slice(-10);
    const footprints = recent.map((log: any) => log.carbonFootprint);
    
    const oldAvg = footprints.slice(0, Math.floor(footprints.length / 2)).reduce((a: number, b: number) => a + b, 0) / Math.floor(footprints.length / 2);
    const newAvg = footprints.slice(Math.floor(footprints.length / 2)).reduce((a: number, b: number) => a + b, 0) / Math.ceil(footprints.length / 2);
    
    return ((newAvg - oldAvg) / oldAvg) * 100;
  } catch (error) {
    return 0;
  }
}

export async function exportSustainabilityReport(): Promise<string> {
  try {
    const logs = await AsyncStorage.getItem('scanLogs');
    if (!logs) return 'No data available for report';
    
    const logHistory = JSON.parse(logs);
    const totalScans = logHistory.length;
    const avgScore = logHistory.reduce((sum: number, log: any) => sum + log.averageScore, 0) / totalScans;
    const totalCarbonSaved = logHistory.reduce((sum: number, log: any) => sum + (50 - log.carbonFootprint), 0);
    
    return `Sustainability Report
Total Scans: ${totalScans}
Average Sustainability Score: ${avgScore.toFixed(1)}/100
Estimated Carbon Saved: ${totalCarbonSaved.toFixed(1)} kg CO2
Last Scan: ${new Date(logHistory[logHistory.length - 1].timestamp).toLocaleDateString()}`;
  } catch (error) {
    return 'Error generating report';
  }
}
