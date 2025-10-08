import { Course } from "../models/Course.js";
import User from "../models/User.js";

// Get all courses
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('Instructor_id', 'name email');
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching courses",
            error: error.message
        });
    }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id).populate('Instructor_id', 'name email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching course",
            error: error.message
        });
    }
};

// Create a new course
export const createCourse = async (req, res) => {
    try {
        const { title, description, Instructor_id } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });

        }

        let instructorId = Instructor_id;

        // If no Instructor_id provided, use the authenticated user's ID
        if (!instructorId) {
            const user = await User.findOne({ email: req.user.email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            instructorId = user._id;
        }

        // Check if instructor exists
        const instructor = await User.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        const course = new Course({
            title,
            description,
            Instructor_id: instructorId,
            numberOfRegistrations: 0
        });

        const savedCourse = await course.save();

        // Update instructor's createdCourses array
        await User.findByIdAndUpdate(
            instructorId,
            { $push: { createdCourses: savedCourse._id } },
            { new: true }
        );

        const populatedCourse = await Course.findById(savedCourse._id).populate('Instructor_id', 'name email');

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: populatedCourse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating course",
            error: error.message
        });
    }
};

// Update a course
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, Instructor_id } = req.body;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Update only provided fields
        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (Instructor_id !== undefined) course.Instructor_id = Instructor_id;

        const updatedCourse = await course.save();
        const populatedCourse = await Course.findById(updatedCourse._id).populate('Instructor_id', 'name email');

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: populatedCourse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating course",
            error: error.message
        });
    }
};

// Delete a course
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Remove course from instructor's createdCourses array
        await User.findByIdAndUpdate(
            course.Instructor_id,
            { $pull: { createdCourses: course._id } },
            { new: true }
        );

        // Also remove from all students' enrolledCourses arrays
        await User.updateMany(
            { enrolledCourses: course._id },
            { $pull: { enrolledCourses: course._id } }
        );

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
            data: {
                id: course._id,
                title: course.title
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting course",
            error: error.message
        });
    }
};