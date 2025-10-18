// 📡 Socket Events for Posts - Real-time notifications
// Handle socket events for likes, comments, etc.

export const postSocketEvents = {
  // When someone likes your post
  onPostLike: (data: any) => {
    console.log("Post liked:", data);
  },

  // When someone comments on your post
  onPostComment: (data: any) => {
    console.log("New comment:", data);
  },

  // When someone saves your post
  onPostSave: (data: any) => {
    console.log("Post saved:", data);
  },
};
