// export const updateBio = async () => {
//     if (!session) return;

//     try {
//         setIsSavingBio(true);

//         const response = await fetch(`/api/user?id=${session.user.id}`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ bio: newBio }),
//             credentials: 'include',
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'Failed to update bio');
//         }

//         setBio(newBio);
//         setIsEditingBio(false);

//         toast({
//             title: "Success",
//             description: "Bio updated successfully",
//         });
//     } catch (error) {
//         console.error('Error updating bio:', error);
//         toast({
//             title: "Error",
//             description: "Failed to update bio",
//         });
//     } finally {
//         setIsSavingBio(false);
//     }
// };

// export const updateName = async (newName: string) => {
//     if (!session) return;

//     const response = await fetch(`/api/user?id=${session.user.id}`, {
//         method: 'PATCH',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ name: newName }),
//         credentials: 'include',
//     });

//     if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to update name');
//     }

//     try {
//         await authClient.updateUser({
//             name: newName,
//         });
//         router.refresh();
//     } catch (error) {
//         console.error('Error updating session:', error);
//     }
// };

// export const updateEmail = async (newEmail: string) => {
//     if (!session) return;

//     try {

//         await authClient.changeEmail({
//             newEmail: newEmail,
//         });
//         router.refresh();

//     } catch (error) {
//         console.error('Error updating email:', error);
//         toast({
//             title: "Error",
//             description: "Failed to update email",
//         });
//     } finally {
//         router.refresh();
//     }

// };