import mongoose from "mongoose";



const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed

    role: {
      type: String,
      required: true,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // array of course IDs
    createdCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // array of course IDs

    profile: {
      avatar: String,
      bio: String,
      socialLinks: [String],
      skills: [String],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
