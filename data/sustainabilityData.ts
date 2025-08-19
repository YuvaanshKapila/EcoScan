import { SustainabilityItem, ScannedItem } from '@/types';

export const sustainabilityData: SustainabilityItem[] = [
  {
    id: '1',
    name: 'bottled water',
    category: 'beverages',
    score: 20,
    impact: 'high',
    alternatives: ['Reusable water bottle', 'Filtered tap water']
  },
  {
    id: '2',
    name: 'plastic bags',
    category: 'packaging',
    score: 10,
    impact: 'high',
    alternatives: ['Reusable cloth bags', 'Paper bags']
  },
  {
    id: '3',
    name: 'paper towels',
    category: 'household',
    score: 40,
    impact: 'medium',
    alternatives: ['Reusable cloth towels', 'Bamboo towels']
  },
  {
    id: '4',
    name: 'beef',
    category: 'meat',
    score: 15,
    impact: 'high',
    alternatives: ['Plant-based protein', 'Chicken', 'Tofu']
  },
  {
    id: '5',
    name: 'chicken',
    category: 'meat',
    score: 40,
    impact: 'medium',
    alternatives: ['Plant-based protein', 'Tofu', 'Beans']
  },
  {
    id: '6',
    name: 'almond milk',
    category: 'dairy alternatives',
    score: 60,
    impact: 'medium',
    alternatives: ['Oat milk', 'Soy milk']
  },
  {
    id: '7',
    name: 'dairy milk',
    category: 'dairy',
    score: 30,
    impact: 'high',
    alternatives: ['Oat milk', 'Soy milk', 'Almond milk']
  },
  {
    id: '8',
    name: 'bananas',
    category: 'produce',
    score: 85,
    impact: 'low',
    alternatives: []
  },
  {
    id: '9',
    name: 'apples',
    category: 'produce',
    score: 80,
    impact: 'low',
    alternatives: []
  },
  {
    id: '10',
    name: 'avocados',
    category: 'produce',
    score: 65,
    impact: 'medium',
    alternatives: ['Local seasonal fruits']
  },
  {
    id: '11',
    name: 'toilet paper',
    category: 'household',
    score: 35,
    impact: 'medium',
    alternatives: ['Recycled toilet paper', 'Bamboo toilet paper']
  },
  {
    id: '12',
    name: 'laundry detergent',
    category: 'household',
    score: 40,
    impact: 'medium',
    alternatives: ['Eco-friendly detergent', 'Detergent sheets']
  },
  {
    id: '13',
    name: 'dish soap',
    category: 'household',
    score: 45,
    impact: 'medium',
    alternatives: ['Eco-friendly dish soap', 'Solid dish soap']
  },
  {
    id: '14',
    name: 'aluminum foil',
    category: 'household',
    score: 30,
    impact: 'high',
    alternatives: ['Reusable silicone lids', 'Beeswax wraps']
  },
  {
    id: '15',
    name: 'plastic wrap',
    category: 'household',
    score: 15,
    impact: 'high',
    alternatives: ['Beeswax wraps', 'Silicone food covers']
  },
  {
    id: '16',
    name: 'coffee',
    category: 'beverages',
    score: 50,
    impact: 'medium',
    alternatives: ['Fair trade coffee', 'Shade-grown coffee']
  },
  {
    id: '17',
    name: 'tea bags',
    category: 'beverages',
    score: 55,
    impact: 'medium',
    alternatives: ['Loose leaf tea', 'Compostable tea bags']
  },
  {
    id: '18',
    name: 'rice',
    category: 'grains',
    score: 70,
    impact: 'low',
    alternatives: []
  },
  {
    id: '19',
    name: 'pasta',
    category: 'grains',
    score: 75,
    impact: 'low',
    alternatives: []
  },
  {
    id: '20',
    name: 'bread',
    category: 'bakery',
    score: 65,
    impact: 'medium',
    alternatives: ['Local bakery bread', 'Homemade bread']
  },
  {
    id: '21',
    name: 'eggs',
    category: 'dairy',
    score: 55,
    impact: 'medium',
    alternatives: ['Free-range eggs', 'Plant-based egg alternatives']
  },
  {
    id: '22',
    name: 'yogurt',
    category: 'dairy',
    score: 45,
    impact: 'medium',
    alternatives: ['Plant-based yogurt', 'Glass jar yogurt']
  },
  {
    id: '23',
    name: 'cheese',
    category: 'dairy',
    score: 25,
    impact: 'high',
    alternatives: ['Plant-based cheese', 'Nutritional yeast']
  },
  {
    id: '24',
    name: 'salmon',
    category: 'seafood',
    score: 50,
    impact: 'medium',
    alternatives: ['Sustainable certified seafood', 'Plant-based seafood']
  },
  {
    id: '25',
    name: 'tuna',
    category: 'seafood',
    score: 40,
    impact: 'medium',
    alternatives: ['Pole-caught tuna', 'Plant-based seafood']
  },
  {
    id: '26',
    name: 'shrimp',
    category: 'seafood',
    score: 20,
    impact: 'high',
    alternatives: ['Sustainable certified seafood', 'Plant-based seafood']
  },
  {
    id: '27',
    name: 'chocolate',
    category: 'snacks',
    score: 30,
    impact: 'high',
    alternatives: ['Fair trade chocolate', 'Organic chocolate']
  },
  {
    id: '28',
    name: 'chips',
    category: 'snacks',
    score: 25,
    impact: 'high',
    alternatives: ['Bulk snacks', 'Homemade snacks']
  },
  {
    id: '29',
    name: 'soda',
    category: 'beverages',
    score: 15,
    impact: 'high',
    alternatives: ['Sparkling water', 'Homemade beverages']
  },
  {
    id: '30',
    name: 'juice',
    category: 'beverages',
    score: 40,
    impact: 'medium',
    alternatives: ['Fresh squeezed juice', 'Whole fruits']
  },
];

export function calculateSustainabilityScore(items: string[]): { 
  matchedItems: ScannedItem[],
  totalScore: number 
} {
  
  const matchedItems: ScannedItem[] = [];
  let totalScore = 0;
  
  items.forEach(itemName => {

    const match = sustainabilityData.find(data => 
      itemName.toLowerCase().includes(data.name.toLowerCase()) ||
      data.name.toLowerCase().includes(itemName.toLowerCase())
    );
    
    if (match) {
      matchedItems.push({
        name: itemName,
        score: match.score,
        impact: match.impact,
        alternatives: match.alternatives
      });
      
      totalScore += match.score;
    }
  });
  
  if (matchedItems.length > 0) {
    totalScore = Math.round(totalScore / matchedItems.length);
  } else {
    totalScore = 50;
  }
  
  return {
    matchedItems,
    totalScore
  };
}