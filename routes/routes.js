import express from "express";
import { User, StudentModal, TeacherModal } from "../schemas/schemas.js";
const router = express.Router();
import mongoose from "mongoose";

router.get("/auth", function (req, res) {
  req.session.userData ? res.send(req.session.userData) : res.send(false);
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      username: username,
      password: password,
    }).lean();
    if (user) {
      let lock = true;
      const teacher = await TeacherModal.findOne({ teacherId: user._id });
      if (teacher) {
        lock = teacher.lock;
      }
      const data = {
        isAuth: true,
        fullName: user.fullName,
        userType: user.userType,
        userId: user._id,
        lock: lock,
      };
      req.session.userData = data;
      req.session.save();
      res.send(true);
    } else {
      res.send(false);
    }
  } catch (error) {
    console.error(error);
    res.status(409).json({ message: error.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Server error" });
    } else {
      res.clearCookie(); // Replace 'yourCookieName' with your actual cookie name
      res.json({ message: "Logout successful" });
    }
  });
});

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({
      _id: req.session.userData.userId,
    });

    if (currentPassword === user.password) {
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: "Password changed successfully" });
    } else {
      res.status(401).json({ error: "Incorrect current password" });
    }
  } catch {
    res.status(500).json({ error: "Error while updating password" });
  }
});

router.post("/upload", async (req, res) => {
  try {
    // Clear the 'students' collection
    await StudentModal.deleteMany({});

    const csvData = req.body.data;
    const rows = csvData.split(/\r?\n/); // Handle both \r\n and \n line endings

    // Remove the first row
    rows.shift();

    const parsedData = rows
      .filter((row) => row.trim() !== "")
      .map((row) => {
        const [
          ID,
          Session,
          SR_No,
          rollNo,
          classVal,
          section,
          classSecId,
          classSection,
          studentName,
          fatherName,
          motherName,
          fatherMobNo,
          altMobNo,
          sub1,
          medium1,
          sub2,
          medium2,
          sub3,
          medium3,
          sub4,
          medium4,
          sub5,
          medium5,
          sub6,
          medium6,
          dob,
          gender,
          category,
          dateOfAdmission,
          annualIncome,
          email,
          aadhaarNo,
          isMinority,
          isHandicapped,
          isOnlyChild,
          isDeleted,
          reasonForDeletion,
          remark,
        ] = row.split(",").map((item) => item.trim()); // Split by the CSV delimiter

        // Helper function to handle empty strings
        const parseEmptyString = (value) => (value === "" ? null : value);

        const parseDate = (dateString) => {
          const parsedDate = new Date(dateString);
          return parsedDate.toString() !== "Invalid Date" ? parsedDate : null;
        };

        const parseIncome = (incomeString) => {
          const parsedIncome = parseFloat(incomeString);
          return !isNaN(parsedIncome) && Number.isFinite(parsedIncome)
            ? parsedIncome
            : null;
        };
        // For Address Data
        const parsedRow = row.split(",").map((item) => item.trim());
        let finalAddress = parsedRow.slice(38).join(",");

        // Check if the finalAddress has double quotes at the start and end
        if (finalAddress.startsWith('"') && finalAddress.endsWith('"')) {
          // Remove the double quotes
          finalAddress = finalAddress.slice(1, -1);
        }

        return {
          ID: parseEmptyString(ID),
          Session: parseEmptyString(Session),
          SR_No: parseInt(SR_No) || null,
          rollNo: parseInt(rollNo) || null,
          class: parseEmptyString(classVal),
          section: parseEmptyString(section),
          classSecId: parseEmptyString(classSecId),
          classSection: parseEmptyString(classSection),
          studentName: parseEmptyString(studentName),
          fatherName: parseEmptyString(fatherName),
          motherName: parseEmptyString(motherName),
          fatherMobNo: parseEmptyString(fatherMobNo),
          altMobNo: parseEmptyString(altMobNo),
          sub1: parseEmptyString(sub1),
          medium1: parseEmptyString(medium1),
          sub2: parseEmptyString(sub2),
          medium2: parseEmptyString(medium2),
          sub3: parseEmptyString(sub3),
          medium3: parseEmptyString(medium3),
          sub4: parseEmptyString(sub4),
          medium4: parseEmptyString(medium4),
          sub5: parseEmptyString(sub5),
          medium5: parseEmptyString(medium5),
          sub6: parseEmptyString(sub6),
          medium6: parseEmptyString(medium6),
          dob: parseDate(dob),
          gender: parseEmptyString(gender),
          category: parseEmptyString(category),
          dateOfAdmission: parseDate(dateOfAdmission),
          annualIncome: parseIncome(annualIncome),
          email: parseEmptyString(email),
          aadhaarNo: parseEmptyString(aadhaarNo),
          isMinority: isMinority === "Yes",
          isHandicapped: isHandicapped === "Yes",
          isOnlyChild: isOnlyChild === "Yes",
          isDeleted: isDeleted === "Yes",
          reasonForDeletion: parseEmptyString(reasonForDeletion),
          remark: parseEmptyString(remark),
          address: finalAddress,
        };
      });

    // Remove undefined or incomplete rows
    const filteredData = parsedData.filter(
      (item) => item.name && item.dob && item.email
    );

    // Use Mongoose model to insert data into MongoDB
    const insertedData = await StudentModal.insertMany(parsedData);

    res.status(200).json({ message: "Data added to MongoDB", insertedData });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error adding data to MongoDB" });
  }
});

