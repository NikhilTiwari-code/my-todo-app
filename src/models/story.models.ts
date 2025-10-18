import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  content?: string; // Optional text content
  imageUrl?: string; // Base64 image or URL
  type: "text" | "image" | "both";
  views: {
    userId: mongoose.Types.ObjectId;
    viewedAt: Date;
  }[];
  expiresAt: Date; // Auto-delete after 24 hours
  createdAt: Date;
  updatedAt: Date;
}
 
const StorySchema = new Schema<IStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    imageUrl: {
      type: String, // Base64 string or cloud URL
    },
    type: {
      type: String,
      enum: ["text", "image", "both"],
      required: true,
    },
    views: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: true, // For efficient cleanup queries
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active stories
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ userId: 1, expiresAt: 1 });

// Static method to get active stories
StorySchema.statics.getActiveStories = async function () {
  return this.find({
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("userId", "name email avatar")
    .lean();
};

// Static method to get user's active stories
StorySchema.statics.getUserStories = async function (userId: string) {
  return this.find({
    userId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to delete expired stories
StorySchema.statics.deleteExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

export interface IStoryModel extends Model<IStory> {
  getActiveStories(): Promise<IStory[]>;
  getUserStories(userId: string): Promise<IStory[]>;
  deleteExpired(): Promise<number>;
}

export default (mongoose.models.Story ||
  mongoose.model<IStory, IStoryModel>("Story", StorySchema)) as IStoryModel;






// // ============================================
// // 1. Install Prisma
// // ============================================
// // npm install prisma @prisma/client
// // npx prisma init

// // ============================================
// // 2. prisma/schema.prisma
// // ============================================

// generator client {
//   provider = "prisma-client-js"
// }

// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

// // User Model
// model User {
//   id        String   @id @default(uuid())
//   name      String
//   email     String   @unique
//   avatar    String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
  
//   stories    Story[]
//   storyViews StoryView[]
// }

// // Story Model (Main Table)
// model Story {
//   id        String    @id @default(uuid())
//   userId    String
//   content   String?   @db.VarChar(500)
//   imageUrl  String?   @db.Text
//   type      StoryType
//   expiresAt DateTime
//   createdAt DateTime  @default(now())
//   updatedAt DateTime  @updatedAt
  
//   user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
//   views StoryView[]
  
//   // Indexes for performance
//   @@index([userId, expiresAt])
//   @@index([expiresAt])
//   @@map("stories") // Table name
// }

// // StoryView Model (Separate Table - Normalized)
// model StoryView {
//   id       String   @id @default(uuid())
//   storyId  String
//   userId   String
//   viewedAt DateTime @default(now())
  
//   story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
//   user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
//   // Prevent duplicate views from same user
//   @@unique([storyId, userId])
//   @@index([storyId])
//   @@index([userId])
//   @@map("story_views")
// }

// enum StoryType {
//   text
//   image
//   both
// }

// // ============================================
// // 3. Generate Prisma Client
// // ============================================
// // npx prisma generate
// // npx prisma migrate dev --name init

// // ============================================
// // 4. Story Model Class (Like Mongoose Model)
// // ============================================

// import { PrismaClient, Story, StoryType, Prisma } from '@prisma/client';

// const prisma = new PrismaClient();

// // TypeScript Interfaces
// export interface IStoryCreate {
//   userId: string;
//   content?: string;
//   imageUrl?: string;
//   type: StoryType;
//   expiresAt?: Date; // Auto-set to 24 hours if not provided
// }

// export interface IStoryWithUser extends Story {
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     avatar: string | null;
//   };
//   viewCount?: number;
// }

// export interface IStoryView {
//   userId: string;
//   viewedAt: Date;
//   user: {
//     id: string;
//     name: string;
//     avatar: string | null;
//   };
// }

// // Story Model Class (Similar to Mongoose Static Methods)
// export class StoryModel {
  
//   // Create a new story
//   static async create(data: IStoryCreate): Promise<Story> {
//     // Auto-set expiration to 24 hours if not provided
//     const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    
//     return prisma.story.create({
//       data: {
//         ...data,
//         expiresAt,
//       },
//     });
//   }

//   // Get all active stories (equivalent to getActiveStories in Mongoose)
//   static async getActiveStories(): Promise<IStoryWithUser[]> {
//     const stories = await prisma.story.findMany({
//       where: {
//         expiresAt: {
//           gt: new Date(),
//         },
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             avatar: true,
//           },
//         },
//         _count: {
//           select: {
//             views: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     return stories.map(story => ({
//       ...story,
//       viewCount: story._count.views,
//     }));
//   }

//   // Get user's active stories (equivalent to getUserStories in Mongoose)
//   static async getUserStories(userId: string): Promise<Story[]> {
//     return prisma.story.findMany({
//       where: {
//         userId,
//         expiresAt: {
//           gt: new Date(),
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });
//   }

//   // Delete expired stories (equivalent to deleteExpired in Mongoose)
//   static async deleteExpired(): Promise<number> {
//     const result = await prisma.story.deleteMany({
//       where: {
//         expiresAt: {
//           lt: new Date(),
//         },
//       },
//     });
//     return result.count;
//   }

//   // Find story by ID
//   static async findById(id: string): Promise<Story | null> {
//     return prisma.story.findUnique({
//       where: { id },
//     });
//   }

//   // Find story by ID with user and views
//   static async findByIdWithDetails(id: string) {
//     return prisma.story.findUnique({
//       where: { id },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             avatar: true,
//           },
//         },
//         views: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 avatar: true,
//               },
//             },
//           },
//           orderBy: {
//             viewedAt: 'desc',
//           },
//         },
//       },
//     });
//   }

//   // Add view to a story
//   static async addView(storyId: string, userId: string): Promise<void> {
//     // Upsert prevents duplicate views
//     await prisma.storyView.upsert({
//       where: {
//         storyId_userId: {
//           storyId,
//           userId,
//         },
//       },
//       create: {
//         storyId,
//         userId,
//       },
//       update: {
//         viewedAt: new Date(), // Update timestamp if already viewed
//       },
//     });
//   }

//   // Get all viewers of a story
//   static async getViews(storyId: string): Promise<IStoryView[]> {
//     const views = await prisma.storyView.findMany({
//       where: { storyId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             avatar: true,
//           },
//         },
//       },
//       orderBy: {
//         viewedAt: 'desc',
//       },
//     });

//     return views.map(view => ({
//       userId: view.userId,
//       viewedAt: view.viewedAt,
//       user: view.user,
//     }));
//   }

//   // Check if user has viewed a story
//   static async hasUserViewed(storyId: string, userId: string): Promise<boolean> {
//     const view = await prisma.storyView.findUnique({
//       where: {
//         storyId_userId: {
//           storyId,
//           userId,
//         },
//       },
//     });
//     return !!view;
//   }

//   // Delete a story
//   static async delete(id: string): Promise<Story> {
//     return prisma.story.delete({
//       where: { id },
//     });
//   }

//   // Update a story
//   static async update(id: string, data: Partial<IStoryCreate>): Promise<Story> {
//     return prisma.story.update({
//       where: { id },
//       data,
//     });
//   }

//   // Get stories with pagination
//   static async getActiveStoriesPaginated(page: number = 1, limit: number = 20) {
//     const skip = (page - 1) * limit;
    
//     const [stories, total] = await Promise.all([
//       prisma.story.findMany({
//         where: {
//           expiresAt: {
//             gt: new Date(),
//           },
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               avatar: true,
//             },
//           },
//           _count: {
//             select: {
//               views: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//         skip,
//         take: limit,
//       }),
//       prisma.story.count({
//         where: {
//           expiresAt: {
//             gt: new Date(),
//           },
//         },
//       }),
//     ]);

//     return {
//       stories,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }
// }

// // ============================================
// // 5. Usage Examples
// // ============================================

// // Create a story
// const newStory = await StoryModel.create({
//   userId: "user-123",
//   content: "Hello World!",
//   type: "text",
// });

// // Get all active stories
// const activeStories = await StoryModel.getActiveStories();

// // Get user's stories
// const userStories = await StoryModel.getUserStories("user-123");

// // Add a view
// await StoryModel.addView("story-123", "viewer-456");

// // Get story views
// const views = await StoryModel.getViews("story-123");

// // Check if user viewed
// const hasViewed = await StoryModel.hasUserViewed("story-123", "viewer-456");

// // Delete expired stories (run via cron)
// const deletedCount = await StoryModel.deleteExpired();

// // ============================================
// // 6. Environment Variables (.env)
// // ============================================
// // DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
