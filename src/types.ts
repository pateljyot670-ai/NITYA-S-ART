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

export type Category = 'All' | 'Oil Painting' | 'Digital Art' | 'Sculpture' | 'Photography' | 'Lippan Art';
