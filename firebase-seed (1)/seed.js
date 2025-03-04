/*import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
*/
// Firebase configuration
console.log("Scipt started.");
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');


const firebaseConfig = {
  apiKey: "AIzaSyAD37t_mlsdrtt1X7uyvSJJlappTxSC9t0",
  authDomain: "codecrussaders.firebaseapp.com",
  projectId: "codecrussaders",
  storageBucket: "codecrussaders.firebasestorage.app",
  messagingSenderId: "806653513715",
  appId: "1:806653513715:web:d665c2f92f5acdd89dcc86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Initial resources data
const initialResources = {
  "-N1234567890": {
    title: "Advanced JavaScript Techniques",
    type: "pdf",
    description: "Comprehensive guide to modern JavaScript development patterns.",
    status: "available",
    createdAt: "2025-02-22T10:00:00Z",
    fileUrl: "" // Replace with actual URL after upload
  },
  "-N1234567891": {
    title: "React Performance Workshop",
    type: "training",
    description: "Live training session on optimizing React applications.",
    status: "available",
    createdAt: "2025-02-22T10:05:00Z"
  },
  "-N1234567892": {
    title: "Full Stack Development",
    type: "course",
    description: "Complete course covering both frontend and backend development.",
    status: "available",
    createdAt: "2025-02-22T10:10:00Z"
  },
  "-N1234567893": {
    title: "UI/UX Design Principles",
    type: "pdf",
    description: "Essential principles of modern user interface and experience design.",
    status: "available",
    createdAt: "2025-02-22T10:15:00Z",
    fileUrl: "" // Replace with actual URL after upload
  },
  "-N1234567894": {
    title: "Cloud Architecture Fundamentals",
    type: "course",
    description: "Learn the basics of cloud architecture and deployment strategies.",
    status: "available",
    createdAt: "2025-02-22T10:20:00Z"
  },
  "-N1234567895": {
    title: "Agile Development Workshop",
    type: "training",
    description: "Interactive workshop on agile methodologies and best practices.",
    status: "available",
    createdAt: "2025-02-22T10:25:00Z"
  },
  "-N1234567896": {
    title: "Cybersecurity Essentials",
    type: "pdf",
    description: "Comprehensive guide to modern security practices and threat prevention.",
    status: "available",
    createdAt: "2025-02-22T10:30:00Z",
    fileUrl: "" // Replace with actual URL after upload
  },
  "-N1234567897": {
    title: "Data Science Bootcamp",
    type: "course",
    description: "Intensive course covering data analysis, visualization, and machine learning basics.",
    status: "available",
    createdAt: "2025-02-22T10:35:00Z"
  },
  "-N1234567898": {
    title: "DevOps Best Practices",
    type: "pdf",
    description: "Guide to implementing effective DevOps practices in your organization.",
    status: "available",
    createdAt: "2025-02-22T10:40:00Z",
    fileUrl: "" // Replace with actual URL after upload
  }
};

// Seed the database

async function seedDatabase() {
  try {
    // Sign in as admin
    await signInWithEmailAndPassword(auth, "xhanti.mbula@capaciti.org.za", "Maludwe1*");
    console.log("Admin signed in successfully!");

    const resourcesRef = ref(db, 'resources');
    await set(resourcesRef, initialResources);
    console.log("Initial resources added successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
// Run the seeding function
seedDatabase();