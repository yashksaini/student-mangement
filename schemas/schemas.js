import mongoose from "mongoose";

// Users Schema
const userSchema = mongoose.Schema({
  username: String,
  password: String,
  userType: String,
  fullName: String,
});

export const User = mongoose.model("users", userSchema);

// Teachers Schema
const teacherSchema = mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  class: String,
  lock: { type: Boolean, default: false },
});

export const TeacherModal = mongoose.model("teachers", teacherSchema);

const studentSchema = mongoose.Schema({
  ID: String,
  Session: String,
  SR_No: Number,
  rollNo: Number,
  class: String,
  section: String,
  classSecId: String,
  classSection: String,
  studentName: String,
  fatherName: String,
  motherName: String,
  fatherMobNo: String,
  altMobNo: String,
  sub1: String,
  medium1: String,
  sub2: String,
  medium2: String,
  sub3: String,
  medium3: String,
  sub4: String,
  medium4: String,
  sub5: String,
  medium5: String,
  sub6: String,
  medium6: String,
  dob: Date,
  gender: String,
  category: String,
  dateOfAdmission: Date,
  annualIncome: Number,
  email: String,
  aadhaarNo: String,
  isMinority: Boolean,
  isHandicapped: Boolean,
  isOnlyChild: Boolean,
  isDeleted: Boolean,
  reasonForDeletion: String,
  remark: String,
  address: String,
});

export const StudentModal = mongoose.model("students", studentSchema);
