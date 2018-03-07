pragma solidity ^0.4.20;

// Booking smart contract
contract Booking {
    
    // This is an event that we raise after every succesfull reservation
    // You can find useful informations about events here: 
    // https://solidity.readthedocs.io/en/develop/contracts.html#events
    event Booked(address booker, uint meetingRoom, uint[] timeSlots);
	event Canceled(address booker, uint meetingRoom, uint[] timeSlots);

    // https://solidity.readthedocs.io/en/develop/types.html#structs
    struct MeetingRoom {
        bytes32 name;
        mapping(uint => address) bookerPerSlots;
    }

    MeetingRoom[] public meetingRooms;

    // In Solidity a modifier is a function that is often used to check a condition prior to executing the function
    // https://solidity.readthedocs.io/en/develop/contracts.html#function-modifiers
    modifier notUbiquitous(uint meetingRoom, uint[] timeSlots) {
        bool ubiquitous = false;
        
        for (uint i = 0; i < meetingRooms.length && !ubiquitous; i++) {
            if (i != meetingRoom) {
                for (uint j = 0; j < timeSlots.length && !ubiquitous; j++) {				
					ubiquitous = isSlotBookedBySender(i, timeSlots[j]);
                }
            }
        }
        
        require(!ubiquitous); // You can't book different rooms at the same time!
        _;
    }

    // Please note the _ sign, it's mandatory 
    modifier slotsAvailable(uint meetingRoom, uint[] timeSlots) {
        bool available = true;
        
        for (uint i = 0; i < timeSlots.length && available; i++) {
			available = isSlotAvailable(meetingRoom, timeSlots[i]);
        }
        
        require(available); // Sorry, one or more selected slots are already booked
        _;
    }
    
	modifier canCancel(uint meetingRoom, uint[] timeSlots) {
		bool bookedBySender = true;
        
        for (uint i = 0; i < timeSlots.length && bookedBySender; i++) {
			bookedBySender = isSlotBookedBySender(meetingRoom, timeSlots[i]);
        }
        
        require(bookedBySender); // You're trying to cancel others bookings!!
        _;
	}

    function getTimeSlotBookerAddress(uint meetingRoom, uint timeSlot) private view returns (address) {
        return meetingRooms[meetingRoom].bookerPerSlots[timeSlot];
    }

	function isSlotAvailable(uint meetingRoom, uint timeSlot) public view returns (bool) {
		return getTimeSlotBookerAddress(meetingRoom, timeSlot) == address(0x0);
	}
	
	function isSlotBookedBySender(uint meetingRoom, uint timeSlot) public view returns (bool) {
		return getTimeSlotBookerAddress(meetingRoom, timeSlot) == msg.sender;
	}
	
	function cancel(uint meetingRoom, uint[] timeSlots) public canCancel(meetingRoom, timeSlots) {
		for (uint i = 0; i < timeSlots.length; i++) {
            meetingRooms[meetingRoom].bookerPerSlots[timeSlots[i]] = address(0x0);
        }

        Canceled(msg.sender, meetingRoom, timeSlots);
	}

    function book(uint meetingRoom, uint[] timeSlots) public slotsAvailable(meetingRoom, timeSlots) notUbiquitous(meetingRoom, timeSlots) {
        for (uint i = 0; i < timeSlots.length; i++) {
            meetingRooms[meetingRoom].bookerPerSlots[timeSlots[i]] = msg.sender;
        }

        Booked(msg.sender, meetingRoom, timeSlots);
    }
	
	// Constructor of the contract
    function Booking(bytes32[] names) public {
        for (uint i = 0; i < names.length; i++) {
            meetingRooms.push(MeetingRoom({ name: names[i] }));
        }      
    }
}