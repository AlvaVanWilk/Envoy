// How much fits on a page of the Handbuch. The book has a fixed height, so a
// long list is split over as many pages as the window needs: on a phone a
// page holds fewer lines than on an iPad. `room` is the size of a page body in
// px (measured by handbook.js); an item is { width, height, gap } in px, the
// same sizes the stylesheet gives it.

export function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// How many items one page holds. reserve: px taken by something above them.
export function perPage(room, item, reserve = 0) {
  const gap = item.gap || 0;
  const cols = Math.max(1, Math.floor((room.width + gap) / (item.width + gap)));
  const rows = Math.max(1, Math.floor((room.height - reserve + gap) / (item.height + gap)));
  return cols * rows;
}
