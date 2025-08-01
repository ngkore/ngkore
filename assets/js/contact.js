document.addEventListener("DOMContentLoaded", function () {
  // CONFIGURATIONS
  const GOOGLE_SCRIPT_URL = "{{CONTACT_FORM_URL}}"; // This will be replaced by GitHub Actions
  
  // Check if we're in development mode (URL not replaced)
  const isDevelopment = !GOOGLE_SCRIPT_URL.startsWith("https://script.google.com");

  const contactForm = document.getElementById("contact-form");
  
  if (!contactForm) {
    return;
  }
  
  const submitButton = contactForm.querySelector('button[type="submit"]');
  if (!submitButton) {
    return;
  }
  
  const submitButtonText = submitButton.querySelector("span");
  const submitButtonIcon = submitButton.querySelector("svg");

  // Track submission state to prevent duplicates
  let isSubmitting = false;

  // Handle Form Submission
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Clear any previous messages
    hideMessage();

    // Get form data manually to ensure all fields are captured
    const formObject = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      organization: document.getElementById("organization").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    // Validate form
    if (!validateForm(formObject)) {
      return;
    }

    // Mark as submitting to prevent duplicates
    isSubmitting = true;

    // Show loading state
    showLoadingState();

    // Handle development vs production
    if (isDevelopment) {
      // Simulate form submission in development
      setTimeout(() => {
        hideLoadingState();
        showSuccessMessage();
        contactForm.reset();
        isSubmitting = false;
      }, 2000);
    } else {
      // Send to Google Apps Script in production
      
      fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(formObject),
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Use no-cors mode to bypass CORS policy
      })
        .then(async (response) => {
          // With no-cors mode, we can't read response details, so assume success
          // The Google Apps Script will still process the form and send emails
          
          hideLoadingState();
          showSuccessMessage();
          contactForm.reset();
          isSubmitting = false;
        })
        .catch((error) => {
          hideLoadingState();
          showErrorMessage("Unable to submit form. Please try again or contact us directly.");

          // Reset submission flag after error
          isSubmitting = false;
        });
    }
  });

  // Validation
  function validateForm(data) {
    const errors = [];

    // Check required fields
    if (!data.firstName || data.firstName.length === 0) {
      errors.push("First name is required");
    }

    if (!data.lastName || data.lastName.length === 0) {
      errors.push("Last name is required");
    }

    if (!data.email || data.email.length === 0) {
      errors.push("Email is required");
    } else if (!isValidEmail(data.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!data.subject || data.subject.length === 0) {
      errors.push("Subject is required");
    } else if (data.subject.length < 3) {
      errors.push("Subject must be at least 3 characters long");
    }

    if (!data.message || data.message.length === 0) {
      errors.push("Message is required");
    } else if (data.message.length < 10) {
      errors.push("Message must be at least 10 characters long");
    }

    if (errors.length > 0) {
      showErrorMessage(
        "Please fix the following issues:<br>• " + errors.join("<br>• ")
      );
      return false;
    }
    return true;
  }

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // UI helpers
  function showLoadingState() {
    submitButton.disabled = true;
    submitButtonText.textContent = "Sending...";
    submitButtonIcon.style.display = "none";
    hideMessage(); // Hide any previous messages
  }

  function hideLoadingState() {
    submitButton.disabled = false;
    submitButtonText.textContent = "Send Message";
    submitButtonIcon.style.display = "inline-block";
  }

  function showSuccessMessage(customMessage) {
    const message = customMessage || "Message sent successfully! We will get back to you soon.";
    showMessage(message, "success");

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      hideMessage();
    }, 5000);
  }

  function showErrorMessage(msg) {
    showMessage("❌ " + msg, "error");
  }

  function showMessage(message, type) {
    const messageElement = document.getElementById("form-message");

    if (!messageElement) {
      return;
    }

    // Use innerHTML to support line breaks and bullets
    messageElement.innerHTML = message.replace(/\n/g, "<br>");
    messageElement.className = `form-message ${type}`;
    messageElement.style.display = "block";

    // Scroll to message smoothly
    messageElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideMessage() {
    const messageElement = document.getElementById("form-message");
    messageElement.style.display = "none";
    messageElement.className = "form-message";
  }
});
