import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface ITodo extends Document {
    title: string;
    description: string;
    isCompleted: boolean;
    owner: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date | null;
    
}

// Define the Todo schema

const todoSchema : Schema<ITodo> = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
    dueDate: {
        type: Date,
        default: null,
        validate: {
            validator: function(value: Date | null) {
                // Due date must be in the future if provided    
                return value === null || value > new Date();
            },
            message: 'Due date must be in the future',
        },
    },
}, {
    timestamps: true,
});

// Create and export the Todo model
const Todo: Model<ITodo> = models.Todo || mongoose.model<ITodo>('Todo', todoSchema);
export default Todo;
      

