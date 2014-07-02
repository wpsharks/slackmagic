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

		var threadedMsgs = []; // Initialize.

		$('#msgs_div').find('> .message:not(.show_user):not(.hidden)')
			.each(function()
			      {
				      var $this = $(this), $senderImage, $messageSender;
				      // Slack uses a `.first` class too; but it's a mystery how that works.
				      // It seems rather inconsistent; so here we rely upon `.show_user` only.
				      var $first = $this.prevAll('.message.show_user:not(.hidden)').first();

				      if(!($senderImage = $first.find('> .member_image').clone()).length)
					      $senderImage = $first.find('> a[href^="/services/"]').has('> .member_image');
				      $messageSender = $first.find('> .message_sender');

				      threadedMsgs.push({
					                        '$this'         : $this,
					                        '$first'        : $first,
					                        '$senderImage'  : $senderImage,
					                        '$messageSender': $messageSender
				                        });
			      });
		$.each(threadedMsgs, function(i, msg)
		{
			if(msg.$senderImage.length && msg.$messageSender.length)
			{
				msg.$this.addClass('show_user avatar');
				msg.$this.find('> .msg_actions').after(msg.$senderImage.clone());
				msg.$this.find('> .timestamp').before(msg.$messageSender.clone());
			}
		});
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