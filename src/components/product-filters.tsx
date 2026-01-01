'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { List, Grid, SlidersHorizontal } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Label } from './ui/label';

export type ViewMode = 'grid' | 'list';

type ProductFiltersProps = {
  onFilterChange: (filters: { categories?: string[], price?: [number, number] }) => void;
  onViewChange: (viewMode: ViewMode) => void;
  initialPriceRange: [number, number];
};

export function ProductFilters({ onFilterChange, onViewChange, initialPriceRange }: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);

  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories } = useCollection(categoriesQuery);

  const handleCategoryChange = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(newCategories);
    onFilterChange({ categories: newCategories });
  };

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };
  
  const handlePriceCommit = (value: [number, number]) => {
     onFilterChange({ price: value });
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border/10 bg-card/50 backdrop-blur-xl mb-8">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" /> Filter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories?.map(category => (
              <DropdownMenuCheckboxItem
                key={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-48">
            <Label className="text-xs text-muted-foreground">Price: {priceRange[0]} - {priceRange[1]} PKR</Label>
            <Slider
                defaultValue={initialPriceRange}
                max={10000}
                step={100}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
            />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onViewChange('list')}>
          <List />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onViewChange('grid')}>
          <Grid />
        </Button>
      </div>
    </div>
  );
}
