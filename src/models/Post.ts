import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  _id: string;
  title: string;
  content?: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [10000, "Content cannot exceed 10000 characters"],
    },
    published: {
      type: Boolean,
      default: false,
    },
    authorId: {
      type: String,
      required: [true, "Author ID is required"],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
postSchema.index({ authorId: 1 });
postSchema.index({ published: 1 });
postSchema.index({ createdAt: -1 });

// Transform the output to remove __v and rename _id to id
postSchema.set("toJSON", {
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Post = mongoose.model<IPost>("Post", postSchema);
