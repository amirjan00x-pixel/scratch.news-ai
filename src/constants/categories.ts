import categoriesConfig from "../../shared/article-categories.json";

export type ArticleCategory = "Technology" | "Research" | "Business";

const canonicalCategories = categoriesConfig.articleCategories as ArticleCategory[];

export const ARTICLE_CATEGORIES: readonly ArticleCategory[] = canonicalCategories;
export const ALL_CATEGORIES: readonly ["All", ...ArticleCategory[]] = ["All", ...ARTICLE_CATEGORIES];

export const isArticleCategory = (value: string): value is ArticleCategory =>
  ARTICLE_CATEGORIES.includes(value as ArticleCategory);
