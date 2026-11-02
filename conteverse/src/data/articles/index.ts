import type { Article, CategorySlug, Scope } from "../../types/content.ts";
import { guineeArticles } from "./guinee.ts";
import { afriqueArticles } from "./afrique.ts";
import { frTypo } from "../../lib/utils/typo.ts";

export const articles: Article[] = frTypo([...guineeArticles, ...afriqueArticles]);

export const articleBySlug = Object.fromEntries(articles.map((a) => [a.slug, a])) as Record<string, Article>;

export const articlesByCategory = (slug: CategorySlug) => articles.filter((a) => a.category === slug);
export const articlesByScope = (scope: Scope) => articles.filter((a) => a.scope === scope);
