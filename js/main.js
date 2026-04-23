// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {

  // Get all submit buttons on the page
  const buttons = document.querySelectorAll('button');

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {

      // Get all inputs and textareas on the page
      const inputs = document.querySelectorAll('input, textarea, select');
      let allFilled = true;

      inputs.forEach(function(input) {
        if (input.value === '') {
          allFilled = false;
          input.style.border = '2px solid red';
        } else {
          input.style.border = '2px solid green';
        }
      });

      if (!allFilled) {
        alert('Please fill in all fields.');
      } else {
        // Check if this is register page
        const passwords = document.querySelectorAll('input[type="password"]');
        if (passwords.length === 2) {
          if (passwords[0].value !== passwords[1].value) {
            alert('Passwords do not match.');
            return;
          }
          alert('Account created successfully! Welcome to Stonebridge Trust.');
        } else if (passwords.length === 1) {
          alert('Logging you in...');
        } else {
          alert('Message sent! We will get back to you within 24 hours.');
        }
      }
    });
  });

})