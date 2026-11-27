// Explicit preview fixtures. No resource API contract exists in this checkout.
export const categories = [
  { id: 'study', label: 'Study areas', singular: 'Study area', icon: 'book', note: 'Find your focus' },
  { id: 'labs', label: 'Computer labs', singular: 'Computer lab', icon: 'monitor', note: 'Plug into possibility' },
  { id: 'printers', label: 'Printers', singular: 'Printer', icon: 'printer', note: 'Make it on paper' },
  { id: 'food', label: 'Cafeterias', singular: 'Cafeteria', icon: 'cup', note: 'Take a little break' },
];

const sampleResources = [
  { id: 'library-quiet', name: 'Library Quiet Zone', category: 'study', location: 'Main Library · Level 2', description: 'A space for heads-down reading, revision, and individual study. Bring your notes and settle into a quieter part of your day.', features: ['Quiet study', 'Individual desks', 'Power outlets'], needs: ['focus'], art: 'library' },
  { id: 'computing-lab', name: 'Computing Lab', category: 'labs', location: 'Engineering Building · Level 1', description: 'A dedicated workstation space for coursework and digital projects. Software, access requirements, and workstation availability need campus confirmation.', features: ['Desktop workstations', 'Coursework', 'Power outlets'], needs: ['computers'], art: 'lab' },
  { id: 'garden-cafe', name: 'Garden Cafeteria', category: 'food', location: 'Student Center · Ground floor', description: 'A casual place to pause between classes, catch up with friends, or enjoy a meal. Menus and opening hours need campus confirmation.', features: ['Casual seating', 'Social space', 'Meal break'], needs: ['food', 'group'], art: 'cafe' },
  { id: 'library-print', name: 'Library Print Station', category: 'printers', location: 'Main Library · Ground floor', description: 'A convenient stop for printing coursework near the library. Printing costs, supported formats, and device status need campus confirmation.', features: ['Document printing', 'Library location', 'Coursework'], needs: ['print'], art: 'print' },
  { id: 'collaboration-room', name: 'Collaboration Corner', category: 'study', location: 'Student Center · Level 1', description: 'A shared study setting for talking through ideas and working together on a class project. Booking requirements need campus confirmation.', features: ['Group study', 'Shared tables', 'Discussion space'], needs: ['group'], art: 'library' },
  { id: 'design-lab', name: 'Design Computing Lab', category: 'labs', location: 'Design Building · Level 2', description: 'A workspace for computer-based assignments and creative coursework. Installed software and access requirements need campus confirmation.', features: ['Desktop workstations', 'Creative projects', 'Coursework'], needs: ['computers'], art: 'lab' },
  { id: 'student-print', name: 'Student Center Printer', category: 'printers', location: 'Student Center · Ground floor', description: 'A print point near shared student spaces. Check campus guidance for prices, print submission, and service availability.', features: ['Document printing', 'Central location', 'Coursework'], needs: ['print'], art: 'print' },
  { id: 'courtyard-cafe', name: 'Courtyard Café', category: 'food', location: 'Campus Courtyard · Ground floor', description: 'A relaxed setting for a coffee break or a conversation between classes. Menu, prices, and opening hours need campus confirmation.', features: ['Coffee break', 'Social space', 'Casual seating'], needs: ['food', 'group'], art: 'cafe' },
  { id: 'reading-room', name: 'Garden Reading Room', category: 'study', location: 'Main Library · Level 1', description: 'An example reading space for independent coursework and revision. Access and capacity need campus confirmation.', features: ['Individual study', 'Reading tables', 'Power outlets'], needs: ['focus'], art: 'library' },
  { id: 'science-lab', name: 'Science Computing Lab', category: 'labs', location: 'Science Building · Level 1', description: 'An example workstation space for science coursework. Installed software, access, and device availability need campus confirmation.', features: ['Desktop workstations', 'Coursework', 'Power outlets'], needs: ['computers'], art: 'lab' },
  { id: 'engineering-print', name: 'Engineering Print Point', category: 'printers', location: 'Engineering Building · Ground floor', description: 'An example printing location for student assignments. Print costs, submission methods, and device condition need campus confirmation.', features: ['Document printing', 'Coursework', 'Building location'], needs: ['print'], art: 'print' },
  { id: 'science-cafe', name: 'Science Commons Café', category: 'food', location: 'Science Building · Ground floor', description: 'An example café for taking a break near classes. Menus, hours, and seating capacity need campus confirmation.', features: ['Coffee break', 'Casual seating', 'Meal break'], needs: ['food'], art: 'cafe' },
];

export const resources = sampleResources.map(resource => ({
  ...resource,
  building: resource.location.split(' · ')[0],
  capacity: 'Not provided',
  active: true,
  condition: 'Unknown',
}));

export const preferences = {
  study: ['Quiet', 'Seats available', 'Group-friendly'],
  labs: ['Computers available', 'Low occupancy'],
  printers: ['Working', 'Short queue'],
  food: ['Short wait', 'Seats available'],
};

export function normalizeFilters(input = {}) {
  return {
    query: String(input.query || '').trim().slice(0, 200),
    category: categories.some(category => category.id === input.category) ? input.category : 'all',
    sort: ['featured', 'name', 'category'].includes(input.sort) ? input.sort : 'featured',
    savedOnly: input.savedOnly === true,
  };
}

export function filterResources(items, input, savedIds = []) {
  const filters = normalizeFilters(input);
  const terms = filters.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = items.filter(resource => {
    const category = categories.find(item => item.id === resource.category);
    const searchable = [resource.name, resource.location, category?.label, resource.description, ...resource.features].join(' ').toLocaleLowerCase();
    return resource.active && (filters.category === 'all' || resource.category === filters.category)
      && (!filters.savedOnly || savedIds.includes(resource.id))
      && terms.every(term => searchable.includes(term));
  });
  if (filters.sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (filters.sort === 'category') filtered.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return filtered;
}

// No fabricated condition scores: unknown conditions are never favorable.
// This preview only finds compatible categories/buildings. The server must
// eventually supply rankings, report freshness, and explanations.
export function recommendResources(items, { category, building = 'all' }) {
  return items.filter(resource => resource.active && resource.category === category && (building === 'all' || resource.building === building));
}

export function parseSaved(value, items = resources) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(id => items.some(resource => resource.id === id)))];
  } catch {
    return [];
  }
}
