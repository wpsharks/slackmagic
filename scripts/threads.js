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
		var threadedMsgs = []; // Initialize.
		$('#msgs_div').find('> .message:not(.show_user)')
			.each(function()
			      {
				      var $this = $(this), $senderImage, $messageSender;
				      var $first = $this.prevAll('.message.show_user').first();

				      if(!($senderImage = $first.find('> .member_image').clone()).length)
					      $senderImage = $first.find('> a[href^="/services/"]').has('> .member_image');
				      $messageSender = $first.find('> .message_sender');

				      threadedMsgs.push({
					                        '$this'         : $this,
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
	};
	slack.initializer = function()
	{
		if((slack.$msg = $('textarea#message-input')).length)
			clearInterval(slack.initializerInterval), slack.init(),
				slack.initialized = true; // All set now :-)
	};
	slack.initializerInterval = setInterval(slack.initializer, 1000);
})(jQuery);