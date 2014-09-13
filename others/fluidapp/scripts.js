(function($)
{
	'use strict'; // Standards.

	var slack = {initialized: false};

	slack.init = function() // Initializer.
	{
		if(slack.initialized) return; // Already done.

		slack.escHtml = slack.escAttr = function(string)
		{
			if(/[&\<\>"']/.test(string = String(string)))
				string = string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
					string = string.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
			return string;
		};
		slack.plainText = function(string)
		{
			var lineBreak = '___lineBreak___', // Preserve line breaks.
				lineBreakedHtml = String(string).replace(/\<br(?:\s*\/)?\>/gi, lineBreak)
					.replace(/<p(?:\s+[^>]*)?>(.*?)<\/p>/gi, lineBreak + '$1' + lineBreak);
			return $.trim($('<div>').html(lineBreakedHtml).text().replace(new RegExp(lineBreak, 'g'), '\n'));
		};
		slack.getWinSelection = function()
		{
			var selection = getSelection();

			if(!selection.rangeCount)
				return; // No selection.

			var $container = $('<div>'); // Holds the selection.
			for(var i = 0, length = selection.rangeCount; i < length; i++)
				$container.append(selection.getRangeAt(i).cloneContents());

			return slack.plainText($container.html());
		};
		slack.getWinSelectionParent = function()
		{
			var selection = getSelection();

			if(!selection.rangeCount)
				return; // No selection.

			return selection.getRangeAt(0).endContainer;
		};
		slack.moveMsgCursorToEnd = function()
		{
			slack.$msg[0].scrollTop = slack.$msg[0].scrollHeight;
			slack.$msg[0].selectionStart = slack.$msg[0].selectionEnd = slack.$msg.val().length;
		};
		slack.sendMsgInputEventForAutosizing = function()
		{
			var event = document.createEvent('HTMLEvents');
			event.initEvent('input', true, true);
			slack.$msg[0].dispatchEvent(event);
		};
		slack.winSelectionParentMentionName = function()
		{
			var $parentMsg, _memberService, teamMember, serviceName,
				$winSelectionParent = $(slack.getWinSelectionParent());

			if(($parentMsg = $winSelectionParent.closest('.message.show_user:not(.hidden)')).length
			   && (_memberService = $parentMsg.find('> a[data-member-id][href^="/team/"]').first().attr('href')))
				teamMember = _memberService.replace(/^\/team\//ig, '');

			else if(($parentMsg = $winSelectionParent.closest('.message.show_user:not(.hidden)')).length
			        && ((_memberService = $parentMsg.find('> span.message_sender > a[href^="/services/"]').not(':has(img)').first().html())
			            || (_memberService = $parentMsg.find('> span.message_sender').first().html())))
				serviceName = slack.plainText(_memberService);

			else if(($parentMsg = $winSelectionParent.closest('.message:not(.hidden)').prevAll('.message.show_user:not(.hidden)').first()).length
			        && (_memberService = $parentMsg.find('> a[data-member-id][href^="/team/"]').first().attr('href')))
				teamMember = _memberService.replace(/^\/team\//ig, '');

			else if(($parentMsg = $winSelectionParent.closest('.message:not(.hidden)').prevAll('.message.show_user:not(.hidden)').first()).length
			        && ((_memberService = $parentMsg.find('> span.message_sender > a[href^="/services/"]').not(':has(img)').first().html())
			            || (_memberService = $parentMsg.find('> span.message_sender').first().html())))
				serviceName = slack.plainText(_memberService);

			if(teamMember) return '@' + teamMember;

			if(serviceName) // No `@` callout in this case.
				return serviceName; // e.g. `GitHub`.

			return '@[unknown]'; // Default behavior.
		};
		$('body').on('keydown', function(event)
		{
			if(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.which !== 82)
				return; // Not the `R` key by itself; nothing to do in this case.

			var winSelection = slack.getWinSelection();
			if(!winSelection) return; // No selection.

			event.stopImmediatePropagation(), // Stop other event handlers.
				event.preventDefault(); // Prevent default behavior.
		});
		$('body').on('keyup', function(event)
		{
			if(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.which !== 82)
				return; // Not the `R` key by itself; nothing to do in this case.

			var winSelection = slack.getWinSelection();
			if(!winSelection) return; // No selection.

			event.stopImmediatePropagation(), // Stop other event handlers.
				event.preventDefault(); // Prevent default behavior.

			var val = $.trim(slack.$msg.val()),
				newVal = val; // Start w/ current value.

			newVal += '\n\n' + $.trim(slack.winSelectionParentMentionName()) + ' writes...\n';
			newVal += winSelection.replace(/^/gm, '> ');
			newVal = $.trim(newVal) + '\n---- ';

			slack.$msg.val(newVal), slack.$msg.focus(), slack.moveMsgCursorToEnd(),
				slack.sendMsgInputEventForAutosizing();
		});
	};
	slack.initializer = function()
	{
		if($.isReady && (slack.$msg = $('textarea#message-input')).length)
			clearInterval(slack.initializerInterval), slack.init(),
				slack.initialized = true; // All set now :-)
	};
	slack.initializerInterval = setInterval(slack.initializer, 1000);
})(jQuery);
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

		$('#msgs_div').find('> .message.bot_message:not(.via-hipchat):not(.no-divider)')
			.filter(function() // Those preceeded by a non-bot|hipchat message.
			        {
				        var $this = $(this), $prev = $this.prev();
				        return !($prev.hasClass('bot_message') && !$prev.hasClass('via-hipchat'));

			        }).addClass('no-divider');

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

		var $body = $('body'), threadedMsgs = [];
		var denseTheme = $body.hasClass('dense_theme');
		var noAvatars = $body.hasClass('no_avatars');

		$('#msgs_div').find('> .message:not(.show_user):not(.hidden)')
			.each(function()
			      {
				      var $this = $(this), $senderImage, $messageSender;
				      // Slack uses a `.first` class too; but it's a mystery how that works.
				      // It seems rather inconsistent; so here we rely upon `.show_user` only.
				      var $first = $this.prevAll('.message.show_user:not(.hidden)').first();

				      if(!($senderImage = $first.find('> .member_image').first().clone()).length)
					      $senderImage = $first.find('> a[href^="/services/"]').has('> .member_image').first();
				      $messageSender = $first.find('> .message_sender').first();

				      threadedMsgs.push({
					                        '$this'         : $this,
					                        '$first'        : $first,
					                        '$senderImage'  : $senderImage,
					                        '$messageSender': $messageSender
				                        });
			      });
		$.each(threadedMsgs, function(i, msg)
		{
			if((noAvatars || msg.$senderImage.length)
			   && msg.$messageSender.length)
			{
				msg.$this.addClass('show_user');
				if(!noAvatars) msg.$this.addClass('avatar');
				if(!noAvatars) msg.$this.find('> .msg_actions').first().after(msg.$senderImage.clone());
				msg.$this.find('> .timestamp').first()[denseTheme ? 'after' : 'before'](msg.$messageSender.clone());
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