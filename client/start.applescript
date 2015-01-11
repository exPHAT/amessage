-- Start Messages.app if it was not already running
tell application "Messages"
	if it is not running then
		launch
	end if
end tell