// Endpoint for create a new teacher
router.post("/create-teacher", async (req, res) => {
  try {
    // Specific data for creating a teacher
    const teacherData = {
      username: req.body.username,
      password: req.body.createPassword,
      userType: "Teacher",
      fullName: req.body.name,
      class: req.body.class,
      lock: false, // Default lock status for the teacher
    };

    // Create a new user instance using the User model
    const newUser = new User({
      username: teacherData.username,
      password: teacherData.password,
      userType: teacherData.userType,
      fullName: teacherData.fullName,
    });

    // Save the user to the "users" collection in MongoDB
    const savedUser = await newUser.save();

    // Create a new teacher instance using the TeacherModal model
    const newTeacher = new TeacherModal({
      teacherId: savedUser._id, // Link to the user created in the "users" collection
      class: teacherData.class,
      lock: teacherData.lock,
    });

    // Save the teacher info to the "teachers" collection in MongoDB
    await newTeacher.save();

    res.status(201).json({ message: "Teacher created successfully" });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ error: "Error creating teacher" });
  }
});

// Get teachers data
router.get("/get-teachers", async (req, res) => {
  try {
    // Fetch all teachers from the database with their user details
    const teachers = await TeacherModal.find({}).populate("teacherId", [
      "username",
      "fullName",
      "password",
    ]); // Populate the 'teacherId' field with user details

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Error fetching teachers" });
  }
});

router.post("/update-teacher/:id", async (req, res) => {
  const id = req.params.id;
  const { lock, tclass, username, password, name } = req.body;

  try {
    await TeacherModal.findOneAndUpdate(
      { teacherId: id },
      { $set: { lock, class: tclass } },
      { new: true }
    ).exec();
    await User.findOneAndUpdate(
      { _id: id },
      { $set: { username, password, fullName: name } },
      { new: true }
    ).exec();

    res.status(200).json({ message: "Teacher and user updated successfully" });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(400).json({ error: "Failed to update teacher and user" });
  }
});

// Endpoint to fetch students data
router.get("/students", async (req, res) => {
  try {
    const students = await StudentModal.find({}, { _id: 0, __v: 0 });
    const formattedStudents = students.map((student) => {
      return {
        ...student._doc,
      };
    });
    res.json(formattedStudents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching students data" });
  }
});

router.get("/student/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const student = await StudentModal.findOne({ _id: id });
    res.status(200).json(student);
  } catch {
    res.status(500).json({ error: "Error fetching student data" });
  }
});

// Endpoint for getting student list for specific teacher
router.get("/students/:teacherId", async (req, res) => {
  const { teacherId } = req.params;
  try {
    // Find the teacher based on the teacherId
    const teacher = await TeacherModal.findOne({ teacherId: teacherId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const studentsForTeacherClass = await StudentModal.find({
      classSection: teacher.class,
    });

    res.status(200).json({
      studentData: studentsForTeacherClass,
      lock: teacher.lock,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Error fetching students" });
  }
});

router.put("/update-student/:id", async (req, res) => {
  const { id } = req.params;
  const updatedStudentData = req.body; // All updated data is sent in the request body

  try {
    const updatedStudent = await StudentModal.findByIdAndUpdate(
      id,
      updatedStudentData,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student details:", error);
    res.status(500).json({ message: "Error updating student details" });
  }
});

export default router;
