export function normalizeSearchText(text) {
  return text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
export function searchCatalog(catalog, query) {
  if (!catalog || !query.trim()) return [];
  const normalizedQuery = normalizeSearchText(query.trim());
  const categories = ['provinces', 'cities', 'attractions'];
  return categories.flatMap((category) => {
    return catalog[category]
      .filter((item) => {
        const searchableText = `${item.name} ${item.native_name}`;
        return normalizeSearchText(searchableText).includes(normalizedQuery);
      })
      .map((item) => ({
        ...item,
        type: category,
      }));
  });
}

