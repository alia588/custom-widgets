export interface Review {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTime: string;
  images?: string[];
}

export interface BusinessInfo {
  name: string;
  address: string;
  totalReviews: number;
  averageRating: number;
}

export const businessInfo: BusinessInfo = {
  name: 'SSR Diesel Repairs',
  address: '1553 W 40th St, Hialeah, FL 33012, USA',
  totalReviews: 126,
  averageRating: 4.0,
};

export const reviews: Review[] = [
  {
    id: '1',
    authorName: 'AM Diesel and Hydraulics',
    authorPhotoUrl: 'https://placehold.co/40x40/orange/white?text=AM',
    rating: 5,
    text: 'Norberto at SSR Diesel always gives me the best service! He is extremely knowledgeable and always willing to help. He always has the best prices, and 90% of the time, he has what I need in stock! I drive 2 hrs to get here, but it\'s always worth the drive. He has a customer for life!',
    relativeTime: '9 months ago',
  },
  {
    id: '2',
    authorName: 'AIR',
    authorPhotoUrl: 'https://placehold.co/40x40/amber/white?text=A',
    rating: 5,
    text: 'I was recommended this place by several colleagues and I am happy to say it doesn\'t disappoint. From the efficiency, compassionate service, to the fair prices everything was great! I cannot recommend this business more.',
    relativeTime: '11 months ago',
  },
  {
    id: '3',
    authorName: 'Omar Santos',
    authorPhotoUrl: 'https://placehold.co/40x40/gray/white?text=O',
    rating: 5,
    text: 'Outstanding service! They are very professional and efficient. Excellent service and above all very fast!!!',
    relativeTime: 'a year ago',
  },
  {
    id: '4',
    authorName: 'Magnelio Fernandez',
    authorPhotoUrl: 'https://placehold.co/40x40/brown/white?text=M',
    rating: 5,
    text: 'Good mechanics. Happy again. Got my truck fix',
    relativeTime: 'a year ago',
  },
  {
    id: '5',
    authorName: 'Emm MartMursu',
    authorPhotoUrl: 'https://placehold.co/40x40/yellow/white?text=E',
    rating: 5,
    text: 'Excellent parts and service and competitive pricing thank',
    relativeTime: 'a year ago',
  },
  {
    id: '6',
    authorName: 'Jose Rivera',
    rating: 5,
    text: 'Great customer service and fast turnaround. Will definitely come back for any diesel needs.',
    relativeTime: 'a year ago',
  },
  {
    id: '7',
    authorName: 'Maria Gonzalez',
    rating: 5,
    text: 'The team was incredibly helpful and explained everything clearly. Fair pricing too!',
    relativeTime: 'a year ago',
  },
  {
    id: '8',
    authorName: 'Carlos Mendez',
    rating: 5,
    text: 'Best diesel shop in the area. Knowledgeable staff and quality work every time.',
    relativeTime: '2 years ago',
  },
];
