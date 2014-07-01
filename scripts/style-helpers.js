(function($)
{
	'use strict'; // Standards.

	var slack = {initialized: false, timeout: 0};

	slack.init = function() // Initializer.
	{
		if(slack.initialized) return; // Already done.

		$('#msgs_div').on('DOMSubtreeModified', function()
		{
			clearTimeout(slack.timeout), // Clear previous timeout.
				slack.timeout = setTimeout(slack.onDOMSubtreeModified, 500);

		}).trigger('DOMSubtreeModified');
	};
	slack.onDOMSubtreeModified = function()
	{
		$('#msgs_div').find('> .message').has('> .message_sender[class*="via_HipChat"]')
			.addClass('via-hipchat'); // Mark via HipChat for CSS styles.
	};
	slack.initializer = function()
	{
		if((slack.$msg = $('textarea#message-input')).length)
			clearInterval(slack.initializerInterval), slack.init(),
				slack.initialized = true; // All set now :-)
	};
	slack.initializerInterval = setInterval(slack.initializer, 1000);
})(jQuery);