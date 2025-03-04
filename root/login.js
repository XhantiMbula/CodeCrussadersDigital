
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";


import { getAuth, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

  //import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
  //import {getAuth, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

  //Firebase configuration
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
  const auth = getAuth(app);




document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const isLoggedIn = document.querySelector('.isLoggedIn');


    /*  auth.onAuthStateChanged(user => {
      document.querySelectorAll('.isLoggedIn').forEach(item => {
          item.style.display = 'inline';
      }); }); */

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        //const isAdmin = checkIfAdmin(email);      
        
        // document.getElementById('auth-button').innerHTML = user ? '<button onclick="handleAuth()">Logout</button>' : '<button onclick="handleAuth()">Login</button>';
        //isLoggedIn = true;        
        /*
        // Store user info in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.email.split('@')[0]);
        localStorage.setItem('uid', user.uid);*/
        // updateUIForLoginStatus(true, isAdmin);

        // Redirect to home page
        window.location.href = 'userDashboard.html';
    } catch (error) {
        isLoggedIn = false;
        errorMessage.textContent = getErrorMessage(error.code);
        errorMessage.classList.add('visible');
    }
});

function checkIfAdmin(email) {
  // This is where you'd typically check against your admin list
  // For demo purposes, we'll consider emails containing 'admin' as admin users
  return email.includes('admin');
}

function updateUIForLoginStatus(isLoggedIn, isAdmin) {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const userInfo = document.querySelector('.user-info');
  const loginButton = document.querySelector('.button-primary');
  const registerButton = document.querySelector('.button-secondary');
  const username = document.getElementById('username');
  const adminElements = document.querySelectorAll('.admin-only');

  if (isLoggedIn) {
      sidebar.classList.add('visible');
      mainContent.classList.add('with-sidebar');
      userInfo.classList.add('visible');
      loginButton.style.display = 'none';
      registerButton.style.display = 'none';
      username.textContent = localStorage.getItem('username') || 'User';

      // Show/hide admin elements based on admin status
      adminElements.forEach(element => {
          if (isAdmin) {
              element.classList.add('visible');
          } else {
              element.classList.remove('visible');
          }
      });
  } else {
      sidebar.classList.remove('visible');
      mainContent.classList.remove('with-sidebar');
      userInfo.classList.remove('visible');
      loginButton.style.display = 'inline-block';
      registerButton.style.display = 'inline-block';
      
      // Hide admin elements when logged out
      adminElements.forEach(element => {
          element.classList.remove('visible');
      });
  }
}

window.addEventListener('load', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  updateUIForLoginStatus(isLoggedIn, isAdmin);
});