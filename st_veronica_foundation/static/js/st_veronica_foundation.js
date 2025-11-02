/**
 * Global JavaScript for St. Veronica Foundation Website
 * Built for Wagtail CMS with compassion and healthcare focus
 * Implements smooth interactions, accessibility, and performance
 */

(function($) {
    'use strict';

    // Cache frequently used selectors
    const $window = $(window);
    const $document = $(document);
    const $body = $('body');

    // Store AJAX cache
    const ajaxCache = {};

    // Debounce function for performance
    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize all functionality when DOM is ready
    $document.ready(function() {
        initScrollAnimations();
        ajaxPrefetch();
        smoothScroll();
        handleModalEvents();
        interactiveButtons();
        accessibilityEnhancements();
        initPreloader();
        initFormSubmissions(); // Add form submission handler
    });

    /**
     * Initialize preloader fade effect
     */
    function initPreloader() {
        $('.preloader').fadeOut(800);
        
        // Fade in content wrapper on page load
        $('.content-wrapper').fadeTo(800, 1);

        // Use $body variable to remove preload class when done
        $body.removeClass('is-loading').addClass('is-loaded');
    }

    /**
     * Handle smooth scrolling for anchor links
     */
    function smoothScroll() {
        $('a[href^="#"]').on('click', function(e) {
            e.preventDefault();
            
            const target = $($(this).attr('href'));
            if (target.length) {
                const offset = target.offset().top - 80; // Adjust for fixed header
                
                if (prefersReducedMotion) {
                    // Skip animation for users who prefer reduced motion
                    $window.scrollTop(offset);
                } else {
                    $('html, body').stop().animate({
                        scrollTop: offset
                    }, 800, 'swing');
                }
            }
        });
    }

    /**
     * Initialize scroll animations and section reveals
     */
    function initScrollAnimations() {
        // Add fade-in class to elements when they enter viewport
        const fadeInElements = $('.fade-in');
        
        if (prefersReducedMotion) {
            // Show all elements immediately for users who prefer reduced motion
            fadeInElements.addClass('visible');
            return;
        }

        // Use Intersection Observer for better performance if available
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        $(entry.target).addClass('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            fadeInElements.each(function() {
                observer.observe(this);
            });
        } else {
            // Fallback for older browsers
            $window.on('scroll', debounce(function() {
                fadeInElements.each(function() {
                    const $element = $(this);
                    const elementTop = $element.offset().top;
                    const windowHeight = $window.height();
                    const scrollTop = $window.scrollTop();
                    
                    if (scrollTop + windowHeight > elementTop + 100) {
                        $element.addClass('visible');
                    }
                });
            }, 100));
        }
    }

    /**
     * Set up AJAX prefetching for performance
     */
    function ajaxPrefetch() {
        $('[data-prefetch="true"]').each(function() {
            const $element = $(this);
            const url = $element.attr('href') || $element.data('url');
            const responseType = $element.data('response-type') || 'default'; // Support for JSON responses
            
            if (url && !ajaxCache[url]) {
                // Prefetch on hover/focus
                $element.on('mouseenter focus', function() {
                    if (!ajaxCache[url]) {
                        $.ajax({
                            url: url,
                            method: 'GET',
                            dataType: responseType === 'json' ? 'json' : 'html', // Handle JSON responses
                            beforeSend: function() {
                                // Show loading indicator
                                $('.loading-spinner').addClass('show');
                                $body.addClass('ajax-loading');
                            },
                            success: function(data, textStatus, jqXHR) {
                                ajaxCache[url] = data;
                                $('.loading-spinner').removeClass('show');
                                $body.removeClass('ajax-loading').addClass('ajax-success');
                                
                                // Handle JSON responses
                                if (responseType === 'json') {
                                    handleJsonResponse(data, $element.data('json-handler') || 'default', {
                                        element: $element,
                                        url: url
                                    });
                                }
                                
                                // Log response headers for debugging (using jqXHR)
                                console.log('AJAX Prefetch Headers:', jqXHR.getAllResponseHeaders());
                            },
                            error: function(xhr, status, error) {
                                console.error('Prefetch failed:', error);
                                $('.loading-spinner').removeClass('show');
                                $body.removeClass('ajax-loading').addClass('ajax-error');

                                // Use the xhr, status, and error variables directly
                                console.warn(`XHR Status: ${xhr.status} (${status}) - ${error}`);

                                // Show user-friendly error
                                showNotification('Failed to preload content', 'error');
                            }
                        });
                    }
                });
                
                // Handle click to load prefetched content
                $element.on('click', function(e) {
                    // Check if this should be handled as an AJAX load
                    if ($element.hasClass('ajax-load') || responseType === 'json') {
                        e.preventDefault();
                        
                        if (ajaxCache[url]) {
                            if (responseType === 'json') {
                                handleJsonResponse(ajaxCache[url], $element.data('json-handler') || 'default', {
                                    element: $element,
                                    url: url
                                });
                            } else {
                                loadAjaxContent(ajaxCache[url]);
                            }
                        } else {
                            // Fetch if not cached
                            $.ajax({
                                url: url,
                                method: 'GET',
                                dataType: responseType === 'json' ? 'json' : 'html', // Handle JSON responses
                                beforeSend: function() {
                                    $('.loading-spinner').addClass('show');
                                    $body.addClass('ajax-loading');
                                },
                                success: function(data, textStatus, jqXHR) {
                                    ajaxCache[url] = data;
                                    $('.loading-spinner').removeClass('show');
                                    $body.removeClass('ajax-loading').addClass('ajax-success');
                                    
                                    if (responseType === 'json') {
                                        handleJsonResponse(data, $element.data('json-handler') || 'default', {
                                            element: $element,
                                            url: url
                                        });
                                    } else {
                                        loadAjaxContent(data);
                                    }

                                    // Use jqXHR variable for header logging
                                    console.log('AJAX Load Headers:', jqXHR.getAllResponseHeaders());
                                },
                                error: function(xhr, status, error) {
                                    $('.loading-spinner').removeClass('show');
                                    $body.removeClass('ajax-loading').addClass('ajax-error');
                                    
                                    console.error('Failed to load content:', error);
                                    console.warn(`XHR Response: ${xhr.responseText}`);
                                    console.info(`Error Type: ${status}`);
                                    
                                    showNotification('Failed to load content', 'error');
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    /**
     * Load AJAX content into container
     * @param {string} content - HTML content to load
     */
    function loadAjaxContent(content) {
        const $container = $('.ajax-container');
        if ($container.length) {
            if (prefersReducedMotion) {
                $container.html(content);
            } else {
                $container.fadeOut(300, function() {
                    $container.html(content).fadeIn(300);
                });
            }
            
            // Announce content change for screen readers
            announceToScreenReader('Content loaded successfully');
            
            // Re-initialize animations for new content
            setTimeout(initScrollAnimations, 100);
        }
    }

    /**
     * Handle interactive buttons with hover effects
     */
    function interactiveButtons() {
        // Add hover effects to buttons (subtle scale and glow)
        $('.btn-donate, .btn-cta').each(function() {
            const $button = $(this);
            
            if (!prefersReducedMotion) {
                $button.on('mouseenter focus', function() {
                    $(this).addClass('btn-hover');
                    $body.addClass('button-hovered');
                }).on('mouseleave blur', function() {
                    $(this).removeClass('btn-hover');
                    $body.removeClass('button-hovered');
                });
            }
            
            // Handle donate button click
            if ($button.hasClass('btn-donate')) {
                $button.on('click', function(e) {
                    e.preventDefault();
                    
                    // Show confirmation modal
                    $('#donateModal').modal('show');
                });
            }
        });
        
        // Handle Enter and Space key presses for buttons
        $document.on('keydown', '.btn', function(e) {
            if (e.keyCode === 13 || e.keyCode === 32) { // Enter or Space
                e.preventDefault();
                $(this).trigger('click');
            }
        });
    }

    /**
     * Handle modal events with accessibility
     */
    function handleModalEvents() {
        // Store last focused element
        let lastFocusedElement = null;
        
        // When modal opens
        $('.modal').on('show.bs.modal', function() {
            lastFocusedElement = document.activeElement;
            
            // Trap focus inside modal
            const $modal = $(this);
            $modal.attr('aria-hidden', 'false');
            
            // Move focus to modal
            setTimeout(function() {
                $modal.find('.modal-title').focus();
            }, 100);
        });
        
        // When modal hides
        $('.modal').on('hidden.bs.modal', function() {
            const $modal = $(this);
            $modal.attr('aria-hidden', 'true');
            
            // Return focus to last element
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        });
        
        // Handle modal confirmation
        $('.confirm-donation').on('click', function() {
            const $modal = $(this).closest('.modal');
            
            // Close modal with fade effect
            $modal.modal('hide');
            
            if (!prefersReducedMotion) {
                // Fade out content before redirect
                $('.content-wrapper').fadeTo(500, 0, function() {
                    window.location.href = '/donate/';
                });
            } else {
                window.location.href = '/donate/';
            }
        });
    }

    /**
     * Enhance accessibility features
     */
    function accessibilityEnhancements() {
        // Ensure all click handlers also respond to keyboard
        $document.on('keydown', '[role="button"], .interactive-element', function(e) {
            if (e.keyCode === 13 || e.keyCode === 32) { // Enter or Space
                e.preventDefault();
                $(this).trigger('click');
            }
        });
        
        // Add ARIA attributes dynamically
        $('.accordion').each(function() {
            const $accordion = $(this);
            $accordion.find('.accordion-button').attr('aria-expanded', 'false');
        });
    }

    /**
     * Show notification to user
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        if (!$('#notification-toast').length) {
            const toastHTML = `
                <div id="notification-toast" class="toast" role="alert" aria-live="polite" aria-atomic="true">
                    <div class="toast-body">
                        <span class="message"></span>
                    </div>
                </div>
            `;
            $('body').append(toastHTML);
        }
        
        const $toast = $('#notification-toast');
        $toast.find('.message').text(message);
        $toast.remove//Class('success error warning info').addClass(type);
        
        // Show toast
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const toast = new bootstrap.Toast($toast[0], { delay: 3000 });
            toast.show();
        } else {
            // Fallback for showing notification
            $toast.fadeIn().delay(3000).fadeOut();
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    function announceToScreenReader(message) {
        // Create aria-live region if it doesn't exist
        if (!$('#sr-announcement').length) {
            $('body').append('<div id="sr-announcement" aria-live="polite" class="sr-only"></div>');
        }
        
        // Update content to trigger announcement
        $('#sr-announcement').text(message);
    }

    /**
     * Lazy load images with data-src attribute
     */
    function lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const $img = $(entry.target);
                        const src = $img.data('src');
                        
                        if (src) {
                            $img.attr('src', src).removeClass('lazy');
                            imageObserver.unobserve(entry.target);
                        }
                    }
                });
            });
            
            $('img[data-src]').each(function() {
                imageObserver.observe(this);
            });
        }
    }

    /**
     * Initialize form submissions with JSON handling
     */
    function initFormSubmissions() {
        // Handle forms with data-json-form attribute
        $('form[data-json-form]').on('submit', function(e) {
            e.preventDefault();
            
            const $form = $(this);
            const url = $form.attr('action') || window.location.href;
            const method = $form.attr('method') || 'POST';
            const formData = $form.serializeArray();
            
            // Convert form data to object
            const data = {};
            $.each(formData, function(i, field) {
                data[field.name] = field.value;
            });
            
            // Send as JSON request
            sendJsonRequest(url, data, method, {
                formSelector: $form.selector || 'form[data-json-form]',
                responseType: 'form'
            });
        });
    }

    /**
     * Send JSON request to server
     * @param {string} url - Endpoint URL
     * @param {Object} data - Data to send
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {Object} options - Additional options
     * @returns {Promise} jQuery promise
     */
    function sendJsonRequest(url, data = {}, method = 'POST', options = {}) {
        const defaultOptions = {
            url: url,
            method: method,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $('.loading-spinner').addClass('show');
                $body.addClass('ajax-loading');
            }
        };
        
        // Merge default options with provided options
        const ajaxOptions = $.extend({}, defaultOptions, options);
        
        return $.ajax(ajaxOptions)
            .done(function(data, textStatus, jqXHR) {
                $('.loading-spinner').removeClass('show');
                $body.removeClass('ajax-loading').addClass('ajax-success');
                
                // Automatically handle JSON response if requested
                if (options.handleResponse !== false) {
                    handleJsonResponse(data, options.responseType || 'default', options);
                }
                
                // Log response headers
                console.log('JSON Request Headers:', jqXHR.getAllResponseHeaders());
            })
            .fail(function(xhr, status, error) {
                $('.loading-spinner').removeClass('show');
                $body.removeClass('ajax-loading').addClass('ajax-error');
                
                console.error('JSON Request failed:', error);
                console.warn(`XHR Status: ${xhr.status} (${status}) - ${error}`);
                
                // Try to parse JSON error response
                let errorMessage = 'Request failed';
                if (xhr.responseText) {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // Use default error message if parsing fails
                        errorMessage = xhr.responseText.substring(0, 100) + '...';
                    }
                }
                
                showNotification(errorMessage, 'error');
                
                // Trigger custom event for other scripts
                $document.trigger('stveronica.jsonRequestFailed', [xhr, status, error]);
            });
    }

    /**
     * Handle JSON response from AJAX requests
     * @param {Object} data - JSON data received from server
     * @param {string} responseType - Type of response to determine processing method
     * @param {Object} options - Additional options for handling the response
     */
    function handleJsonResponse(data, responseType = 'default', options = {}) {
        try {
            // Process based on response type
            switch(responseType) {
                case 'form':
                    processFormResponse(data, options);
                    break;
                case 'search':
                    processSearchResponse(data, options);
                    break;
                case 'notification':
                    processNotificationResponse(data, options);
                    break;
                default:
                    processJsonData(data, options);
            }
            
            // Log successful JSON handling
            console.log('JSON response handled successfully:', data);
            return true;
        } catch (error) {
            console.error('Error handling JSON response:', error);
            showNotification('Error processing server response', 'error');
            return false;
        }
    }

    /**
     * Process general JSON data
     * @param {Object} data - JSON data to process
     * @param {Object} options - Processing options
     */
    function processJsonData(data, options = {}) {
        // Handle common JSON response patterns
        if (data.message) {
            const type = data.success ? 'success' : 'error';
            showNotification(data.message, type);
        }
        
        if (data.redirect) {
            if (prefersReducedMotion) {
                window.location.href = data.redirect;
            } else {
                $('.content-wrapper').fadeTo(500, 0, function() {
                    window.location.href = data.redirect;
                });
            }
        }
        
        if (data.content) {
            loadAjaxContent(data.content);
        }
        
        // Trigger custom event for other scripts to listen to
        $document.trigger('stveronica.jsonProcessed', [data, options]);
    }

    /**
     * Process form submission JSON response
     * @param {Object} data - Form response data
     * @param {Object} options - Processing options
     */
    function processFormResponse(data, options = {}) {
        // Handle form-specific responses
        if (data.form_errors) {
            // Display form errors
            displayFormErrors(data.form_errors, options.formSelector);
        }
        
        if (data.form_success) {
            // Clear form and show success message
            if (options.formSelector) {
                $(options.formSelector)[0].reset();
            }
            showNotification(data.form_success, 'success');
        }
        
        // Process general data as well
        processJsonData(data, options);
    }

    /**
     * Process search JSON response
     * @param {Object} data - Search response data
     * @param {Object} options - Processing options
     */
    function processSearchResponse(data, options = {}) {
        // Handle search-specific responses
        if (data.search_results) {
            displaySearchResults(data.search_results, options.containerSelector);
        }
        
        if (data.search_query) {
            updateSearchQueryDisplay(data.search_query);
        }
        
        // Process general data as well
        processJsonData(data, options);
    }

    /**
     * Process notification JSON response
     * @param {Object} data - Notification response data
     * @param {Object} options - Processing options
     */
    function processNotificationResponse(data, options = {}) {
        // Handle notification-specific responses
        if (data.notifications) {
            data.notifications.forEach(notification => {
                showNotification(notification.message, notification.type || 'info');
            });
        }
        
        // Process general data as well
        processJsonData(data, options);
    }

    /**
     * Parse JSON response string
     * @param {string} jsonString - JSON string to parse
     * @returns {Object} Parsed JSON object
     */
    function parseJsonResponse(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            throw new Error('Invalid JSON response');
        }
    }

    /**
     * Display form errors in the UI
     * @param {Object} errors - Error object with field names as keys
     * @param {string} formSelector - Selector for the form element
     */
    function displayFormErrors(errors, formSelector) {
        // Clear previous errors
        $('.error-message').remove();
        $('.is-invalid').removeClass('is-invalid');
        
        // Display new errors
        Object.keys(errors).forEach(field => {
            const fieldSelector = `${formSelector} [name="${field}"]`;
            const $field = $(fieldSelector);
            
            if ($field.length) {
                $field.addClass('is-invalid');
                const errorMessage = errors[field];
                $field.after(`<div class="error-message text-danger">${errorMessage}</div>`);
            }
        });
        
        // Scroll to first error
        const $firstError = $(formSelector).find('.is-invalid').first();
        if ($firstError.length && !prefersReducedMotion) {
            $('html, body').animate({
                scrollTop: $firstError.offset().top - 100
            }, 500);
        }
    }

    /**
     * Display search results in the UI
     * @param {Array} results - Array of search result objects
     * @param {string} containerSelector - Selector for the results container
     */
    function displaySearchResults(results, containerSelector) {
        const $container = $(containerSelector);
        if (!$container.length) return;
        
        if (results.length === 0) {
            $container.html('<p>No results found.</p>');
            return;
        }
        
        let html = '<ul class="search-results">';
        results.forEach(result => {
            html += `
                <li class="search-result-item">
                    <h3><a href="${result.url}">${result.title}</a></h3>
                    <p>${result.excerpt}</p>
                </li>
            `;
        });
        html += '</ul>';
        
        if (prefersReducedMotion) {
            $container.html(html);
        } else {
            $container.fadeOut(300, function() {
                $container.html(html).fadeIn(300);
            });
        }
    }

    /**
     * Update search query display
     * @param {string} query - Search query string
     */
    function updateSearchQueryDisplay(query) {
        $('.search-query-display').text(query);
    }

    // Expose public methods
    window.StVeronicaFoundation = {
        initScrollAnimations: initScrollAnimations,
        ajaxPrefetch: ajaxPrefetch,
        smoothScroll: smoothScroll,
        handleModalEvents: handleModalEvents,
        showNotification: showNotification,
        announceToScreenReader: announceToScreenReader,
        lazyLoadImages: lazyLoadImages,
        // Add JSON response handling methods
        handleJsonResponse: handleJsonResponse,
        parseJsonResponse: parseJsonResponse,
        processJsonData: processJsonData,
        // Add new JSON request helper
        sendJsonRequest: sendJsonRequest
    };

})(jQuery);
