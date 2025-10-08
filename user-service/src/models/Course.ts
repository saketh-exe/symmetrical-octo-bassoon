import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
    title: {type: String,required :true},
    description: {type: String},
    Instructor_id : {type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    numberOfRegistrations: { type: Number, default: 0 }
})

const Course = mongoose.model("Course",courseSchema);
export default Course;