// // src/components/POSUI/DiscountBadge.tsx
// import React from 'react';

// interface DiscountBadgeProps {
//   discounts: string[];
//   title?: string;
// }

// const DiscountBadge: React.FC<DiscountBadgeProps> = ({ discounts, title = "ලැබිය හැකි දීමනා:" }) => {
//   if (discounts.length === 0) return null;

//   return (
//     <div className="mt-3 space-y-1 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
//       <h5 className="font-bold mb-1">{title}</h5>
//       {discounts.map((desc, i) => (
//         <p key={i}>{desc}</p>
//       ))}
//     </div>
//   );
// };

// export default DiscountBadge;
