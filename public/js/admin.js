import axios from 'axios';
import { showAlert } from './alerts';

axios.defaults.withCredentials = true;

// Handle tour form submission
export const handleTourForm = () => {
  const form = document.getElementById('tour-form');
  if (!form) return;

  // Add location functionality
  const locationsContainer = document.getElementById('locations-container');
  let locationCount = locationsContainer?.querySelectorAll('.location-entry').length || 1;

  // Add location button
  const addLocationBtn = document.querySelector('.add-location');
  if (addLocationBtn) {
    addLocationBtn.addEventListener('click', () => {
      const locationEntry = document.createElement('div');
      locationEntry.className = 'location-entry';
      locationEntry.innerHTML = `
        <input class="form__input" type="text" name="locationDay${locationCount}" placeholder="Day" required>
        <input class="form__input" type="text" name="locationDesc${locationCount}" placeholder="Description" required>
        <input class="form__input" type="number" name="locationLat${locationCount}" placeholder="Latitude" step="any" required>
        <input class="form__input" type="number" name="locationLng${locationCount}" placeholder="Longitude" step="any" required>
        <button class="btn btn--small btn--danger remove-location" type="button">Remove</button>
      `;
      locationsContainer.appendChild(locationEntry);
      locationCount++;
      initRemoveLocationButtons();
    });
  }

  // Remove location functionality
  const initRemoveLocationButtons = () => {
    document.querySelectorAll('.remove-location').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.location-entry').remove();
      });
    });
  };
  initRemoveLocationButtons();

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('save-tour-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      
      // Process locations
      const locations = [];
      let i = 0;
      while (formData.has(`locationDay${i}`)) {
        locations.push({
          type: 'Point',
          day: parseInt(formData.get(`locationDay${i}`)),
          description: formData.get(`locationDesc${i}`),
          coordinates: [
            parseFloat(formData.get(`locationLng${i}`)),
            parseFloat(formData.get(`locationLat${i}`))
          ]
        });
        // Remove from formData
        formData.delete(`locationDay${i}`);
        formData.delete(`locationDesc${i}`);
        formData.delete(`locationLng${i}`);
        formData.delete(`locationLat${i}`);
        i++;
      }
      
      // Process start location
      const startLocation = {
        type: 'Point',
        description: formData.get('startLocationDesc'),
        coordinates: [
          parseFloat(formData.get('startLocationLng')),
          parseFloat(formData.get('startLocationLat'))
        ]
      };
      
      // Process start dates
      const startDatesStr = formData.get('startDates');
      const startDates = startDatesStr 
        ? startDatesStr.split(',').map(date => new Date(date.trim())).filter(date => !isNaN(date.getTime()))
        : [];

      // Process guides
      const guides = formData.getAll('guides');

      // Build request body
      const tourData = {
        name: formData.get('name'),
        summary: formData.get('summary'),
        description: formData.get('description'),
        duration: parseInt(formData.get('duration')),
        maxGroupSize: parseInt(formData.get('maxGroupSize')),
        difficulty: formData.get('difficulty'),
        price: parseFloat(formData.get('price')),
        priceDiscount: formData.get('priceDiscount') ? parseFloat(formData.get('priceDiscount')) : undefined,
        videoUrl: formData.get('videoUrl') || undefined,
        startLocation,
        locations,
        startDates,
        guides,
      };

      // Remove empty fields
      Object.keys(tourData).forEach(key => {
        if (tourData[key] === '' || tourData[key] === undefined) {
          delete tourData[key];
        }
      });

      const tourId = formData.get('tourId');
      const url = tourId 
        ? `/api/v1/tours/${tourId}`
        : '/api/v1/tours';

      let response;
      const hasNewFiles = formData.get('imageCover') || formData.getAll('images').length > 0;
      
      if (hasNewFiles) {
        // Use FormData for file uploads
        const finalFormData = new FormData();
        
        // Add all tour data fields
        Object.keys(tourData).forEach(key => {
          if (tourData[key] === undefined || tourData[key] === null) return;
          
          if (key === 'startLocation' || key === 'locations' || key === 'startDates' || key === 'guides') {
            // Stringify complex objects/arrays
            finalFormData.append(key, JSON.stringify(tourData[key]));
          } else if (Array.isArray(tourData[key]) || typeof tourData[key] === 'object') {
            finalFormData.append(key, JSON.stringify(tourData[key]));
          } else {
            finalFormData.append(key, tourData[key]);
          }
        });
        
        // Add files
        const imageCover = formData.get('imageCover');
        if (imageCover && imageCover.size > 0) {
          finalFormData.append('imageCover', imageCover);
        }
        
        const images = formData.getAll('images');
        images.forEach(img => {
          if (img && img.size > 0) {
            finalFormData.append('images', img);
          }
        });
        
        if (tourId) {
          response = await axios.patch(url, finalFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await axios.post(url, finalFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // No files, send JSON
        if (tourId) {
          response = await axios.patch(url, tourData);
        } else {
          response = await axios.post(url, tourData);
        }
      }

      showAlert('success', tourId ? 'Tour updated successfully!' : 'Tour created successfully!', 5);
      setTimeout(() => {
        window.location.href = '/admin/tours';
      }, 1500);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Something went wrong!', 5);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
};

// Handle tour deletion
export const handleTourDeletion = () => {
  const deleteButtons = document.querySelectorAll('.delete-tour-btn');
  if (!deleteButtons.length) return;

  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tourId = e.target.dataset.tourId;
      if (!tourId) return;

      if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
        return;
      }

      try {
        await axios.delete(`/api/v1/tours/${tourId}`);
        showAlert('success', 'Tour deleted successfully!', 5);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to delete tour!', 5);
      }
    });
  });
};

