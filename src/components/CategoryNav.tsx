import { ALL_CATEGORIES } from "@/constants/categories";

const defaultCategories = ALL_CATEGORIES;

export interface CategoryNavProps {
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const CategoryNav = ({ categories, selectedCategory = "All", onCategoryChange }: CategoryNavProps) => {
  const items = (categories && categories.length > 0 ? categories : defaultCategories).filter(
    (cat, index, self) => self.indexOf(cat) === index
  );

  return (
    <nav className="border-b border-border bg-background sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-3">
          {items.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange?.(category)}
              disabled={!onCategoryChange}
              className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                selectedCategory === category
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              } ${!onCategoryChange ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
