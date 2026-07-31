export interface Product {
  id: string;
  name: string;
  image: string;
  images?: string[];
  price: number;
  category: string;
  brand: string;
  rating: number;
  description: string;
  sizes?: string[];
  sizeOptions?: ProductSizeOption[];
  colors?: string[];
  salesCount?: number;
  variantId?: string;
  variants?: ProductVariant[];
}

export interface ProductSizeOption {
  value: string;
  available: boolean;
  inventoryQuantity: number;
  variantId?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  available: boolean;
  inventoryQuantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Oversized Heavyweight T-Shirt in Black",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400",
    ],
    price: 20000,
    category: "T-Shirts",
    brand: "ASOS DESIGN",
    rating: 4.5,
    description:
      "Premium heavyweight cotton t-shirt with oversized fit. Perfect for a relaxed, modern look. Features dropped shoulders and ribbed crew neck.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Grey"],
  },
  {
    id: "2",
    name: "Relaxed Fit Hoodie with Logo Print",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    ],
    price: 45000,
    category: "Hoodies",
    brand: "Weekday",
    rating: 4.7,
    description:
      "Cozy relaxed hoodie with bold logo print. Made from soft cotton blend with fleece lining. Features kangaroo pocket and adjustable drawstring hood.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Grey", "Navy", "Black"],
  },
  {
    id: "3",
    name: "Regular Fit Oxford Shirt in White",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400",
    price: 32500,
    category: "Long Sleeve",
    brand: "Topman",
    rating: 4.3,
    description:
      "Classic oxford shirt in crisp white. Button-down collar and long sleeves. Perfect for smart-casual occasions.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Blue", "Pink"],
  },
  {
    id: "4",
    name: "Cropped Boxy T-Shirt in Sage Green",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
    price: 18000,
    category: "T-Shirts",
    brand: "COLLUSION",
    rating: 4.0,
    description:
      "Trendy cropped tee with boxy silhouette. Soft cotton fabric in on-trend sage green. Perfect for high-waisted styling.",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Sage Green", "Lilac", "Cream"],
  },
  {
    id: "5",
    name: "Zip Through Hoodie in Navy",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    price: 52000,
    category: "Hoodies",
    brand: "Nike",
    rating: 4.8,
    description:
      "Athletic zip-through hoodie from Nike. Dri-FIT technology keeps you dry. Full zip closure with side pockets.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Navy", "Black", "Grey"],
  },
  {
    id: "6",
    name: "Longline Crewneck Sweatshirt",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    price: 38000,
    category: "Sweatshirts",
    brand: "ASOS DESIGN",
    rating: 4.4,
    description:
      "Modern longline sweatshirt with crew neck. Extended length for contemporary styling. Soft brushed fleece interior.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Grey", "Burgundy"],
  },
  {
    id: "7",
    name: "Oversized Denim Shirt in Mid Blue",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    price: 42000,
    category: "Long Sleeve",
    brand: "Reclaimed Vintage",
    rating: 4.6,
    description:
      "Vintage-inspired oversized denim shirt. Classic mid blue wash with button front. Perfect layering piece.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Mid Blue", "Light Blue", "Black"],
  },
  {
    id: "8",
    name: "Muscle Fit T-Shirt with Curved Hem",
    image: "https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=400",
    price: 15000,
    category: "T-Shirts",
    brand: "New Look",
    rating: 4.2,
    description:
      "Fitted muscle tee with stylish curved hem. Stretch cotton fabric for comfort. Shows off your physique perfectly.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Navy"],
  },
  {
    id: "9",
    name: "Oversized Hoodie with Gothic Print",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400",
    price: 48000,
    category: "Hoodies",
    brand: "ASOS DESIGN",
    rating: 4.6,
    description:
      "Statement oversized hoodie with bold gothic print. Heavy cotton blend with fleece lining. Dropped shoulders for relaxed fit.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Charcoal"],
  },
  {
    id: "10",
    name: "Crew Neck Sweatshirt in Ecru",
    image: "https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=400",
    price: 35000,
    category: "Sweatshirts",
    brand: "Weekday",
    rating: 4.3,
    description:
      "Classic crew neck sweatshirt in neutral ecru. Soft brushed interior. Perfect everyday essential.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ecru", "Grey", "Navy"],
  },
  {
    id: "11",
    name: "Slim Fit Ribbed Long Sleeve Top",
    image: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=400",
    price: 28000,
    category: "Long Sleeve",
    brand: "Topman",
    rating: 4.1,
    description:
      "Fitted ribbed long sleeve top. Stretchy cotton blend. Great for layering or wearing solo.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Olive"],
  },
  {
    id: "12",
    name: "Puffer Gilet in Black",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    price: 65000,
    category: "Accessories",
    brand: "The North Face",
    rating: 4.9,
    description:
      "Insulated puffer gilet for layering. Water-resistant outer shell. Side zip pockets for storage.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Olive"],
  },
  {
    id: "13",
    name: "Vintage Wash Oversized T-Shirt",
    image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=400",
    price: 22000,
    category: "T-Shirts",
    brand: "Pull&Bear",
    rating: 4.4,
    description:
      "Oversized tee with vintage wash finish. Soft worn-in feel. Relaxed fit with dropped shoulders.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Grey", "Black", "Brown"],
  },
  {
    id: "14",
    name: "Half Zip Sweatshirt in Charcoal",
    image: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400",
    price: 40000,
    category: "Sweatshirts",
    brand: "ASOS DESIGN",
    rating: 4.5,
    description:
      "Contemporary half-zip sweatshirt. Soft fleece interior. Stand collar and zip pocket detail.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Charcoal", "Navy", "Forest Green"],
  },
  {
    id: "15",
    name: "Flannel Check Shirt in Red",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400",
    price: 36000,
    category: "Long Sleeve",
    brand: "Levi's",
    rating: 4.7,
    description:
      "Classic flannel check shirt from Levi's. Soft brushed cotton. Button-down collar and chest pocket.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Red/Black", "Blue/White", "Green/Navy"],
  },
];
