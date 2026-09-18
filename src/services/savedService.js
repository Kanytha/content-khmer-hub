export const getSavedItems = (userId) => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(`ckh_saved_items_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const isItemSaved = (userId, itemId) => {
  const items = getSavedItems(userId);
  return items.some((item) => item.id === itemId);
};

export const toggleSaveItem = (userId, itemToSave) => {
  if (!userId || !itemToSave?.id) return false;
  const items = getSavedItems(userId);
  const exists = items.some((i) => i.id === itemToSave.id);

  let updated;
  if (exists) {
    updated = items.filter((i) => i.id !== itemToSave.id);
  } else {
    const formatted = {
      id: itemToSave.id,
      title: itemToSave.title,
      type: itemToSave.type || 'recommendation',
      folder: itemToSave.folder || (itemToSave.type === 'opportunity' ? 'Grant Programs' : 'Next Video Ideas'),
      reason: itemToSave.reason || itemToSave.description || '',
      category: itemToSave.category || itemToSave.typeBadge || '',
      organizer: itemToSave.organizer || '',
      deadline: itemToSave.deadline || '',
      location: itemToSave.location || '',
      savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    updated = [formatted, ...items];
  }

  localStorage.setItem(`ckh_saved_items_${userId}`, JSON.stringify(updated));
  return !exists;
};