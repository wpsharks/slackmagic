(function($)
{
	'use strict'; // Standards.

	var slack = {
		initialized                : false,
		onDOMSubtreeModifiedTimeout: 0,
		onDOMSubtreeModifiedRunning: false
	};
	slack.init = function() // Initializer.
	{
		if(slack.initialized) return; // Already done.

		$('#msgs_div').on('DOMSubtreeModified', function()
		{
			if(slack.onDOMSubtreeModifiedRunning) return;

			clearTimeout(slack.onDOMSubtreeModifiedTimeout), // Clear previous timeout.
				slack.onDOMSubtreeModifiedTimeout = setTimeout(slack.onDOMSubtreeModified, 500);

		}).trigger('DOMSubtreeModified');
	};
	slack.onDOMSubtreeModified = function()
	{
		slack.onDOMSubtreeModifiedRunning = true;

		$('#msgs_div').find('> .message').has('> .message_sender[class*="via_HipChat"]')
			.addClass('via-hipchat'); // Mark via HipChat for CSS styles.

		var current_user_name = $.trim($('#current_user_name').text());
		$('#msgs_div > .message > .message_content a.internal_member_link[data-member-name="' + current_user_name + '"],' +
		  '#member_mentions > .message > .message_content a.internal_member_link[data-member-name="' + current_user_name + '"],' +
		  '#search_message_results > .message > .message_content a.internal_member_link[data-member-name="' + current_user_name + '"]')
			.addClass('internal_current_member_link');

		slack.onDOMSubtreeModifiedRunning = false;
	};
	slack.initializer = function()
	{
		if($.isReady && $('#msgs_div > div').length && $('textarea#message-input').length)
			clearInterval(slack.initializerInterval), slack.init(),
				slack.initialized = true; // All set now :-)
	};
	slack.initializerInterval = setInterval(slack.initializer, 1000);
})(jQuery);