// Handle guide role changes
export const handleGuideManagement = () => {
  // Handle role changes via select dropdowns
  const roleSelects = document.querySelectorAll('.guide-role-select, .user-role-select');
  roleSelects.forEach(select => {
    select.addEventListener('change', async (e) => {
      const userId = e.target.dataset.userId;
      const newRole = e.target.value;
      
      if (!userId || !newRole) return;

      try {
        await axios.patch(`/api/v1/users/${userId}`, { role: newRole });
        showAlert('success', 'Role updated successfully!', 5);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to update role!', 5);
        e.target.value = e.target.getAttribute('data-original-value') || 'user';
      }
    });
  });

  // Handle remove guide (set role to user)
  const removeGuideButtons = document.querySelectorAll('.remove-guide-btn');
  removeGuideButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userId = e.target.dataset.userId;
      if (!userId) return;

      if (!confirm('Are you sure you want to remove this guide role? They will become a regular user.')) {
        return;
      }

      try {
        await axios.patch(`/api/v1/users/${userId}`, { role: 'user' });
        showAlert('success', 'Guide role removed successfully!', 5);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to remove guide role!', 5);
      }
    });
  });

  // Handle make guide button
  const makeGuideButtons = document.querySelectorAll('.make-guide-btn');
  makeGuideButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userId = e.target.dataset.userId;
      const role = e.target.dataset.role || 'guide';
      
      if (!userId) return;

      try {
        await axios.patch(`/api/v1/users/${userId}`, { role });
        showAlert('success', 'User assigned as guide successfully!', 5);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to assign guide role!', 5);
      }
    });
  });

  // Handle create guide form
  const createGuideForm = document.getElementById('create-guide-form');
  if (createGuideForm) {
    createGuideForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = createGuideForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(createGuideForm);
        const userData = {
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
          passwordConfirm: formData.get('passwordConfirm'),
          role: formData.get('role'),
        };

        // Use signup endpoint to create new user with role
        const response = await axios.post('/api/v1/users/signup', userData);
        
        showAlert('success', 'Guide account created successfully!', 5);
        createGuideForm.reset();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showAlert('error', err.response?.data?.message || 'Failed to create guide account!', 5);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
};

