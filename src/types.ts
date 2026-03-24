export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  year: string;
  dimensions?: string;
  medium: string;
  id_ref?: string;
}

export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  updatedAt: any;
}

export type Category = 'All' | 'CANVAS PAINTING' | 'Digital Art' | 'Sculpture' | 'Photography' | 'Lippan Art' | 'MANDALA ART' | 'WARLI PAINTING' | 'WATER COLOUR PAINTING' | 'DESIGNED PRODUCT';
