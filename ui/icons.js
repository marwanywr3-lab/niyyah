const paths={
 daily:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
 quran:'<path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
 worship:'<path d="M5 21V10l7-5 7 5v11M2 21h20M9 21v-6a3 3 0 0 1 6 0v6M5 5V2m14 3V2"/>',
 discover:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
 sana:'<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>'
};
export const uiIcon=name=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||'')+'</svg>';
