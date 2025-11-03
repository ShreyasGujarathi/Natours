import { displayMap } from './mapbox';
import { login, signup, logout } from './auth';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';
import { initTheme } from './theme';
import { handleTourForm, handleTourDeletion, handleGuideManagement } from './admin';

// Initialize theme toggle
initTheme();

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const tourBookingBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  // Getting email and password from "/login" form
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (signupForm) {
  // Getting name, email and password from "/signup" form
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    signup(name, email, password, passwordConfirm);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (tourBookingBtn) {
  tourBookingBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);

// Video functionality for tour hero section
const initTourVideo = () => {
  const tourHero = document.getElementById('tour-hero');
  const video = tourHero?.querySelector('.header__hero-video');
  const playBtn = document.getElementById('play-video-btn');
  const heading = document.getElementById('tour-heading');
  
  if (!video || !playBtn || !heading) return;

  const playVideo = () => {
    video.classList.add('playing');
    playBtn.classList.add('playing');
    tourHero.classList.add('video-playing');
    video.play().catch(err => {
      console.error('Error playing video:', err);
      // Fallback: show an alert if video can't play
      showAlert('error', 'Unable to play video. Please check your browser settings.', 5);
    });
  };

  const pauseVideo = () => {
    video.pause();
    video.classList.remove('playing');
    playBtn.classList.remove('playing');
    tourHero.classList.remove('video-playing');
  };

  // Play button click
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playVideo();
  });

  // Hero section click to toggle play/pause (when video is playing)
  tourHero.addEventListener('click', (e) => {
    if (e.target === playBtn || playBtn.contains(e.target)) return;
    
    if (video.classList.contains('playing')) {
      if (video.paused) {
        playVideo();
      } else {
        pauseVideo();
      }
    }
  });

  // Pause video when it ends
  video.addEventListener('ended', () => {
    // Restart the loop if it's set to loop
    if (video.loop) {
      video.currentTime = 0;
      video.play();
    } else {
      pauseVideo();
    }
  });
};

// Initialize video if on tour page
if (document.getElementById('tour-hero')) {
  initTourVideo();
}

// Initialize admin functionality
if (document.getElementById('tour-form')) {
  handleTourForm();
}

if (document.querySelector('.delete-tour-btn')) {
  handleTourDeletion();
}

// Initialize guide management
if (document.querySelector('.guide-role-select') || document.getElementById('create-guide-form')) {
  handleGuideManagement();
}
