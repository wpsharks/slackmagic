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
			var $winSelectionParent = $(slack.getWinSelectionParent());
			var $parentMsg, _memberService, teamMember, serviceName;

			if(($parentMsg = $winSelectionParent.closest('.message.show_user:not(.hidden)')).length
			   && (_memberService = $parentMsg.find('> a[data-member-id][href^="/team/"]').first().attr('href')))
				teamMember = _memberService.replace(/^\/team\//ig, '');

			else if(($parentMsg = $winSelectionParent.closest('.message.show_user:not(.hidden)')).length
			        && ((_memberService = $parentMsg.find('> span.message_sender > a[href^="/services/"]:not:has(img)').first().html())
			            || (_memberService = $parentMsg.find('> span.message_sender').first().html())))
				serviceName = slack.plainText(_memberService);

			else if(($parentMsg = $winSelectionParent.closest('.message:not(.hidden)').prevAll('.message.show_user:not(.hidden)').first()).length
			        && (_memberService = $parentMsg.find('> a[data-member-id][href^="/team/"]').first().attr('href')))
				teamMember = _memberService.replace(/^\/team\//ig, '');

			else if(($parentMsg = $winSelectionParent.closest('.message:not(.hidden)').prevAll('.message.show_user:not(.hidden)').first()).length
			        && ((_memberService = $parentMsg.find('> span.message_sender > a[href^="/services/"]:not:has(img)').first().html())
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