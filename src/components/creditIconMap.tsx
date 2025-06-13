import React from 'react';
import type { JSX } from 'react';
// Maps icon names to SVG components for preview in the settings summary
// Add more icons as needed
export const creditIconMap: { [key: string]: JSX.Element } = {
  star: (
    <svg width="24" height="24" fill="gold" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>
  ),
  coin: (
    <svg width="24" height="24" fill="#FFD700" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#C9B037" strokeWidth="2" fill="#FFD700" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#C9B037">¢</text></svg>
  ),
  credit_card: (
    <svg width="24" height="24" fill="#1976d2" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="3" fill="#1976d2"/><rect x="2" y="9" width="20" height="3" fill="#1565c0"/></svg>
  ),
  award: (
    <svg width="24" height="24" fill="#ff9800" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" fill="#ff9800" /><rect x="10" y="14" width="4" height="6" fill="#ff9800" /></svg>
  ),
  medal: (
    <svg width="24" height="24" fill="#bdbdbd" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" fill="#bdbdbd" /><rect x="10" y="14" width="4" height="6" fill="#bdbdbd" /></svg>
  ),
  trophy: (
    <svg width="24" height="24" fill="#ffeb3b" viewBox="0 0 24 24"><rect x="7" y="18" width="10" height="2" fill="#795548" /><path d="M8 18c-3 0-5-2-5-5V7h4v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V7h4v6c0 3-2 5-5 5H8z" fill="#ffeb3b" /></svg>
  ),
};
