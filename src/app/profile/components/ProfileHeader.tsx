// // ProfileHeader.tsx
// 'use client';

// import React, { useState, useRef } from 'react';
// import { CameraIcon } from '@heroicons/react/24/solid';
// import Image from 'next/image';
// import { toast } from '@/app/hooks/use-toast';
// import { authClient } from '@/lib/auth-client';
// import SkeletonLoader from '@/app/components/SkeletonLoader';
// import { UserRole } from '@/types/user';

// interface ProfileHeaderProps {
//     profileImage: string;
//     name: string;
//     email: string;
//     balance: number;
//     portfolioValue: number;
//     userRole: UserRole;
//     userId: string | null;
//     loading: boolean;
//     onImageUpdate: (newImage: string) => void;
//     fetchUserData: (forceRefresh?: boolean) => Promise<void>;
// }

// const roleConfig = {
//     admin: { label: "Administrator", icon: '🛡️', color: 'text-purple-400' },
//     premium: { label: "Premium Member", icon: '⭐', color: 'text-yellow-400' },
//     verified: { label: "Verified", icon: '✅', color: 'text-green-400' },
//     user: { label: "Member", icon: '👤', color: 'text-gray-400' },
// };

// const ProfileHeader = () => {

//     const [imageError, setImageError] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const role = roleConfig[userRole] || roleConfig.user;

//     const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file || !userId) return;

//         try {
//             const reader = new FileReader();
//             reader.onload = () => onImageUpdate(reader.result as string);
//             reader.readAsDataURL(file);

//             const formData = new FormData();
//             formData.append('image', file);

//             const response = await fetch(`/api/user/image?id=${userId}`, {
//                 method: 'POST',
//                 body: formData,
//                 credentials: 'include',
//             });

//             if (!response.ok) throw new Error('Image upload failed');

//             const result = await response.json();
//             await authClient.updateUser({ image: result.imageUrl });
//             await fetchUserData(true);

//             toast({ title: 'Success', description: 'Profile picture updated' });
//         } catch (error) {
//             toast({ title: 'Error', description: 'Failed to update image' });
//             console.error('Image upload error:', error);
//         }
//     };

//     if (loading) {
//         return (
//             <header className="mb-8">
//                 <div className="flex flex-col md:flex-row items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
//                     <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
//                         <SkeletonLoader className="w-20 h-20 rounded-full mr-4" />
//                         <div className="flex-1">
//                             <SkeletonLoader className="h-6 w-48 mb-2" />
//                             <SkeletonLoader className="h-4 w-32" />
//                         </div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-4 w-full md:w-64">
//                         <SkeletonLoader className="h-16 rounded-lg" />
//                         <SkeletonLoader className="h-16 rounded-lg" />
//                     </div>
//                 </div>
//             </header>
//         );
//     }

//     return (
//         <header className="mb-8 overflow-hidden">
//             <div className="flex flex-col md:flex-row items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
//                 <div className="flex items-center mb-4 md:mb-0">
//                     <div className="relative w-20 h-20 md:w-24 md:h-24 group mr-4">
//                         <div
//                             className="relative w-full h-full rounded-full overflow-hidden cursor-pointer
//                                         group-hover:ring-4 group-hover:ring-blue-500/50 transition-all"
//                             onClick={handleImageClick}
//                         >
//                             {imageError ? (
//                                 <div className="w-full h-full bg-gray-700 flex items-center justify-center">
//                                     <CameraIcon className="h-8 w-8 text-gray-400" />
//                                 </div>
//                             ) : (
//                                 <Image
//                                     src={profileImage}
//                                     alt="Profile"
//                                     fill
//                                     className="object-cover"
//                                     onError={() => setImageError(true)}
//                                 />
//                             )}
//                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
//                                         transition-opacity flex items-center justify-center">
//                                 <CameraIcon className="h-6 w-6 text-white" />
//                             </div>
//                         </div>
//                         <input
//                             type="file"
//                             ref={fileInputRef}
//                             onChange={handleImageChange}
//                             accept="image/*"
//                             className="hidden"
//                         />
//                     </div>
//                     <div>
//                         <div className="flex items-center">
//                             <div className="text-3xl font-bold text-white">
//                                 {name}
//                             </div>
//                             {icon && <span className="ml-2">{icon}</span>}
//                         </div>
//                         <div className="text-gray-400">{email}</div>
//                     </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="text-center">
//                         <div className="text-gray-400 text-sm">Balance</div>
//                         <div className="text-xl font-bold text-white">
//                             ${balance.toLocaleString(undefined, {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2
//                             })}
//                         </div>
//                     </div>
//                     <div className="text-center">
//                         <div className="text-gray-400 text-sm">Portfolio Value</div>
//                         <div className="text-xl font-bold text-white">
//                             ${portfolioValue.toLocaleString(undefined, {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2
//                             })}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default ProfileHeader;